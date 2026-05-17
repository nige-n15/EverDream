import { createThirdwebClient, getContract, prepareContractCall, readContract, sendAndConfirmTransaction } from "npm:thirdweb";
import { polygon, polygonAmoy } from "npm:thirdweb/chains";
import { privateKeyToAccount } from "npm:thirdweb/wallets";
import { assertMethod, errorResponse, handleCors, HttpError, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

interface NftMintRequest {
  dream_id: string;
  license_type: string;
  royalty_bps: number;
}

function requireThirdwebConfig() {
  const secretKey = Deno.env.get("THIRDWEB_SECRET_KEY");
  const privateKey = Deno.env.get("THIRDWEB_MINTER_PRIVATE_KEY");
  const contractAddress = Deno.env.get("THIRDWEB_CONTRACT_ADDRESS");
  const chainName = (Deno.env.get("THIRDWEB_CHAIN") ?? "amoy").toLowerCase();

  if (!secretKey || !privateKey || !contractAddress) {
    throw new HttpError(500, "Missing Thirdweb configuration");
  }

  return {
    secretKey,
    privateKey,
    contractAddress,
    chain: chainName === "polygon" ? polygon : polygonAmoy,
    network: chainName === "polygon" ? "polygon" : "amoy",
  };
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);

  if (corsResponse) {
    return corsResponse;
  }

  try {
    assertMethod(request, "POST");

    const { user, adminClient } = await requireUser(request);
    const body = await readJsonBody<NftMintRequest>(request);

    if (!body.dream_id) {
      throw new HttpError(400, "dream_id is required");
    }

    const { data: allowed, error: rateLimitError } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "nft-mint",
      p_limit: Number(Deno.env.get("NFT_MINT_RATE_LIMIT") ?? "5"),
      p_window_seconds: Number(Deno.env.get("NFT_MINT_RATE_WINDOW_SECONDS") ?? "3600"),
    });

    if (rateLimitError) {
      throw new HttpError(500, "Failed to evaluate mint rate limit", rateLimitError);
    }

    if (!allowed) {
      throw new HttpError(429, "NFT mint rate limit exceeded");
    }

    const { data: dream, error: dreamError } = await adminClient
      .from("dreams")
      .select("id, user_id, narrative, themes, valence, xp_score, media_storage_path, nft_token_id")
      .eq("id", body.dream_id)
      .single();

    if (dreamError || !dream) {
      throw new HttpError(404, "Dream not found", dreamError);
    }

    if (dream.user_id !== user.id) {
      throw new HttpError(403, "You do not own this dream");
    }

    if (dream.nft_token_id) {
      throw new HttpError(409, "Dream has already been minted");
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.wallet_address) {
      throw new HttpError(409, "Wallet address is required before minting", profileError);
    }

    const { secretKey, privateKey, contractAddress, chain, network } = requireThirdwebConfig();
    const client = createThirdwebClient({ secretKey });
    const account = privateKeyToAccount({
      client,
      privateKey,
    });
    const contract = getContract({
      client,
      chain,
      address: contractAddress as `0x${string}`,
    });

    const nextTokenId = await readContract({
      contract,
      method: "function nextTokenId() view returns (uint256)",
      params: [],
    });

    const transaction = prepareContractCall({
      contract,
      method:
        "function mintDream(address recipient, string narrativeHash, uint256 xpScore, string[] themes, int8 valence)",
      params: [
        profile.wallet_address,
        dream.media_storage_path ?? dream.id,
        BigInt(Math.max(0, Math.round(Number(dream.xp_score) * 100))),
        dream.themes ?? [],
        dream.valence,
      ],
    });

    const receipt = await sendAndConfirmTransaction({
      account,
      transaction,
    });

    const tokenId = nextTokenId.toString();
    const txHash = receipt.transactionHash;

    const { error: registryError } = await adminClient.from("nft_registry").upsert({
      token_id: tokenId,
      dream_id: dream.id,
      contract_address: contractAddress,
      network,
      metadata_ipfs_hash: dream.media_storage_path,
      owner_address: profile.wallet_address,
    });

    if (registryError) {
      throw new HttpError(500, "Mint succeeded but registry update failed", registryError);
    }

    const { error: dreamUpdateError } = await adminClient
      .from("dreams")
      .update({
        nft_token_id: tokenId,
        nft_contract_address: contractAddress,
        nft_tx_hash: txHash,
        license_type: body.license_type,
        royalty_bps: body.royalty_bps,
      })
      .eq("id", dream.id)
      .eq("user_id", user.id);

    if (dreamUpdateError) {
      throw new HttpError(500, "Mint succeeded but dream update failed", dreamUpdateError);
    }

    const webhookUrl = Deno.env.get("NFT_WEBHOOK_URL");

    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dream_id: dream.id,
          token_id: tokenId,
          tx_hash: txHash,
          contract_address: contractAddress,
          network,
          owner_address: profile.wallet_address,
        }),
      }).catch((error) => console.warn("NFT webhook failed", error));
    }

    return jsonResponse({
      tx_hash: txHash,
      token_id: tokenId,
      contract_address: contractAddress,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
