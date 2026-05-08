use serde::Serialize;
use std::collections::HashSet;
use std::thread;
use std::time::Duration;
use sysinfo::{ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter};

const POLL_INTERVAL_MS: u64 = 250;
pub const EVENT_NAME: &str = "app-launched";

#[derive(Serialize, Clone, Debug)]
pub struct LaunchEvent {
    pub name: String,
    pub pid: u32,
}

pub fn spawn(app: AppHandle) {
    thread::spawn(move || run(app));
}

fn run(app: AppHandle) {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    let mut known: HashSet<u32> = sys.processes().keys().map(|p| p.as_u32()).collect();

    loop {
        thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
        sys.refresh_processes(ProcessesToUpdate::All, true);

        let mut current: HashSet<u32> = HashSet::with_capacity(known.len() + 8);
        for (pid, proc) in sys.processes() {
            let pid_u32 = pid.as_u32();
            current.insert(pid_u32);
            if known.contains(&pid_u32) {
                continue;
            }
            let name = proc.name().to_string_lossy().to_string();
            if name.is_empty() {
                continue;
            }
            let _ = app.emit(
                EVENT_NAME,
                LaunchEvent {
                    name,
                    pid: pid_u32,
                },
            );
        }
        known = current;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn launch_event_serializes() {
        let ev = LaunchEvent {
            name: "Cursor".into(),
            pid: 1234,
        };
        let json = serde_json::to_string(&ev).unwrap();
        assert!(json.contains("Cursor"));
        assert!(json.contains("1234"));
    }
}
