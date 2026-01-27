/**
 * Notification System Utility
 * Handles toast, browser, and sound notifications
 */

import { toast } from "@/hooks/use-toast";

export type NotificationChannel = "toast" | "browser" | "sound";

interface NotificationOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  channels?: NotificationChannel[];
  sound?: string;
  persistent?: boolean;
}

class NotificationManager {
  private browserPermission: NotificationPermission = "default";
  private soundEnabled: boolean = true;

  /**
   * Request browser notification permission
   */
  async requestBrowserPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("[Notifications] Browser notifications not supported");
      return false;
    }

    if (this.browserPermission === "granted") {
      return true;
    }

    if (this.browserPermission === "denied") {
      console.warn("[Notifications] Browser notification permission denied");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.browserPermission = permission;
      return permission === "granted";
    } catch (error) {
      console.error("[Notifications] Failed to request permission:", error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!("Notification" in window) || this.browserPermission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: options?.description,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: options?.persistent ? undefined : title, // Prevent duplicate notifications
        requireInteraction: options?.persistent || false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds unless persistent
      if (!options?.persistent) {
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error("[Notifications] Failed to show browser notification:", error);
    }
  }

  /**
   * Play notification sound
   */
  private playSound(soundName: string = "default"): void {
    if (!this.soundEnabled) return;

    try {
      // Create audio context for sound
      const audio = new Audio();
      
      // Use different sounds based on notification type
      const soundMap: Record<string, string> = {
        default: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC",
        success: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC",
        error: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC",
      };

      audio.src = soundMap[soundName] || soundMap.default;
      audio.volume = 0.3; // 30% volume
      await audio.play();
    } catch (error) {
      // Sound playback failed (user may have blocked it)
      console.warn("[Notifications] Failed to play sound:", error);
    }
  }

  /**
   * Show notification through all enabled channels
   */
  async notify(options: NotificationOptions): Promise<void> {
    const channels = options.channels || ["toast"];

    // Toast notification (always available)
    if (channels.includes("toast")) {
      toast({
        title: options.title,
        description: options.description,
        variant: options.variant || "default",
      });
    }

    // Browser notification
    if (channels.includes("browser")) {
      const hasPermission = await this.requestBrowserPermission();
      if (hasPermission) {
        await this.showBrowserNotification(options.title, options);
      }
    }

    // Sound notification
    if (channels.includes("sound")) {
      this.playSound(options.sound || options.variant || "default");
    }
  }

  /**
   * Enable/disable sound notifications
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Check if browser notifications are available
   */
  isBrowserNotificationSupported(): boolean {
    return "Notification" in window;
  }

  /**
   * Get current browser notification permission
   */
  getBrowserPermission(): NotificationPermission {
    return this.browserPermission;
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

/**
 * Convenience functions for common notification types
 */
export async function notifyTrainingJobCompleted(jobName: string, channels?: NotificationChannel[]) {
  await notificationManager.notify({
    title: "Training Job Completed",
    description: `Training job "${jobName}" has completed successfully.`,
    variant: "success",
    channels: channels || ["toast", "browser"],
    sound: "success",
  });
}

export async function notifyTrainingJobFailed(jobName: string, channels?: NotificationChannel[]) {
  await notificationManager.notify({
    title: "Training Job Failed",
    description: `Training job "${jobName}" has failed. Please check the logs.`,
    variant: "destructive",
    channels: channels || ["toast", "browser"],
    sound: "error",
  });
}

export async function notifyModelDeployed(modelName: string, channels?: NotificationChannel[]) {
  await notificationManager.notify({
    title: "Model Deployed",
    description: `Model "${modelName}" has been deployed successfully.`,
    variant: "success",
    channels: channels || ["toast"],
    sound: "success",
  });
}

export async function notifyDriftDetected(featureCount: number, channels?: NotificationChannel[]) {
  await notificationManager.notify({
    title: "Data Drift Detected",
    description: `${featureCount} feature${featureCount !== 1 ? "s" : ""} have detected drift.`,
    variant: "destructive",
    channels: channels || ["toast", "browser"],
    sound: "error",
    persistent: true,
  });
}

export async function notifyPerformanceThresholdExceeded(
  metric: string,
  value: number,
  threshold: number,
  channels?: NotificationChannel[]
) {
  await notificationManager.notify({
    title: "Performance Threshold Exceeded",
    description: `${metric} is ${value}ms (threshold: ${threshold}ms)`,
    variant: "destructive",
    channels: channels || ["toast"],
    sound: "error",
  });
}

