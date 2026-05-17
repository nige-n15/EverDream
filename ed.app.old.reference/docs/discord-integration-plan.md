# Discord Integration Plan

## Goal

Get all AI collaborators talking in one operational space with the least possible setup risk, while preserving a clean path to Matrix later.

## Recommendation

Use a two-step Discord architecture:

1. `Now`: outbound agent voices via per-agent incoming webhooks
2. `Next`: one coordinator bot that listens in a shared channel and routes messages to local AI adapters

This is the right tradeoff because webhook posting is almost zero-complexity, while full bot listening requires app install, intents, permissions, and message routing decisions.

## Phase 1: webhook-first bus

### Channel topology

Start with:

- `#ai-bus`
- `#founder-ops`
- `#build-log`
- `#research-drop`

Recommended use:

- `#ai-bus`: cross-agent summaries, handoffs, decisions
- `#founder-ops`: requests from you, approvals, priorities
- `#build-log`: deploy notices, errors, completions
- `#research-drop`: longer references, links, transcripts

### Identity model

Create one webhook per agent identity:

- Founder
- Claude
- ChatGPT
- Grok
- Qwen
- DeepSeek
- OpenClaw

This gives each participant a distinct voice without requiring a separate bot user for each one.

### Local logging

Treat Discord as a transport layer, not the canonical store.

- Canonical transcript stays local first
- Webhook sends are logged to `data/discord-events/*.jsonl`
- Later, sync logs to cloud if needed

## Phase 2: coordinator bot

After webhook posting is stable, add one real bot to:

- read messages in `#ai-bus`
- parse mentions or lightweight commands
- fan messages out to local or hosted AI providers
- post responses through either the bot itself or the agent webhooks

Recommended command shape:

- `@relay claude summarize this thread`
- `@relay qwen translate this for vietnamese onboarding`
- `@relay deepseek research wearable API edge cases`

## Required Discord setup

### Developer Portal

Create one Discord application and bot.

For the bot phase, capture:

- Application ID
- Bot token
- Guild ID
- Channel IDs for operational rooms

### OAuth scopes

Use:

- `bot`
- `applications.commands`

### Minimum bot permissions

Start narrow:

- View Channels
- Send Messages
- Read Message History
- Use Slash Commands
- Create Public Threads
- Send Messages in Threads

Only add `Manage Webhooks` if you want the bot to create or rotate webhooks itself.

### Intents

If the bot needs to read ordinary message text in channels, enable:

- `MESSAGE CONTENT INTENT`

If you keep interaction to slash commands only, you can avoid freeform channel reading at first.

## Practical sequence

### Step 1

Create the Discord server structure and per-agent webhooks.

### Step 2

Populate `.env.discord.example` values locally and test with:

```bash
npm run discord:send -- --agent claude --message "Discord relay online."
```

### Step 3

Decide whether the coordinator bot should be:

- command-only
- mention-driven in one channel
- thread-based per task

Recommendation:

- mention-driven in `#ai-bus`
- thread-based for long-running topics

### Step 4

Implement a coordinator service with these boundaries:

- `DiscordTransport`
- `AgentRouter`
- `TranscriptStore`
- `ProviderRegistry`

This is the seam that later lets you swap Discord for Matrix without rewriting provider logic.

## Storage guidance

For Discord integration itself:

- local logs are the source of truth
- Discord is not archival storage
- cloud sync is optional

What to store locally:

- raw incoming messages
- outbound messages
- agent name
- channel / thread IDs
- timestamps
- correlation IDs for request / response chains

## Matrix later

Do not couple providers directly to Discord.

Use an internal event shape like:

```json
{
  "id": "evt_123",
  "transport": "discord",
  "room": "ai-bus",
  "thread_id": "123456",
  "author": "founder",
  "target_agent": "claude",
  "content": "Summarize this build status.",
  "timestamp": "2026-04-05T00:00:00Z"
}
```

If you do that, Matrix becomes another transport adapter later, not a rewrite.

## Immediate recommendation

Start with webhook posting this week.

Do not wait for:

- Matrix
- wearable integrations
- cloud sync
- a multi-bot architecture

The first real milestone is simple:

- all AI identities can post cleanly into one Discord workspace
- local logs exist
- the room structure feels usable
