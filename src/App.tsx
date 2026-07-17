import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [dmName, setDmName] = useState("");
  const [status, setStatus] = useState("No session active.");

  async function handleStartSession() {
    try {
      const response = await invoke<string>("start_local_session", { dmName });
      setStatus(response);
    } catch (err) {
      console.error("Failed to talk to Rust:", err);
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>VTT DM Control Panel</h1>
      <hr />
      
      <div style={{ margin: "20px 0" }}>
        <input 
          type="text" 
          placeholder="Enter DM Name" 
          value={dmName} 
          onChange={(e) => setDmName(e.target.value)} 
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <button onClick={handleStartSession} style={{ padding: "8px 16px" }}>
          Start Local Session
        </button>
      </div>

      <div style={{ padding: "10px", background: "#eee", borderRadius: "4px" }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}

export default App;
