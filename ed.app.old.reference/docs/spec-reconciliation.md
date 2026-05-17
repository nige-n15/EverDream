# Echo / Everdream Spec Reconciliation

## What these files establish

The newer markdown set makes the product direction much clearer than the earlier research PDFs:

- `Echo` is the entry product.
- It is a local-first dream journal, not yet a token product.
- The prototype target is Windows first, using Flutter desktop.
- Founder governance is centralized for now; broader council / token mechanics are deferred.
- Privacy, on-device storage, and user data sovereignty are non-negotiable.

In other words, the immediate build is much narrower and more practical than the broader `SubjectiveXP` vision.

## Locked prototype scope

Based on `echo_spec_v1.md`, the prototype should be treated as:

- Voice capture with live speech-to-text
- Local-only storage via Hive
- List view of saved dreams with timestamps
- Swipe-to-delete
- No backend
- No auth
- No cloud sync
- No token deployment
- No blockchain integration

The next sprint adds:

- Valence slider
- JSON export
- 40 Hz gamma tone during recording
- Search / filter
- Explicit delete button

Everything involving coherence scoring, wearables, OpenClaw bridge, or XAELS should be considered post-MVP.

## Governance and security meaning

The governance and security docs matter, but mostly as constraints rather than first-build features:

- Founder-led governance remains the operating model for now.
- Security assumes high-sensitivity future data and treasury handling, but most of that does not belong in the Echo MVP UI yet.
- The photonic governance framework is strategic / ecosystem-level material, not a reason to bloat the first app.
- The strongest actionable principles for product are:
  - on-device by default
  - no telemetry
  - user exportability
  - optionality over coercion
  - privacy before network effects

## What this means for the current repo

The current repo prototype is still useful, but it should be treated as a concept demo, not the implementation source of truth.

### Aligned with the docs

- Calm capture flow for dreams and inner states
- Clear phased roadmap thinking
- Emphasis on privacy and future extensibility
- Recognition that verification / scoring can come later

### In conflict with the docs

- Current prototype is web-first; the spec says Flutter desktop first.
- Current prototype foregrounds XP scoring and proof minting too early.
- Current prototype assumes API endpoints; the Echo prototype explicitly avoids backend dependencies.
- Current prototype is branded around `SubjectiveXP`; the newer product language is `Echo` within the Everdream initiative.

## Recommendation

Treat the existing web build as a presentation artifact for vision, not as the base for the production MVP.

If we follow the new documents, the right implementation path is:

1. Create a new Flutter app for `echo_dream_journal`.
2. Ship only the locked v0 scope from `echo_spec_v1.md`.
3. Add v1 features only after first successful local compile and mic validation.
4. Keep governance, photonic, and token architecture in docs until real user retention exists.

## Notes on the source docs

- `Qwen_markdown_20260321_tem56xqvp.md` and `Qwen_markdown_20260321_oh8enr7yl.md` appear to be duplicate Vietnamese quick-start docs.
- `Qwen_markdown_20260321_47ky8k6g9.md` is a Vietnamese privacy note and appears incomplete / truncated.
- `Qwen_markdown_20260321_kk62kmej4.md` is a formatting stub, not a real product artifact.
- Several files show character encoding issues in terminal output, but the intended meaning is still recoverable.
