import { useState } from "react";
import type { Dream, LicenseType } from "../types/database";
import { invokeNftMint, type MintFunctionResult } from "../lib/syncApi";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useDreamStore } from "../store/useDreamStore";

interface MintParams {
  dream: Dream;
  licenseType: LicenseType;
  royaltyBps: number;
}

function createLocalMintPreview(dream: Dream): MintFunctionResult {
  const suffix = dream.id.replace(/-/g, "").slice(0, 10) || Date.now().toString(16);

  return {
    token_id: `local-${suffix}`,
    contract_address: "local-preview-contract",
    tx_hash: `local-preview-${suffix}-${Date.now().toString(16)}`,
  };
}

export function useNFTMinting() {
  const updateDream = useDreamStore((state) => state.updateDream);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [lastMintedDreamId, setLastMintedDreamId] = useState<string | null>(null);

  const mintDream = async ({ dream, licenseType, royaltyBps }: MintParams) => {
    setIsMinting(true);
    setMintError(null);

    try {
      const result = isSupabaseConfigured
        ? await invokeNftMint({
            dream_id: dream.id,
            license_type: licenseType,
            royalty_bps: royaltyBps,
          })
        : createLocalMintPreview(dream);

      await updateDream(dream.id, {
        license_type: licenseType,
        royalty_bps: royaltyBps,
        nft_token_id: result.token_id,
        nft_contract_address: result.contract_address,
        nft_tx_hash: result.tx_hash,
      });

      setLastMintedDreamId(dream.id);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Minting failed";
      setMintError(message);
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  return {
    isMinting,
    mintError,
    lastMintedDreamId,
    mintDream,
  };
}
