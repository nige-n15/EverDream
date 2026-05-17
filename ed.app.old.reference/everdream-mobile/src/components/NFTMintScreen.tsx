import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useDreamStore } from "../store/useDreamStore";
import { useAppPreferencesStore } from "../store/useAppPreferencesStore";
import type { Dream, LicenseType } from "../types/database";
import { everdreamTheme } from "../theme/everdreamTheme";
import { useNFTMinting } from "../hooks/useNFTMinting";
import { isSupabaseConfigured } from "../lib/supabaseClient";

const licenseOptions: LicenseType[] = ["CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "ALL-RIGHTS-RESERVED"];
const walletPattern = /^0x[a-fA-F0-9]{40}$/;

export function NFTMintScreen() {
  const { dreams, isOnline, updateDream } = useDreamStore(useShallow((state) => ({
    dreams: state.dreams,
    isOnline: state.isOnline,
    updateDream: state.updateDream,
  })));
  const { profile } = useAppPreferencesStore(useShallow((state) => ({
    profile: state.profile,
  })));
  const { isMinting, mintError, lastMintedDreamId, mintDream } = useNFTMinting();

  const mintableDreams = useMemo(
    () => [...dreams].filter((dream) => dream.xp_score > 0).sort((left, right) => right.xp_score - left.xp_score),
    [dreams],
  );
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(mintableDreams[0]?.id ?? null);
  const selectedDream = mintableDreams.find((dream) => dream.id === selectedDreamId) ?? mintableDreams[0] ?? null;
  const [licenseType, setLicenseType] = useState<LicenseType>("CC-BY-SA-4.0");
  const [royaltyBps, setRoyaltyBps] = useState(300);

  useEffect(() => {
    if (!selectedDream) {
      return;
    }

    setLicenseType(selectedDream.license_type);
    setRoyaltyBps(selectedDream.royalty_bps);
  }, [selectedDream]);

  const readiness = useMemo(() => {
    return {
      hasDream: Boolean(selectedDream),
      hasWallet: walletPattern.test(profile.wallet_address.trim()),
      isOnline: isSupabaseConfigured ? isOnline : true,
      isScored: Boolean(selectedDream?.xp_score && selectedDream.xp_score > 0),
      alreadyMinted: Boolean(selectedDream?.nft_token_id),
    };
  }, [selectedDream, profile.wallet_address, isOnline]);

  const mintReadinessText = useMemo(() => {
    if (!selectedDream) {
      return "Choose a scored dream first.";
    }

    if (selectedDream.nft_token_id) {
      return "Already minted on chain.";
    }

    if (!walletPattern.test(profile.wallet_address.trim())) {
      return "Add a valid 0x wallet in Profile before minting.";
    }

    if (isSupabaseConfigured && !isOnline) {
      return "Minting needs a live network connection.";
    }

    if (!isSupabaseConfigured) {
      return "Ready to create a local mint proof. Add Supabase secrets to mint on chain.";
    }

    return "Ready to mint on Polygon Amoy testnet.";
  }, [selectedDream, profile.wallet_address, isOnline]);

  const handleMint = async () => {
    if (!selectedDream || selectedDream.nft_token_id) {
      return;
    }

    try {
      await mintDream({
        dream: selectedDream,
        licenseType,
        royaltyBps,
      });
    } catch {
      await updateDream(selectedDream.id, {
        license_type: licenseType,
        royalty_bps: royaltyBps,
      });
    }
  };

  const isMintDisabled = !readiness.hasDream || !readiness.hasWallet || !readiness.isOnline || readiness.alreadyMinted || isMinting;
  const buttonLabel = isMinting ? "Minting..." : isSupabaseConfigured ? "Mint on Amoy" : "Create Local Proof";

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroBand}>
        <Text style={styles.eyebrow}>NFT MINTING</Text>
        <Text style={styles.title}>Chain Desk</Text>
        <Text style={styles.subtitle}>
          Package the scored dream as a soulbound proof with license, royalties, and a readable mint readiness check.
        </Text>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Scored Dreams</Text>
        {mintableDreams.length === 0 ? (
          <Text style={styles.emptyText}>Score a dream first. Minting only opens once XP has been saved.</Text>
        ) : (
          <View style={styles.selectorColumn}>
            {mintableDreams.map((dream) => {
              const selected = dream.id === selectedDream?.id;
              return (
                <Pressable
                  key={dream.id}
                  onPress={() => setSelectedDreamId(dream.id)}
                  style={[styles.dreamRow, selected ? styles.dreamRowActive : null]}
                >
                  <View style={styles.dreamRowCopy}>
                    <Text style={styles.dreamRowScore}>{dream.xp_score} XP</Text>
                    <Text style={styles.dreamRowText} numberOfLines={2}>{dream.narrative}</Text>
                  </View>
                  <Text style={styles.dreamRowMeta}>{dream.nft_token_id ? "minted" : "ready"}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {selectedDream ? (
        <>
          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Metadata Preview</Text>
            <View style={styles.previewFrame}>
              <Text style={styles.previewTitle}>Dream proof #{selectedDream.nft_token_id ?? "pending"}</Text>
              <Text style={styles.previewNarrative} numberOfLines={5}>{selectedDream.narrative}</Text>
              <View style={styles.previewMetaRow}>
                <Text style={styles.previewMeta}>XP {selectedDream.xp_score}</Text>
                <Text style={styles.previewMeta}>Themes {selectedDream.themes.join(", ") || "none yet"}</Text>
              </View>
              <View style={styles.previewMetaRow}>
                <Text style={styles.previewMeta}>Valence {selectedDream.valence}</Text>
                <Text style={styles.previewMeta}>Privacy {selectedDream.privacy}</Text>
              </View>
            </View>
          </View>

          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Mint Controls</Text>
            <Text style={styles.fieldLabel}>License</Text>
            <View style={styles.licenseWrap}>
              {licenseOptions.map((option) => {
                const selected = option === licenseType;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setLicenseType(option)}
                    style={[styles.licenseChip, selected ? styles.licenseChipActive : null]}
                  >
                    <Text style={[styles.licenseChipText, selected ? styles.licenseChipTextActive : null]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Royalty</Text>
            <View style={styles.royaltyRow}>
              <Pressable onPress={() => setRoyaltyBps((current) => Math.max(0, current - 50))} style={styles.stepButton}>
                <Text style={styles.stepButtonText}>-50</Text>
              </Pressable>
              <View style={styles.royaltyReadout}>
                <Text style={styles.royaltyLabel}>bps</Text>
                <Text style={styles.royaltyValue}>{royaltyBps}</Text>
              </View>
              <Pressable onPress={() => setRoyaltyBps((current) => Math.min(1000, current + 50))} style={styles.stepButton}>
                <Text style={styles.stepButtonText}>+50</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.band}>
            <Text style={styles.sectionTitle}>Readiness</Text>
            <View style={styles.checklist}>
              <Text style={styles.checkItem}>{readiness.hasWallet ? "Wallet valid" : "Wallet missing or invalid"}</Text>
              <Text style={styles.checkItem}>{readiness.isOnline ? (isSupabaseConfigured ? "Network live" : "Local proof mode") : "Offline"}</Text>
              <Text style={styles.checkItem}>{readiness.isScored ? "Score saved" : "Score missing"}</Text>
              <Text style={styles.checkItem}>{readiness.alreadyMinted ? "Already minted" : "Ready to mint"}</Text>
            </View>
            <Text style={styles.readinessText}>{mintReadinessText}</Text>
            {mintError ? <Text style={styles.errorText}>{mintError}</Text> : null}
            {selectedDream.nft_tx_hash ? (
              <View style={styles.txFrame}>
                <Text style={styles.txLabel}>Last tx hash</Text>
                <Text style={styles.txValue}>{selectedDream.nft_tx_hash}</Text>
              </View>
            ) : null}
            {lastMintedDreamId === selectedDream.id ? (
              <Text style={styles.successText}>Mint metadata has been pushed back into the local dream record.</Text>
            ) : null}
            <Pressable
              onPress={handleMint}
              style={[styles.primaryButton, isMintDisabled ? styles.primaryButtonDisabled : null]}
              disabled={isMintDisabled}
            >
              <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: everdreamTheme.colors.background,
  },
  content: {
    paddingBottom: 36,
  },
  heroBand: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: everdreamTheme.colors.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: everdreamTheme.colors.line,
  },
  eyebrow: {
    color: everdreamTheme.colors.deepWater,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 12,
    fontWeight: "700",
  },
  title: {
    color: everdreamTheme.colors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: everdreamTheme.displayFont,
    marginBottom: 12,
  },
  subtitle: {
    color: everdreamTheme.colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  band: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: everdreamTheme.colors.line,
  },
  sectionTitle: {
    color: everdreamTheme.colors.ink,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 16,
    fontFamily: everdreamTheme.displayFont,
  },
  emptyText: {
    color: everdreamTheme.colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  selectorColumn: {
    gap: 12,
  },
  dreamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
    padding: 14,
  },
  dreamRowActive: {
    backgroundColor: "#edf6f7",
    borderColor: everdreamTheme.colors.deepWater,
  },
  dreamRowCopy: {
    flex: 1,
  },
  dreamRowScore: {
    color: everdreamTheme.colors.deepWater,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  dreamRowText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  dreamRowMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  previewFrame: {
    padding: 16,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
    gap: 10,
  },
  previewTitle: {
    color: everdreamTheme.colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  previewNarrative: {
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  previewMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  previewMeta: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  fieldLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  licenseWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  licenseChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  licenseChipActive: {
    backgroundColor: everdreamTheme.colors.accentSoft,
    borderColor: everdreamTheme.colors.accent,
  },
  licenseChipText: {
    color: everdreamTheme.colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  licenseChipTextActive: {
    color: everdreamTheme.colors.accent,
  },
  royaltyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepButton: {
    width: 64,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  stepButtonText: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  royaltyReadout: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
  },
  royaltyLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 2,
  },
  royaltyValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  checklist: {
    gap: 8,
    marginBottom: 12,
  },
  checkItem: {
    color: everdreamTheme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  readinessText: {
    color: everdreamTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  errorText: {
    color: everdreamTheme.colors.warning,
    fontSize: 13,
    marginBottom: 10,
  },
  txFrame: {
    padding: 12,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
    marginBottom: 10,
  },
  txLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 4,
  },
  txValue: {
    color: everdreamTheme.colors.ink,
    fontSize: 12,
    lineHeight: 18,
  },
  successText: {
    color: everdreamTheme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.deepWater,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#f5fbfd",
    fontSize: 15,
    fontWeight: "700",
  },
});
