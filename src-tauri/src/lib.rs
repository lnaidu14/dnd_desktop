use std::fs;
use tauri::Manager;

#[tauri::command]
fn start_local_session(dm_name: &str) -> String {
    format!("Session successfully initialized for DM: {}", dm_name)
}

fn initialize_local_directories(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 1. Resolve the secure, OS-native path to the app's local data directory
    let app_data_path = app.path().app_data_dir()?;

    // 2. Define the subdirectories we want to enforce
    let directories = [
        app_data_path.join("campaigns"),
        app_data_path.join("assets/maps"),
        app_data_path.join("assets/tokens"),
        app_data_path.join("tables"),
    ];

    // 3. Loop through and create them (this behaves like `mkdir -p` and won't overwrite existing data)
    for dir in &directories {
        if !dir.exists() {
            fs::create_dir_all(dir)?;
            println!("Created directory: {}", dir.display());
        }
    }

    // 4. Create a default global settings.json file if it's missing
    let settings_file = app_data_path.join("settings.json");
    if !settings_file.exists() {
        let default_settings = r#"{
  "theme": "dark",
  "last_opened_campaign": null,
  "volume": 80
}"#;
        fs::write(settings_file, default_settings)?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Core plugins
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_local_session])
        .setup(|app| {
            if let Err(e) = initialize_local_directories(app) {
                eprintln!("Failed to initialize app directory structure: {}", e);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
