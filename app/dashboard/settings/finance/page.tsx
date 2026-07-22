"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function FinanceSettingsPage() {
  const [settings, setSettings] = useState({
    min_deposit: "",
    max_deposit: "",
    min_withdraw: "",
    max_withdraw: "",
    auto_approve_deposit: "false",
    auto_approve_withdraw: "false",
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
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ตั้งค่าการเงิน</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>กำหนดขั้นต่ำ-สูงสุดการฝาก/ถอน และการอนุมัติอัตโนมัติ</p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ฝากเงิน */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ฝากเงิน</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>ฝากขั้นต่ำ (บาท)</label>
              <input className="input" type="number" value={settings.min_deposit} onChange={(e) => setSettings({ ...settings, min_deposit: e.target.value })} placeholder="100" />
            </div>
            <div>
              <label style={labelStyle}>ฝากสูงสุด (บาท)</label>
              <input className="input" type="number" value={settings.max_deposit} onChange={(e) => setSettings({ ...settings, max_deposit: e.target.value })} placeholder="50000" />
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <label style={labelStyle}>อนุมัติฝากอัตโนมัติ</label>
            <select className="input" value={settings.auto_approve_deposit} onChange={(e) => setSettings({ ...settings, auto_approve_deposit: e.target.value })}>
              <option value="false">ปิด — ต้องอนุมัติเอง</option>
              <option value="true">เปิด — อนุมัติอัตโนมัติ</option>
            </select>
          </div>
        </div>

        {/* ถอนเงิน */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ถอนเงิน</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>ถอนขั้นต่ำ (บาท)</label>
              <input className="input" type="number" value={settings.min_withdraw} onChange={(e) => setSettings({ ...settings, min_withdraw: e.target.value })} placeholder="300" />
            </div>
            <div>
              <label style={labelStyle}>ถอนสูงสุด (บาท)</label>
              <input className="input" type="number" value={settings.max_withdraw} onChange={(e) => setSettings({ ...settings, max_withdraw: e.target.value })} placeholder="50000" />
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <label style={labelStyle}>อนุมัติถอนอัตโนมัติ</label>
            <select className="input" value={settings.auto_approve_withdraw} onChange={(e) => setSettings({ ...settings, auto_approve_withdraw: e.target.value })}>
              <option value="false">ปิด — ต้องอนุมัติเอง</option>
              <option value="true">เปิด — อนุมัติอัตโนมัติ</option>
            </select>
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