import {
  checkPermissions,
  requestPermissions,
  getCurrentPosition,
} from "@tauri-apps/plugin-geolocation";

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

/**
 * Throws an Error whose message is one of:
 *  - LOCATION_PERMISSION_DENIED
 *  - LOCATION_SERVICES_DISABLED
 *  - LOCATION_ERROR
 */
export async function getDeviceLocation(): Promise<DeviceLocation> {
  let permission = await checkPermissions();

  // Shows the Android system permission dialog
  if (
    permission.location === "prompt" ||
    permission.location === "prompt-with-rationale"
  ) {
    permission = await requestPermissions(["location"]);
  }

  if (permission.location !== "granted") {
    throw new Error("LOCATION_PERMISSION_DENIED");
  }

  try {
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    const message = (
      error instanceof Error ? error.message : String(error)
    ).toLowerCase();

    console.warn("Geolocation error:", message);

    if (message.includes("disabled") || message.includes("location services")) {
      throw new Error("LOCATION_SERVICES_DISABLED");
    }

    throw new Error("LOCATION_ERROR");
  }
}
