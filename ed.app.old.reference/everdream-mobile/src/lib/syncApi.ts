import type { Dream, DreamInsert, DreamUpdate, MediaType, SyncQueueItem } from "../types/database";
import { getAuthUser, supabase } from "./supabaseClient";

export interface SyncProcessorResult {
  synced_ids: string[];
  failed_ids: string[];
  failed: Array<{ id: string; error: string }>;
}

export interface MintFunctionRequest {
  dream_id: string;
  license_type: string;
  royalty_bps: number;
}

export interface MintFunctionResult {
  tx_hash: string;
  token_id: string;
  contract_address: string;
}

export interface AiProxyRequest {
  narrative: string;
  media_type: MediaType;
}

export interface AiProxyResult {
  themes: string[];
  narrative_summary: string;
  emotional_tone: {
    valence: number;
    arousal: number;
    emotions: string[];
  };
}

export async function fetchDreamsRemote() {
  const user = await getAuthUser();
  const { data, error } = await supabase
    .from("dreams")
    .select("*")
    .eq("user_id", user.id)
    .order("timestamp", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Dream[];
}

export async function insertDreamRemote(dream: DreamInsert) {
  const { data, error } = await supabase
    .from("dreams")
    .insert(dream as never)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Dream;
}

export async function updateDreamRemote(id: string, userId: string, updates: DreamUpdate) {
  const { data, error } = await supabase
    .from("dreams")
    .update(updates as never)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Dream;
}

export async function deleteDreamRemote(id: string, userId: string) {
  const { error } = await supabase
    .from("dreams")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function invokeSyncProcessor(queueEntries: SyncQueueItem[]) {
  const { data, error } = await supabase.functions.invoke("sync-processor", {
    body: {
      queue_entries: queueEntries,
    },
  });

  if (error) {
    throw error;
  }

  return data as SyncProcessorResult;
}

export async function invokeNftMint(payload: MintFunctionRequest) {
  const { data, error } = await supabase.functions.invoke("nft-mint", {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data as MintFunctionResult;
}

export async function invokeAiProxy(payload: AiProxyRequest) {
  const { data, error } = await supabase.functions.invoke("ai-proxy", {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data as AiProxyResult;
}
