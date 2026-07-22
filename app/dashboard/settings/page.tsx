"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState({
    site_name: "",
    site_url: "",
    line_notify_token: "",
    contact_line: "",
    contact_tel: "",
    maintenance_mode: "false",
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
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ตั้งค่าทั่วไป</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>ข้อมูลเว็บไซต์ ช่องทางติดต่อ และโหมดปิดปรับปรุง</p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ข้อมูลเว็บไซต์ */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ข้อมูลเว็บไซต์</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>ชื่อเว็บไซต์</label>
              <input className="input" value={settings.site_name} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} placeholder="เช่น Game Platform" />
            </div>
            <div>
              <label style={labelStyle}>URL เว็บไซต์</label>
              <input className="input" value={settings.site_url} onChange={(e) => setSettings({ ...settings, site_url: e.target.value })} placeholder="https://example.com" />
            </div>
          </div>
        </div>

        {/* ช่องทางติดต่อ */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ช่องทางติดต่อ</h3>
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Line Notify Token</label>
            <input className="input" value={settings.line_notify_token} onChange={(e) => setSettings({ ...settings, line_notify_token: e.target.value })} placeholder="กรอก Token จาก Line Notify" />
          </div>
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

        {/* โหมดปิดปรับปรุง */}
        <div style={{ background: "white", border: settings.maintenance_mode === "true" ? "2px solid #fca5a5" : "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>โหมดปิดปรับปรุง</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>เมื่อเปิดใช้งาน ลูกค้าจะไม่สามารถเข้าใช้งานเว็บได้</p>
          <select className="input" value={settings.maintenance_mode} onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value })}
            style={{ borderColor: settings.maintenance_mode === "true" ? "#fca5a5" : undefined, color: settings.maintenance_mode === "true" ? "#dc2626" : undefined }}>
            <option value="false">ปิด — เว็บใช้งานปกติ</option>
            <option value="true">เปิด — ปิดปรับปรุงระบบ</option>
          </select>
          {settings.maintenance_mode === "true" && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.75rem", marginTop: "0.75rem" }}>
              <p style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 500, margin: 0 }}>ลูกค้าจะไม่สามารถเข้าใช้งานเว็บไซต์ได้จนกว่าจะปิดโหมดนี้</p>
            </div>
          )}
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