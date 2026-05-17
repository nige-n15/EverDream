export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MediaType = "video" | "audio" | "text";
export type DreamPrivacy = "private" | "copyleft" | "remix";
export type LicenseType = "CC0-1.0" | "CC-BY-4.0" | "CC-BY-SA-4.0" | "ALL-RIGHTS-RESERVED";
export type SleepSource = "wearable" | "manual";
export type SupportedNetwork = "amoy" | "polygon";
export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";
export type SyncStatus = "pending" | "synced" | "failed";

export interface Profile {
  id: string;
  email: string;
  wallet_address: string | null;
  nickname: string | null;
  avatar_url: string | null;
  privacy_settings: Json;
  wearable_integrations: Json;
  t_social_score: number;
  created_at: string;
  updated_at: string;
}

export interface Dream {
  id: string;
  user_id: string;
  timestamp: string;
  media_type: MediaType;
  media_storage_path: string | null;
  narrative: string;
  themes: string[];
  valence: number;
  arousal: number;
  resonance_score: number;
  xp_score: number;
  sleep_session_id: string | null;
  nft_token_id: string | null;
  nft_contract_address: string | null;
  nft_tx_hash: string | null;
  license_type: LicenseType;
  royalty_bps: number;
  privacy: DreamPrivacy;
  ai_metadata: Json;
  verification_metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface SleepSession {
  id: string;
  user_id: string;
  date: string;
  score: number;
  rem_minutes: number;
  deep_minutes: number;
  light_minutes: number;
  awake_minutes: number;
  total_sleep_minutes: number;
  source: SleepSource;
  wearable_device: string | null;
  raw_data: Json;
  created_at: string;
}

export interface NftRegistry {
  token_id: string;
  dream_id: string;
  contract_address: string;
  network: SupportedNetwork;
  minted_at: string;
  metadata_ipfs_hash: string | null;
  owner_address: string;
}

export interface RemixRegistry {
  id: string;
  child_dream_id: string;
  parent_dream_ids: string[];
  creator_id: string;
  license_type: string;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  operation_type: SyncOperationType;
  table_name: "dreams" | "sleep_sessions" | "profiles";
  record_id: string;
  payload: Json;
  status: SyncStatus;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  synced_at: string | null;
}

export interface FunctionRateLimit {
  id: string;
  user_id: string;
  function_name: string;
  invoked_at: string;
}

export interface LocalSyncMetadata {
  last_sync_timestamp: string | null;
  pending_operations_count: number;
}

export interface LocalDreamMedia {
  id: string;
  dream_id: string;
  user_id: string;
  media_type: MediaType;
  storage_kind: "inline" | "file";
  encrypted_hex: string | null;
  encrypted_file_uri: string | null;
  mime_type: string;
  byte_length: number;
  capture_source: "recorded" | "placeholder";
  duration_ms: number | null;
  created_at: string;
  preview_text: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          wallet_address?: string | null;
          nickname?: string | null;
          avatar_url?: string | null;
          privacy_settings?: Json;
          wearable_integrations?: Json;
          t_social_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      dreams: {
        Row: Dream;
        Insert: {
          id?: string;
          user_id: string;
          timestamp?: string;
          media_type: MediaType;
          media_storage_path?: string | null;
          narrative: string;
          themes?: string[];
          valence?: number;
          arousal?: number;
          resonance_score?: number;
          xp_score?: number;
          sleep_session_id?: string | null;
          nft_token_id?: string | null;
          nft_contract_address?: string | null;
          nft_tx_hash?: string | null;
          license_type?: LicenseType;
          royalty_bps?: number;
          privacy?: DreamPrivacy;
          ai_metadata?: Json;
          verification_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Dream>;
        Relationships: [
          {
            foreignKeyName: "dreams_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dreams_sleep_session_id_fkey";
            columns: ["sleep_session_id"];
            isOneToOne: false;
            referencedRelation: "sleep_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sleep_sessions: {
        Row: SleepSession;
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          score?: number;
          rem_minutes?: number;
          deep_minutes?: number;
          light_minutes?: number;
          awake_minutes?: number;
          total_sleep_minutes?: number;
          source: SleepSource;
          wearable_device?: string | null;
          raw_data?: Json;
          created_at?: string;
        };
        Update: Partial<SleepSession>;
        Relationships: [
          {
            foreignKeyName: "sleep_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      nft_registry: {
        Row: NftRegistry;
        Insert: {
          token_id: string;
          dream_id: string;
          contract_address: string;
          network: SupportedNetwork;
          minted_at?: string;
          metadata_ipfs_hash?: string | null;
          owner_address: string;
        };
        Update: Partial<NftRegistry>;
        Relationships: [
          {
            foreignKeyName: "nft_registry_dream_id_fkey";
            columns: ["dream_id"];
            isOneToOne: true;
            referencedRelation: "dreams";
            referencedColumns: ["id"];
          },
        ];
      };
      remix_registry: {
        Row: RemixRegistry;
        Insert: {
          id?: string;
          child_dream_id: string;
          parent_dream_ids: string[];
          creator_id: string;
          license_type: string;
          created_at?: string;
        };
        Update: Partial<RemixRegistry>;
        Relationships: [
          {
            foreignKeyName: "remix_registry_child_dream_id_fkey";
            columns: ["child_dream_id"];
            isOneToOne: false;
            referencedRelation: "dreams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "remix_registry_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sync_queue: {
        Row: SyncQueueItem;
        Insert: {
          id?: string;
          user_id: string;
          operation_type: SyncOperationType;
          table_name: "dreams" | "sleep_sessions" | "profiles";
          record_id: string;
          payload: Json;
          status?: SyncStatus;
          retry_count?: number;
          last_error?: string | null;
          created_at?: string;
          synced_at?: string | null;
        };
        Update: Partial<SyncQueueItem>;
        Relationships: [
          {
            foreignKeyName: "sync_queue_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      function_rate_limits: {
        Row: FunctionRateLimit;
        Insert: {
          id?: string;
          user_id: string;
          function_name: string;
          invoked_at?: string;
        };
        Update: Partial<FunctionRateLimit>;
        Relationships: [
          {
            foreignKeyName: "function_rate_limits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_xp_score: {
        Args: {
          c_raw: number;
          r_user: number;
          i_semantic: number;
          s_valence: number;
          d_density?: number;
          m_sustain?: number;
          t_social?: number;
        };
        Returns: number;
      };
      can_view_dream: {
        Args: {
          dream_user_id: string;
          dream_privacy: string;
        };
        Returns: boolean;
      };
      check_rate_limit: {
        Args: {
          p_user_id: string;
          p_function_name: string;
          p_limit: number;
          p_window_seconds?: number;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type DreamInsert = Database["public"]["Tables"]["dreams"]["Insert"];
export type DreamUpdate = Database["public"]["Tables"]["dreams"]["Update"];
export type SleepSessionInsert = Database["public"]["Tables"]["sleep_sessions"]["Insert"];
export type SleepSessionUpdate = Database["public"]["Tables"]["sleep_sessions"]["Update"];
export type SyncQueueInsert = Database["public"]["Tables"]["sync_queue"]["Insert"];
