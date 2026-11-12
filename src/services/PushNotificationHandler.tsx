import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { initializePushNotifications } from "../services/pushNotifications";

export default function PushNotificationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const setupPush = async () => {
      const remove = await initializePushNotifications(
        async (token) => {
          // Replace this with your existing backend API call.
          console.log("Save FCM token to backend:", token);
        },
        (path) => {
          navigate(path);
        },
      );

      if (cancelled) {
        remove();
      } else {
        cleanup = remove;
      }
    };

    void setupPush();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [navigate]);

  return null;
}
