import { assertMethod, errorResponse, handleCors, HttpError, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

type OperationType = "CREATE" | "UPDATE" | "DELETE";
type TableName = "dreams" | "sleep_sessions" | "profiles";

interface SyncQueueItem {
  id: string;
  user_id: string;
  operation_type: OperationType;
  table_name: TableName;
  record_id: string;
  payload: Record<string, unknown>;
  status: "pending" | "synced" | "failed";
  retry_count: number;
  last_error: string | null;
  created_at: string;
  synced_at: string | null;
}

interface SyncProcessorRequest {
  queue_entries: SyncQueueItem[];
}

function timestampToMillis(value: unknown, fallback: string) {
  const timestamp = typeof value === "string" ? value : fallback;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function upsertQueueShadow(adminClient: ReturnType<typeof requireUser> extends Promise<infer T> ? T["adminClient"] : never, entry: SyncQueueItem) {
  const { error } = await adminClient.from("sync_queue").upsert({
    ...entry,
    status: "pending",
    synced_at: null,
  });

  if (error) {
    throw new HttpError(500, "Failed to upsert sync queue shadow", error);
  }
}

async function markQueueEntry(
  adminClient: ReturnType<typeof requireUser> extends Promise<infer T> ? T["adminClient"] : never,
  entry: SyncQueueItem,
  status: "synced" | "failed",
  lastError?: string,
) {
  const patch = status === "synced"
    ? {
      status,
      synced_at: new Date().toISOString(),
      last_error: null,
    }
    : {
      status,
      retry_count: entry.retry_count + 1,
      last_error: lastError ?? "Unknown sync error",
    };

  const { error } = await adminClient
    .from("sync_queue")
    .update(patch)
    .eq("id", entry.id)
    .eq("user_id", entry.user_id);

  if (error) {
    throw new HttpError(500, "Failed to update sync queue shadow", error);
  }
}

async function processDreamEntry(
  adminClient: ReturnType<typeof requireUser> extends Promise<infer T> ? T["adminClient"] : never,
  entry: SyncQueueItem,
  userId: string,
) {
  const { data: existing, error: existingError } = await adminClient
    .from("dreams")
    .select("id, updated_at")
    .eq("id", entry.record_id)
    .maybeSingle();

  if (existingError) {
    throw new HttpError(500, "Failed to inspect remote dream", existingError);
  }

  const incomingUpdatedAt = timestampToMillis(entry.payload.updated_at, entry.created_at);
  const existingUpdatedAt = existing?.updated_at ? timestampToMillis(existing.updated_at, entry.created_at) : 0;

  if (entry.operation_type === "DELETE") {
    if (existing && existingUpdatedAt > incomingUpdatedAt) {
      return;
    }

    const { error } = await adminClient
      .from("dreams")
      .delete()
      .eq("id", entry.record_id)
      .eq("user_id", userId);

    if (error) {
      throw new HttpError(500, "Failed to delete dream", error);
    }

    return;
  }

  if (existing && existingUpdatedAt > incomingUpdatedAt) {
    return;
  }

  const payload = {
    ...entry.payload,
    id: entry.record_id,
    user_id: userId,
  };

  const { error } = await adminClient.from("dreams").upsert(payload);

  if (error) {
    throw new HttpError(500, "Failed to upsert dream", error);
  }
}

async function processSleepSessionEntry(
  adminClient: ReturnType<typeof requireUser> extends Promise<infer T> ? T["adminClient"] : never,
  entry: SyncQueueItem,
  userId: string,
) {
  const { data: existing, error: existingError } = await adminClient
    .from("sleep_sessions")
    .select("id, created_at")
    .eq("id", entry.record_id)
    .maybeSingle();

  if (existingError) {
    throw new HttpError(500, "Failed to inspect remote sleep session", existingError);
  }

  const incomingUpdatedAt = timestampToMillis(entry.payload.updated_at ?? entry.payload.created_at, entry.created_at);
  const existingUpdatedAt = existing?.created_at ? timestampToMillis(existing.created_at, entry.created_at) : 0;

  if (entry.operation_type === "DELETE") {
    if (existing && existingUpdatedAt > incomingUpdatedAt) {
      return;
    }

    const { error } = await adminClient
      .from("sleep_sessions")
      .delete()
      .eq("id", entry.record_id)
      .eq("user_id", userId);

    if (error) {
      throw new HttpError(500, "Failed to delete sleep session", error);
    }

    return;
  }

  if (existing && existingUpdatedAt > incomingUpdatedAt) {
    return;
  }

  const payload = {
    ...entry.payload,
    id: entry.record_id,
    user_id: userId,
  };

  const { error } = await adminClient
    .from("sleep_sessions")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new HttpError(500, "Failed to upsert sleep session", error);
  }
}

async function processProfileEntry(
  adminClient: ReturnType<typeof requireUser> extends Promise<infer T> ? T["adminClient"] : never,
  entry: SyncQueueItem,
  userId: string,
) {
  if (entry.operation_type === "DELETE") {
    throw new HttpError(400, "Profile deletion is not supported through sync-processor");
  }

  const { error } = await adminClient
    .from("profiles")
    .update({
      ...entry.payload,
      id: userId,
      updated_at: entry.payload.updated_at ?? new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new HttpError(500, "Failed to update profile", error);
  }
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);

  if (corsResponse) {
    return corsResponse;
  }

  try {
    assertMethod(request, "POST");

    const { user, adminClient } = await requireUser(request);
    const body = await readJsonBody<SyncProcessorRequest>(request);
    const queueEntries = [...(body.queue_entries ?? [])];

    queueEntries.sort((left, right) => timestampToMillis(left.created_at, left.created_at) - timestampToMillis(right.created_at, right.created_at));

    const synced_ids: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const entry of queueEntries) {
      if (entry.user_id !== user.id) {
        failed.push({ id: entry.id, error: "Queue entry user mismatch" });
        continue;
      }

      try {
        await upsertQueueShadow(adminClient, entry);

        if (entry.table_name === "dreams") {
          await processDreamEntry(adminClient, entry, user.id);
        } else if (entry.table_name === "sleep_sessions") {
          await processSleepSessionEntry(adminClient, entry, user.id);
        } else if (entry.table_name === "profiles") {
          await processProfileEntry(adminClient, entry, user.id);
        } else {
          throw new HttpError(400, `Unsupported table: ${entry.table_name}`);
        }

        await markQueueEntry(adminClient, entry, "synced");
        synced_ids.push(entry.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        await markQueueEntry(adminClient, entry, "failed", message);
        failed.push({ id: entry.id, error: message });
      }
    }

    return jsonResponse({
      synced_ids,
      failed_ids: failed.map((entry) => entry.id),
      failed,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
