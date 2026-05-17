import { Share } from "react-native";

export interface ShareOptions {
  title: string;
  message: string;
  url?: string;
}

export class SharingService {
  static async shareDream(options: ShareOptions): Promise<void> {
    try {
      const result = await Share.share({
        title: options.title,
        message: options.message,
        url: options.url,
      });

      if (result.action === Share.sharedAction) {
        console.log("Dream shared successfully");
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing dream:", error);
      throw error;
    }
  }

  static generateShareText(dream: any, privacy: string): ShareOptions {
    const baseMessage = `Dream: ${dream.narrative.substring(0, 100)}${dream.narrative.length > 100 ? "..." : ""}`;

    const privacyNote = privacy === "copyleft"
      ? "\n\nThis dream is shared under Creative Commons - feel free to remix with attribution!"
      : privacy === "remix"
      ? "\n\nThis dream is available for remixing!"
      : "\n\nPrivate dream shared.";

    return {
      title: "Everdream",
      message: `${baseMessage}${privacyNote}`,
    };
  }
}