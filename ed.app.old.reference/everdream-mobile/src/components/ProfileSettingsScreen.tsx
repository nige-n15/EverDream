import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useAppPreferencesStore } from "../store/useAppPreferencesStore";
import { everdreamTheme } from "../theme/everdreamTheme";

type ThemePreference = "sun" | "night" | "moss";

const privacyOptions = ["private", "copyleft", "remix"] as const;
const themeOptions: ThemePreference[] = ["sun", "night", "moss"];

export function ProfileSettingsScreen() {
  const {
    profile,
    updateProfile,
    toggleWearableIntegration,
  } = useAppPreferencesStore(useShallow((state) => ({
    profile: state.profile,
    updateProfile: state.updateProfile,
    toggleWearableIntegration: state.toggleWearableIntegration,
  })));
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname);
  const [walletDraft, setWalletDraft] = useState(profile.wallet_address);

  const saveIdentity = () => {
    updateProfile({
      nickname: nicknameDraft.trim() || profile.nickname,
      wallet_address: walletDraft.trim() || profile.wallet_address,
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroBand}>
        <Text style={styles.eyebrow}>PROFILE & SETTINGS</Text>
        <Text style={styles.title}>Vault Posture</Text>
        <Text style={styles.subtitle}>
          Decide what is visible, what stays local, and how much ceremony this ritual needs.
        </Text>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Identity</Text>
        <View style={styles.identityHeader}>
          <View style={styles.avatarSwatch}>
            <Text style={styles.avatarLetter}>{profile.nickname.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.identityMeta}>
            <Text style={styles.identityName}>{profile.nickname}</Text>
            <Text style={styles.identityEmail}>{profile.email}</Text>
          </View>
        </View>

        <TextInput
          value={nicknameDraft}
          onChangeText={setNicknameDraft}
          style={styles.input}
          placeholder="Nickname"
          placeholderTextColor={everdreamTheme.colors.muted}
        />
        <TextInput
          value={walletDraft}
          onChangeText={setWalletDraft}
          style={styles.input}
          placeholder="Wallet address"
          placeholderTextColor={everdreamTheme.colors.muted}
          autoCapitalize="none"
        />
        <Pressable onPress={saveIdentity} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save identity</Text>
        </Pressable>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.fieldLabel}>Dream visibility</Text>
        <View style={styles.segmentRow}>
          {privacyOptions.map((option) => {
            const selected = option === profile.privacy_dreams;

            return (
              <Pressable
                key={option}
                onPress={() => updateProfile({ privacy_dreams: option })}
                style={[styles.segmentButton, selected ? styles.segmentButtonActive : null]}
              >
                <Text style={[styles.segmentText, selected ? styles.segmentTextActive : null]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>NFT visibility</Text>
        <View style={styles.segmentRow}>
          {(["public", "private"] as const).map((option) => {
            const selected = option === profile.nft_visibility;

            return (
              <Pressable
                key={option}
                onPress={() => updateProfile({ nft_visibility: option })}
                style={[styles.segmentButton, selected ? styles.segmentButtonActive : null]}
              >
                <Text style={[styles.segmentText, selected ? styles.segmentTextActive : null]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Biometric lock</Text>
            <Text style={styles.toggleText}>Require device auth before opening the private vault.</Text>
          </View>
          <Switch
            value={profile.biometric_lock}
            onValueChange={(value) => updateProfile({ biometric_lock: value })}
            trackColor={{ false: "#cabaa1", true: everdreamTheme.colors.accentSoft }}
            thumbColor={profile.biometric_lock ? everdreamTheme.colors.accent : "#8f867b"}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Two-factor auth</Text>
            <Text style={styles.toggleText}>Keep it ready for later wallet-facing actions and account recovery.</Text>
          </View>
          <Switch
            value={profile.two_factor_enabled}
            onValueChange={(value) => updateProfile({ two_factor_enabled: value })}
            trackColor={{ false: "#cabaa1", true: everdreamTheme.colors.goldSoft }}
            thumbColor={profile.two_factor_enabled ? everdreamTheme.colors.gold : "#8f867b"}
          />
        </View>
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Wearables</Text>
        {Object.entries(profile.wearable_integrations).map(([provider, enabled]) => (
          <View key={provider} style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>{provider.replace("_", " ")}</Text>
              <Text style={styles.toggleText}>Prepare sync hooks and permissions for this sleep source.</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={() => toggleWearableIntegration(provider as keyof typeof profile.wearable_integrations)}
              trackColor={{ false: "#cabaa1", true: everdreamTheme.colors.accentSoft }}
              thumbColor={enabled ? everdreamTheme.colors.accent : "#8f867b"}
            />
          </View>
        ))}
      </View>

      <View style={styles.band}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.segmentRow}>
          {themeOptions.map((option) => {
            const selected = option === profile.theme_preference;

            return (
              <Pressable
                key={option}
                onPress={() => updateProfile({ theme_preference: option })}
                style={[styles.segmentButton, selected ? styles.segmentButtonActive : null]}
              >
                <Text style={[styles.segmentText, selected ? styles.segmentTextActive : null]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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
    color: everdreamTheme.colors.accent,
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
  identityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarSwatch: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.deepWater,
  },
  avatarLetter: {
    color: "#f5fbfd",
    fontSize: 24,
    fontWeight: "700",
  },
  identityMeta: {
    flex: 1,
  },
  identityName: {
    color: everdreamTheme.colors.ink,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  identityEmail: {
    color: everdreamTheme.colors.muted,
    fontSize: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
    paddingHorizontal: 14,
    color: everdreamTheme.colors.ink,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: everdreamTheme.colors.accent,
  },
  primaryButtonText: {
    color: "#f7fcfb",
    fontSize: 15,
    fontWeight: "700",
  },
  fieldLabel: {
    color: everdreamTheme.colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
  },
  segmentButtonActive: {
    backgroundColor: everdreamTheme.colors.accentSoft,
    borderColor: everdreamTheme.colors.accent,
  },
  segmentText: {
    color: everdreamTheme.colors.ink,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  segmentTextActive: {
    color: everdreamTheme.colors.accent,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: everdreamTheme.colors.line,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    color: everdreamTheme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  toggleText: {
    color: everdreamTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
