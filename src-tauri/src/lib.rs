use serde::Serialize;
use std::collections::BTreeSet;
use sysinfo::System;

mod launch_observer;

#[derive(Serialize)]
pub struct VpnStatus {
    connected: bool,
    vpn_interfaces: Vec<String>,
    all_interfaces: Vec<String>,
}

#[derive(Serialize)]
pub struct RunningProcess {
    name: String,
    pid: u32,
}

const VPN_PREFIXES: &[&str] = &[
    "tun", "utun", "tap", "wg", "ppp", "ipsec", "nordlynx", "proton",
    "mullvad", "wireguard",
];

fn is_vpn_interface(name: &str) -> bool {
    let n = name.to_lowercase();
    VPN_PREFIXES.iter().any(|p| n.starts_with(p))
}

#[tauri::command]
fn vpn_status() -> Result<VpnStatus, String> {
    let addrs = if_addrs::get_if_addrs().map_err(|e| e.to_string())?;
    let mut all = BTreeSet::new();
    for a in &addrs {
        if a.is_loopback() {
            continue;
        }
        all.insert(a.name.clone());
    }
    let all_interfaces: Vec<String> = all.into_iter().collect();
    let vpn_interfaces: Vec<String> = all_interfaces
        .iter()
        .filter(|n| is_vpn_interface(n))
        .cloned()
        .collect();
    Ok(VpnStatus {
        connected: !vpn_interfaces.is_empty(),
        vpn_interfaces,
        all_interfaces,
    })
}

#[tauri::command]
fn list_running_apps() -> Vec<RunningProcess> {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    let mut seen: BTreeSet<String> = BTreeSet::new();
    let mut out: Vec<RunningProcess> = Vec::new();
    for (pid, proc) in sys.processes() {
        let name = proc.name().to_string_lossy().to_string();
        if name.is_empty() {
            continue;
        }
        if seen.insert(name.clone()) {
            out.push(RunningProcess {
                name,
                pid: pid.as_u32(),
            });
        }
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "macos")]
    set_macos_dock_icon();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![vpn_status, list_running_apps])
        .setup(|app| {
            launch_observer::spawn(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "macos")]
fn set_macos_dock_icon() {
    use objc2::msg_send;
    use objc2::runtime::{AnyClass, AnyObject};

    static ICON: &[u8] = include_bytes!("../icons/icon.png");

    unsafe {
        let ns_data_class = AnyClass::get("NSData").expect("NSData not found");
        let ns_image_class = AnyClass::get("NSImage").expect("NSImage not found");
        let ns_app_class = AnyClass::get("NSApplication").expect("NSApplication not found");

        let data: *mut AnyObject = msg_send![
            ns_data_class,
            dataWithBytes: ICON.as_ptr() as *const std::ffi::c_void,
            length: ICON.len()
        ];
        if data.is_null() { return; }

        let image: *mut AnyObject = msg_send![ns_image_class, alloc];
        let image: *mut AnyObject = msg_send![image, initWithData: data];
        if image.is_null() { return; }

        let app: *mut AnyObject = msg_send![ns_app_class, sharedApplication];
        if app.is_null() { return; }

        let _: () = msg_send![app, setApplicationIconImage: image];
    }
}
