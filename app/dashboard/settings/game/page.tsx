"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function GameSettingsPage() {
  const [settings, setSettings] = useState({
    cashback_percent: "5",
    referral_percent: "1",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      setSettings((prev) => ({ ...prev, ...res.data }));
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/settings", settings);
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ" });
    }
    setSaving(false);
  };

  const labelStyle = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ตั้งค่าเกม & โปรโมชัน</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>กำหนด % คืนยอดเสีย และ % ค่าคอมแนะนำเพื่อน</p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* คืนยอดเสีย */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>คืนยอดเสีย (Cashback)</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>ระบบจะคำนวณยอดเสียรายวัน แล้วจ่ายคืนตาม % ที่ตั้งไว้</p>
          <div>
            <label style={labelStyle}>% คืนยอดเสีย</label>
            <input className="input" type="number" step="0.1" min="0" max="100" value={settings.cashback_percent} onChange={(e) => setSettings({ ...settings, cashback_percent: e.target.value })} placeholder="เช่น 5" />
          </div>
          <div style={{ marginTop: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.75rem" }}>
            <p style={{ fontSize: "0.78rem", color: "#166534", margin: 0 }}>ตัวอย่าง: ลูกค้าเสีย 1,000 บาท → ได้คืน {(1000 * parseFloat(settings.cashback_percent || "0") / 100).toFixed(2)} บาท</p>
          </div>
        </div>

        {/* แนะนำเพื่อน */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>แนะนำเพื่อน (Referral Commission)</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>คิดค่าคอมอัตโนมัติทุกครั้งที่คนถูกแนะนำเล่นเกม โดยคิดจากยอดเดิมพัน</p>
          <div>
            <label style={labelStyle}>% ค่าคอมแนะนำเพื่อน</label>
            <input className="input" type="number" step="0.1" min="0" max="100" value={settings.referral_percent} onChange={(e) => setSettings({ ...settings, referral_percent: e.target.value })} placeholder="เช่น 1" />
          </div>
          <div style={{ marginTop: "0.75rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.5rem", padding: "0.75rem" }}>
            <p style={{ fontSize: "0.78rem", color: "#1d4ed8", margin: 0 }}>ตัวอย่าง: เพื่อนเดิมพัน 100 บาท → ผู้แนะนำได้ {(100 * parseFloat(settings.referral_percent || "0") / 100).toFixed(2)} บาท</p>
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={saving} style={{ background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.7rem 2.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}