import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export default function TestNativeNotification() {
  const testNotification = async () => {
    try {
      let granted = await isPermissionGranted();

      if (!granted) {
        granted = (await requestPermission()) === "granted";
      }

      console.log("Native notification permission:", granted);

      if (!granted) {
        console.error("Android notification permission denied");
        return;
      }

      sendNotification({
        title: "Tauri Native Test",
        body: "If you see this, native Android notifications are working!",
      });

      console.log("Native notification requested");
    } catch (error) {
      console.error("Native notification error:", error);
    }
  };

  return (
    <button onClick={testNotification}>Test Native Android Notification</button>
  );
}
