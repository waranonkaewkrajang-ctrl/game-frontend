"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function GeneralSettingsPage() {
  const [maintenance, setMaintenance] = useState("false");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      setMaintenance(res.data.maintenance_mode || "false");
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/admin/settings", { maintenance_mode: maintenance });
      Swal.fire({ icon: "success", title: maintenance === "true" ? "ปิดปรับปรุงเว็บแล้ว" : "เปิดเว็บแล้ว", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ" });
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ตั้งค่าทั่วไป</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>เปิด/ปิดเว็บไซต์สำหรับลูกค้า</p>

      {/* สถานะปัจจุบัน */}
      <div style={{ background: "white", border: maintenance === "true" ? "2px solid #fca5a5" : "2px solid #bbf7d0", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: maintenance === "true" ? "#ef4444" : "#22c55e", animation: "pulse 2s infinite" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            สถานะเว็บ: {maintenance === "true" ? "ปิดปรับปรุง" : "เปิดใช้งานปกติ"}
          </h3>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => setMaintenance("false")} style={{
            flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "2px solid", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700, transition: "all 0.2s",
            background: maintenance === "false" ? "#22c55e" : "white",
            color: maintenance === "false" ? "white" : "#64748b",
            borderColor: maintenance === "false" ? "#22c55e" : "#e2e8f0",
          }}>
            ✅ เปิดเว็บ
          </button>
          <button onClick={() => setMaintenance("true")} style={{
            flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "2px solid", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700, transition: "all 0.2s",
            background: maintenance === "true" ? "#ef4444" : "white",
            color: maintenance === "true" ? "white" : "#64748b",
            borderColor: maintenance === "true" ? "#ef4444" : "#e2e8f0",
          }}>
            🔧 ปิดปรับปรุง
          </button>
        </div>

        {maintenance === "true" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.75rem", marginTop: "1rem" }}>
            <p style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 500, margin: 0 }}>ลูกค้าจะเห็นหน้าปิดปรับปรุงแทนหน้าเว็บจริง</p>
          </div>
        )}
      </div>

      {/* ปุ่ม Preview + บันทึก */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <button onClick={() => setShowPreview(!showPreview)} style={{
          flex: 1, padding: "0.7rem", borderRadius: "0.375rem", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
        }}>
          {showPreview ? "ซ่อน Preview" : "ดูตัวอย่างหน้าปิดปรับปรุง"}
        </button>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: "0.7rem", borderRadius: "0.375rem", border: "none", background: "#0f172a", color: "white", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
        }}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {/* Preview หน้า Maintenance */}
      {showPreview && (
        <div style={{ border: "2px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden" }}>
          <div style={{ background: "#f1f5f9", padding: "0.5rem 1rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "#64748b" }}>ตัวอย่างหน้าจอลูกค้า</span>
          </div>
          <div style={{
            background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "white", textAlign: "center", padding: "3rem 2rem", minHeight: "300px",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔧</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#f59e0b" }}>ปิดปรับปรุงระบบชั่วคราว</h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", maxWidth: "350px", lineHeight: 1.6 }}>
              ขออภัยในความไม่สะดวก ระบบกำลังปรับปรุงเพื่อให้บริการที่ดีขึ้น กรุณากลับมาใหม่ภายหลัง
            </p>
            <div style={{ marginTop: "1.5rem", padding: "10px 20px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px" }}>
              <p style={{ fontSize: "0.8rem", color: "#f59e0b", margin: 0, fontWeight: 600 }}>ติดต่อสอบถาม: Line หรือโทรหาเราได้เลย</p>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}} />
    </div>
  );
}