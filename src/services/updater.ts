import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask, message } from "@tauri-apps/plugin-dialog";

export async function checkForUpdates() {
  try {
    const update = await check();
    if (!update) return; // already on the latest version

    const installNow = await ask(
      `Version ${update.version} is available.\n\n${update.body ?? ""}`,
      {
        title: "Update Available",
        kind: "info",
        okLabel: "Install now",
        cancelLabel: "Later",
      },
    );

    if (!installNow) return; // "Later": do nothing, ask again next launch

    await update.downloadAndInstall();
    await relaunch();
  } catch (e) {
    console.error("Update check failed:", e);
  }
}
