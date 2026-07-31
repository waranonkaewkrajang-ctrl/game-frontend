"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Rank {
  name: string;
  min_deposit: number;
  color: string;
  image_url: string;
}

export default function RankSettingsPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [saving, setSaving] = useState(false);
  const [newRank, setNewRank] = useState<Rank>({ name: "", min_deposit: 0, color: "#f59e0b", image_url: "" });

  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      try { setRanks(JSON.parse(res.data.ranks || "[]")); } catch { setRanks([]); }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/admin/settings", { ranks: JSON.stringify(ranks) });
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ" });
    }
    setSaving(false);
  };

  const addRank = () => {
    if (!newRank.name || newRank.min_deposit < 0) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบ" });
      return;
    }
    setRanks([...ranks, newRank].sort((a, b) => a.min_deposit - b.min_deposit));
    setNewRank({ name: "", min_deposit: 0, color: "#f59e0b", image_url: "" });
  };

  const removeRank = (index: number) => {
    setRanks(ranks.filter((_, i) => i !== index));
  };

  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ตั้งค่าแรงค์สมาชิก</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>กำหนดระดับแรงค์ตามยอดฝากรวม พร้อมรูปและสีแรงค์</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* รายการแรงค์ */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem" }}>แรงค์ทั้งหมด ({ranks.length})</h3>

          {ranks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {ranks.sort((a, b) => a.min_deposit - b.min_deposit).map((rank, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }}>
                  {rank.image_url ? (
                    <img src={rank.image_url} alt={rank.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "contain" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: rank.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: "#fff" }}>
                      {rank.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: rank.color }}>{rank.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ยอดฝากขั้นต่ำ: {rank.min_deposit.toLocaleString()} บาท</div>
                  </div>
                  <button type="button" onClick={() => removeRank(i)} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>ลบ</button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>ยังไม่มีแรงค์</p>
          )}
        </div>

        {/* เพิ่มแรงค์ */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem" }}>เพิ่มแรงค์ใหม่</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={labelStyle}>ชื่อแรงค์</label>
              <input className="input" value={newRank.name} onChange={(e) => setNewRank({ ...newRank, name: e.target.value })} placeholder="เช่น Bronze, Silver, Gold" />
            </div>
            <div>
              <label style={labelStyle}>ยอดฝากขั้นต่ำ (บาท)</label>
              <input className="input" type="number" value={newRank.min_deposit} onChange={(e) => setNewRank({ ...newRank, min_deposit: parseInt(e.target.value) || 0 })} placeholder="0" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={labelStyle}>สีแรงค์</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="color" value={newRank.color} onChange={(e) => setNewRank({ ...newRank, color: e.target.value })} style={{ width: "40px", height: "36px", border: "none", cursor: "pointer" }} />
                <input className="input" value={newRank.color} onChange={(e) => setNewRank({ ...newRank, color: e.target.value })} placeholder="#f59e0b" style={{ flex: 1 }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>URL รูปแรงค์ (ถ้ามี)</label>
              <input className="input" value={newRank.image_url} onChange={(e) => setNewRank({ ...newRank, image_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          {/* ตัวอย่าง */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>ตัวอย่าง:</span>
            {newRank.image_url ? (
              <img src={newRank.image_url} alt="preview" style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain" }} />
            ) : (
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: newRank.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff" }}>
                {newRank.name.charAt(0) || "?"}
              </div>
            )}
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: newRank.color }}>{newRank.name || "ชื่อแรงค์"}</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({newRank.min_deposit.toLocaleString()}+ บาท)</span>
          </div>

          <button type="button" onClick={addRank} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>+ เพิ่มแรงค์</button>
        </div>

        {/* ปุ่มบันทึก */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={handleSave} disabled={saving} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.7rem 2.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}