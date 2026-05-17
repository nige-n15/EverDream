export type MediaType = "video" | "audio" | "text";
export type DreamPrivacy = "private" | "copyleft" | "remix";
export type LicenseType = "CC0-1.0" | "CC-BY-4.0" | "CC-BY-SA-4.0" | "ALL-RIGHTS-RESERVED";
export type VerificationStatus = "pending" | "verified" | "failed";

export interface DreamCapture {
  id: string;
  timestamp: string;
  mediaType: MediaType;
  mediaUri?: string;
  narrative: string;
  preSleepEvents?: string;
  intentTag?: string;
  lucidityLevel: number; // 0-100
  userId: string;
}

export interface AiProcessingResult {
  themes: string[];
  narrativeNugget: string;
  emotionalTone: {
    primaryEmotion: string;
    valence: number; // -5 to 5
    arousal: number; // 0 to 10
  };
  prosodyInsights?: {
    voiceTone?: string;
    facialExpression?: string;
  };
}

export interface DreamVerification {
  isVerified: boolean;
  editedThemes?: string[];
  editedNarrativeNugget?: string;
  editedEmotionalTone?: AiProcessingResult["emotionalTone"];
  clarificationResponses?: Record<string, string>;
  affirmationChecked: boolean;
  provenanceHash?: string;
  verifiedAt?: string;
}

export interface Dream {
  id: string;
  userId: string;
  timestamp: string;
  mediaType: MediaType;
  mediaStoragePath?: string;
  narrative: string;
  themes: string[];
  valence: number;
  arousal: number;
  resonanceScore: number;
  xpScore: number;
  sleepSessionId?: string;
  nftTokenId?: string;
  nftContractAddress?: string;
  nftTxHash?: string;
  licenseType: LicenseType;
  royaltyBps: number;
  privacy: DreamPrivacy;
  aiMetadata: AiProcessingResult;
  verificationMetadata: DreamVerification;
  createdAt: string;
  updatedAt: string;
}

export interface DreamDraft extends Omit<DreamCapture, "id" | "timestamp" | "userId"> {
  id?: string;
  timestamp?: string;
  userId?: string;
  aiResult?: AiProcessingResult;
  verification?: Partial<DreamVerification>;
}