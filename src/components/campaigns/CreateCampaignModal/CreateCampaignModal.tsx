import { useState } from "react";
import { writeTextFile, mkdir, BaseDirectory, exists } from "@tauri-apps/plugin-fs";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updatedAt: string;
  active_scene_id: string | null;
  scenes: any[];
  notes: string;
}

interface CreateCampaignModalProps {
  onCampaignCreated: (campaign: Campaign) => void;
  onClose: () => void;
}

export function CreateCampaignModal({ onCampaignCreated, onClose }: CreateCampaignModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateCampaign(e: React.FormEvent) {
  e.preventDefault();
  if (!name.trim()) return;

  setIsSaving(true);
  try {
    // Check or create the directory safely
    const dirExists = await exists("campaigns", { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await mkdir("campaigns", { 
        baseDir: BaseDirectory.AppData, 
        recursive: true 
      });
    }

    const id = `campaign_${Date.now()}`;
    const now = new Date().toISOString();
    
    const newCampaign: Campaign = {
      id,
      name: name.trim(),
      description: description.trim(),
      created_at: now,
      updatedAt: now,
      active_scene_id: null,
      scenes: [],
      notes: "",
    };

    // Use backslashes or forward slashes consistently
    await writeTextFile(
      `campaigns/${id}.json`,
      JSON.stringify(newCampaign, null, 2),
      { baseDir: BaseDirectory.AppData }
    );

    console.log("Campaign saved successfully:", newCampaign);
    onCampaignCreated(newCampaign);
  } catch (err) {
    // LOG THE ACTUAL ERROR HERE so you can see it in DevTools!
    console.error("Failed to create campaign:", err);
    alert(`Error saving campaign: ${err}`);
  } finally {
    setIsSaving(false);
  }
}

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ background: "#222", padding: "24px", borderRadius: "8px", width: "400px" }}>
        <h3>Create New Campaign</h3>
        
        <form onSubmit={handleCreateCampaign} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label>
            Name:
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Curse of Strahd"
              required 
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              autoFocus
            />
          </label>

          <label>
            Description:
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Brief summary..."
              style={{ width: "100%", padding: "8px", marginTop: "4px", height: "80px" }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 12px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} style={{ padding: "8px 12px", cursor: "pointer", background: "#2196F3", color: "white", border: "none" }}>
              {isSaving ? "Creating..." : "Save Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}