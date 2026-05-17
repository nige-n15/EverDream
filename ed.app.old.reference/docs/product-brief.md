# SubjectiveXP Phase 1 Product Brief

## Summary

`SubjectiveXP` starts as a mobile-first system for turning human inner experience into a verified public artifact without pretending to directly measure consciousness. The first product is a simple loop:

1. The user narrates a dream, memory, or creative state.
2. An AI model generates a reflective projection of that state.
3. The user confirms how closely it matches their inner experience.
4. The system calculates an XP score and creates a verifiable proof record.

This repo implements the frontend shape of that first loop.

## Primary users

- Contributors who want to document dreams, ideas, and emotional states.
- Operators who need to validate that sessions are complete and trustworthy.
- Future partners integrating wallets, AI inference, storage, and cryptographic proof systems.

## Phase 1 goals

- Make the capture flow feel calm, intimate, and mobile-native.
- Show the `Narrate -> Interact -> Confirm` methodology clearly.
- Keep scoring transparent enough that users understand where XP comes from.
- Treat wallet and minting flows as adapters, not hard-coded infrastructure.
- Build something that can later absorb wearables, ZK proofs, and chain minting.

## Recommended core screens

- Welcome / trust framing
- Morning capture
- AI projection
- Resonance confirmation
- XP result + proof card
- Personal ledger
- Integration / roadmap view for operators and partners

## PM guardrails

- Keep V1 text-first. Do not block launch on BCI hardware.
- Default to trusted infrastructure for inference and minting during the MVP.
- Preserve user privacy by minimizing raw narrative exposure in future versions.
- Make the product understandable without requiring users to learn tokenomics first.
- Use the anti-abuse lessons from the compute-market paper: do not tie early inference to anonymous or opaque decentralized compute providers.

## Out of scope for this first build

- Custom Android fork distribution
- Production blockchain minting
- Soulbound NFTs and zero-knowledge proofs
- Wearable / EEG ingestion
- Compute marketplace participation
- Full admin console
