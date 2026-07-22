"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function ContactSettingsPage() {
  const [settings, setSettings] = useState({
    site_name: "",
    site_url: "",
    contact_line: "",
    contact_tel: "",
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

  const labelStyle = { display: "block" as const, fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ข้อมูลเว็บ & ช่องทางติดต่อ</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>ข้อมูลเว็บไซต์และช่องทางติดต่อที่แสดงให้ลูกค้าเห็น</p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ข้อมูลเว็บไซต์</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>ชื่อเว็บไซต์</label>
              <input className="input" value={settings.site_name} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} placeholder="เช่น Game99" />
            </div>
            <div>
              <label style={labelStyle}>URL เว็บไซต์</label>
              <input className="input" value={settings.site_url} onChange={(e) => setSettings({ ...settings, site_url: e.target.value })} placeholder="https://example.com" />
            </div>
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ช่องทางติดต่อ</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Line ID</label>
              <input className="input" value={settings.contact_line} onChange={(e) => setSettings({ ...settings, contact_line: e.target.value })} placeholder="@yourline" />
            </div>
            <div>
              <label style={labelStyle}>เบอร์โทรศัพท์</label>
              <input className="input" value={settings.contact_tel} onChange={(e) => setSettings({ ...settings, contact_tel: e.target.value })} placeholder="0812345678" />
            </div>
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={saving} style={{ background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.7rem 2.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}