import { isTauri } from "@tauri-apps/api/core";

import {
  isPermissionGranted,
  requestPermission,
  registerForPush,
  onNotificationReceived,
  onNotificationTapped,
} from "@spicavi/tauri-plugin-push-notifications";

import { sendNotification } from "@tauri-apps/plugin-notification";

type PushData = Record<string, unknown>;

interface PushNotification {
  title?: string;
  body?: string;
  data?: PushData;
}

export async function initializePushNotifications(
  saveToken: (token: string) => Promise<void>,
  navigateTo: (path: string) => void,
): Promise<() => void> {
  if (!isTauri() || !/Android/i.test(navigator.userAgent)) {
    return () => {};
  }

  let receivedListener:
    | Awaited<ReturnType<typeof onNotificationReceived>>
    | undefined;

  let tappedListener:
    | Awaited<ReturnType<typeof onNotificationTapped>>
    | undefined;

  try {
    // 1. Check notification permission
    let granted = await isPermissionGranted();

    // 2. Request permission if needed
    if (!granted) {
      granted = await requestPermission();
    }

    if (!granted) {
      console.warn("Notification permission denied");
      return () => {};
    }

    // 3. Listen for foreground notifications
    receivedListener = await onNotificationReceived(
      (notification: PushNotification) => {
        console.log("Foreground push received:", notification);

        // Display native Android notification
        sendNotification({
          title: notification.title || "New Notification",
          body: notification.body || "You have a new message",
        });
      },
    );

    // 4. Listen for notification taps
    tappedListener = await onNotificationTapped(
      (notification: PushNotification) => {
        console.log("Notification tapped:", notification);

        const path = notification.data?.path;

        if (typeof path === "string" && path.startsWith("/")) {
          navigateTo(path);
        }
      },
    );

    // 5. Register FCM token
    const token = await registerForPush();

    console.log("Firebase FCM Token:", token);

    // 6. Send token to your backend
    await saveToken(token);

    console.log("FCM token registered successfully");
  } catch (error) {
    console.error("Push initialization failed:", error);
  }

  // 7. Cleanup listeners
  return () => {
    void receivedListener?.unregister();
    void tappedListener?.unregister();
  };
}
