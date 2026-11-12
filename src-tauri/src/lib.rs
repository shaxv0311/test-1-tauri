use tauri::webview::{PermissionKind, PermissionResponse};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from a Tauri app!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .on_permission_request(|_, kind| match kind {
            PermissionKind::Microphone => PermissionResponse::Allow,
            PermissionKind::Camera => PermissionResponse::Allow,
            _ => PermissionResponse::Default,
        })
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_vnidrop_share::init())
        .plugin(tauri_plugin_push_notifications::init())
        .plugin(tauri_plugin_notification::init());

    // Desktop only: updater + process (restart)
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());

    // Mobile only
    #[cfg(mobile)]
    let builder = builder
        .plugin(tauri_plugin_biometric::init())
        .plugin(tauri_plugin_geolocation::init());

    // Windows only
    #[cfg(target_os = "windows")]
    let builder = builder.plugin(tauri_plugin_printer::init());

    builder
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}