import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

let cached: boolean | null = null;

export async function notify(title: string, body: string): Promise<boolean> {
  try {
    if (cached === null) {
      cached = await isPermissionGranted();
      if (!cached) {
        const result = await requestPermission();
        cached = result === "granted";
      }
    }
    if (!cached) return false;
    await sendNotification({ title, body });
    return true;
  } catch {
    return false;
  }
}

export const REMINDER_DELAY_MS = 2 * 60 * 1000;
