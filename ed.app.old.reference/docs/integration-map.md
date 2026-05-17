# SubjectiveXP Integration Map

## Frontend flow contract

### `POST /api/session/start`

Starts a new capture session.

Example response:

```json
{
  "session_id": "sess_01",
  "wallet_state": "connected",
  "consent_version": "v1",
  "capture_mode": "text"
}
```

### `POST /api/projection/generate`

Input:

```json
{
  "session_id": "sess_01",
  "narrative": "I dreamed I was carrying a lantern through a flooded station...",
  "processing_mode": "renewable"
}
```

Output:

```json
{
  "summary": "You moved through uncertainty carrying your own light.",
  "tone": "awe",
  "motifs": ["water", "light", "movement"],
  "model_version": "llama3-local-v1",
  "latency_ms": 820
}
```

### `POST /api/confirmation`

Stores the user's explicit confirmation.

```json
{
  "session_id": "sess_01",
  "resonance_score": 0.86,
  "user_tags": ["lucid", "restorative"]
}
```

### `POST /api/proofs/sign`

Creates a signed proof payload that can later be replaced by a real wallet or ZK prover.

### `POST /api/mint`

Mints or records the verified XP artifact.

### `GET /api/ledger`

Returns the user's recent sessions and proof metadata.

## Suggested implementation layers

- `Frontend`: mobile-first capture, reflection, confirmation, ledger
- `Inference adapter`: local open model first, hosted API optional
- `Wallet adapter`: signature only at first, minting later
- `Ledger storage`: append-only event store for sessions and proofs
- `Trust layer`: consent, audit log, basic fraud checks

## Future integrations

- Wearables / EEG via Bluetooth and OS-level permissions
- ZK proof generation for private validation
- Smart contracts for on-chain XP artifacts
- Token wallet and payout logic
- Operator console with session review and anomaly detection

## Abuse and safety constraints

- Do not auto-lease user hardware into decentralized compute markets.
- Do not use opaque third-party GPU providers for sensitive data in V1.
- Add rate limits, device fingerprinting, and session attestation before token rewards become real.
- Keep narrative content and proof metadata separable so privacy upgrades remain possible.
