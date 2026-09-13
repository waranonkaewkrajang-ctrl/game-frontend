"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Popup {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  show_once: boolean;
  sort_order: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    link_text: "",
    is_active: true,
    show_once: false,
    sort_order: 0,
    start_at: "",
    end_at: "",
  });

  const fetchPopups = () => {
    setLoading(true);
    api.get("/admin/popups").then((res) => {
      setPopups(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPopups(); }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", image_url: "", link_url: "", link_text: "", is_active: true, show_once: false, sort_order: 0, start_at: "", end_at: "" });
    setEditingPopup(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (popup: Popup) => {
    setEditingPopup(popup);
    setForm({
      title: popup.title,
      description: popup.description || "",
      image_url: popup.image_url || "",
      link_url: popup.link_url || "",
      link_text: popup.link_text || "",
      is_active: popup.is_active,
      show_once: popup.show_once,
      sort_order: popup.sort_order,
      start_at: popup.start_at ? popup.start_at.slice(0, 16) : "",
      end_at: popup.end_at ? popup.end_at.slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) { Swal.fire({ icon: "warning", title: "กรุณาใส่หัวข้อ" }); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        link_text: form.link_text || null,
        description: form.description || null,
      };
      if (editingPopup) {
        await api.put(`/admin/popups/${editingPopup.id}`, payload);
        Swal.fire({ icon: "success", title: "แก้ไขสำเร็จ", timer: 1500, showConfirmButton: false });
      } else {
        await api.post("/admin/popups", payload);
        Swal.fire({ icon: "success", title: "สร้าง Popup สำเร็จ", timer: 1500, showConfirmButton: false });
      }
      setShowModal(false);
      resetForm();
      fetchPopups();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
    setSaving(false);
  };

  const handleToggle = async (popup: Popup) => {
    try {
      await api.post(`/admin/popups/${popup.id}/toggle`);
      fetchPopups();
    } catch {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ" });
    }
  };

  const handleDelete = async (popup: Popup) => {
    const confirm = await Swal.fire({ title: "ลบ Popup นี้?", text: popup.title, icon: "warning", showCancelButton: true, confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก", confirmButtonColor: "#ef4444" });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/admin/popups/${popup.id}`);
      Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1500, showConfirmButton: false });
      fetchPopups();
    } catch {
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ" });
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #e2e8f0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>จัดการ Popup</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>สร้าง Popup แสดงกลางจอเมื่อลูกค้าเข้าเว็บ</p>
        </div>
        <button onClick={openCreate} style={{ padding: "0.625rem 1.25rem", background: "#8b5cf6", color: "white", border: "none", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
          + สร้าง Popup
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>กำลังโหลด...</p>
      ) : popups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "0.75rem", border: "2px dashed #e2e8f0" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>ยังไม่มี Popup — กดปุ่ม "สร้าง Popup" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {popups.map((popup) => (
            <div key={popup.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* รูปตัวอย่าง */}
              {popup.image_url ? (
                <img src={popup.image_url} alt="" style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "0.5rem", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "80px", height: "60px", background: "#f1f5f9", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>ไม่มีรูป</span>
                </div>
              )}

              {/* ข้อมูล */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{popup.title}</div>
                {popup.description && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{popup.description}</div>}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: popup.is_active ? "#dcfce7" : "#fee2e2", color: popup.is_active ? "#15803d" : "#b91c1c", fontWeight: 600 }}>
                    {popup.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                  {popup.show_once && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9", fontWeight: 600 }}>แสดงครั้งเดียว</span>}
                  {popup.end_at && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontWeight: 600 }}>หมดอายุ {new Date(popup.end_at).toLocaleDateString("th-TH")}</span>}
                </div>
              </div>

              {/* ปุ่ม */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button onClick={() => handleToggle(popup)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: popup.is_active ? "#fee2e2" : "#dcfce7", color: popup.is_active ? "#b91c1c" : "#15803d", borderColor: popup.is_active ? "#fecaca" : "#bbf7d0" }}>
                  {popup.is_active ? "ปิด" : "เปิด"}
                </button>
                <button onClick={() => openEdit(popup)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: "white", color: "#475569" }}>
                  แก้ไข
                </button>
                <button onClick={() => handleDelete(popup)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #fecaca", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: "#fee2e2", color: "#b91c1c" }}>
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal สร้าง/แก้ไข */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "520px", borderRadius: "0.75rem", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem" }}>
              {editingPopup ? "แก้ไข Popup" : "สร้าง Popup ใหม่"}
            </h3>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={labelStyle}>หัวข้อ *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น ยินดีต้อนรับ, โปรโมชั่นใหม่" style={inputStyle} />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={labelStyle}>รายละเอียด</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="ข้อความที่ต้องการแสดง" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={labelStyle}>รูปภาพ (URL)</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://example.com/image.jpg" style={inputStyle} />
              {form.image_url && <img src={form.image_url} alt="preview" style={{ marginTop: "0.5rem", maxHeight: "120px", borderRadius: "0.5rem", objectFit: "contain" }} />}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={labelStyle}>ลิงก์ URL</label>
                <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/promotions" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ข้อความปุ่ม</label>
                <input value={form.link_text} onChange={(e) => setForm({ ...form, link_text: e.target.value })} placeholder="ดูเพิ่มเติม" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={labelStyle}>เริ่มแสดง</label>
                <input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>หยุดแสดง</label>
                <input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "#475569" }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                เปิดใช้งาน
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "#475569" }}>
                <input type="checkbox" checked={form.show_once} onChange={(e) => setForm({ ...form, show_once: e.target.checked })} />
                แสดงครั้งเดียวต่อ user
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: "#8b5cf6", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                {saving ? "กำลังบันทึก..." : editingPopup ? "บันทึกการแก้ไข" : "สร้าง Popup"}
              </button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}