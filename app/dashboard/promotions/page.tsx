"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";
import { Gift, Plus, Edit, Trash2, X, Image, Calendar, Users, Eye } from "lucide-react";

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  type: string;
  bonus_percent: number;
  turnover_multiplier: number;
  min_deposit: number;
  max_bonus: number;
  max_withdraw: number;
  is_active: boolean;
  max_claims: number | null;
  claims_per_user: number | null;
  start_at: string | null;
  end_at: string | null;
}

const typeLabels: Record<string, string> = {
  welcome_bonus: "โบนัสสมาชิกใหม่",
  deposit_bonus: "โบนัสฝากเงิน",
  cashback: "คืนยอดเสีย",
  free_credit: "เครดิตฟรี",
  referral_bonus: "โบนัสชวนเพื่อน",
};

const defaultForm = {
  id: "", title: "", description: "", image_url: "", type: "deposit_bonus",
  bonus_percent: "", turnover_multiplier: "", min_deposit: "", max_bonus: "",
  max_withdraw: "", is_active: true, max_claims: "", claims_per_user: "1",
  start_at: "", end_at: "",
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({ ...defaultForm });

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/promotions");
      setPromotions(res.data.data.data || res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const toLocalDatetime = (d: string | null) => {
    if (!d) return "";
    try { return new Date(d).toISOString().slice(0, 16); } catch { return ""; }
  };

  const openModal = (promo: Promotion | null = null) => {
    if (promo) {
      setFormData({
        id: promo.id.toString(),
        title: promo.title,
        description: promo.description || "",
        image_url: promo.image_url || "",
        type: promo.type,
        min_deposit: promo.min_deposit?.toString() || "",
        max_bonus: promo.max_bonus?.toString() || "",
        bonus_percent: promo.bonus_percent?.toString() || "",
        turnover_multiplier: promo.turnover_multiplier?.toString() || "",
        max_withdraw: promo.max_withdraw?.toString() || "",
        is_active: promo.is_active,
        max_claims: promo.max_claims?.toString() || "",
        claims_per_user: promo.claims_per_user?.toString() || "1",
        start_at: toLocalDatetime(promo.start_at),
        end_at: toLocalDatetime(promo.end_at),
      });
    } else {
      setFormData({ ...defaultForm });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, any> = {
      title: formData.title,
      description: formData.description || null,
      image_url: formData.image_url || null,
      type: formData.type,
      min_deposit: Number(formData.min_deposit) || 0,
      max_bonus: Number(formData.max_bonus) || 0,
      bonus_percent: Number(formData.bonus_percent) || 0,
      turnover_multiplier: Number(formData.turnover_multiplier) || 0,
      max_withdraw: Number(formData.max_withdraw) || 0,
      is_active: formData.is_active ? 1 : 0,
      max_claims: formData.max_claims ? Number(formData.max_claims) : null,
      claims_per_user: Number(formData.claims_per_user) || 1,
      start_at: formData.start_at || null,
      end_at: formData.end_at || null,
    };

    try {
      if (formData.id) {
        await api.put(`/admin/promotions/${formData.id}`, payload);
      } else {
        await api.post("/admin/promotions", payload);
      }
      setIsModalOpen(false);
      fetchPromotions();
      Swal.fire({ icon: "success", title: "สำเร็จ", text: "บันทึกข้อมูลโปรโมชันเรียบร้อยแล้ว", confirmButtonColor: "#0f172a" });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ข้อผิดพลาด", text: err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number, title: string) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบโปรโมชัน "${title}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/admin/promotions/${id}`);
          fetchPromotions();
          Swal.fire({ icon: "success", title: "ลบสำเร็จ!", confirmButtonColor: "#0f172a" });
        } catch {
          Swal.fire({ icon: "error", title: "ผิดพลาด", text: "ไม่สามารถลบโปรโมชันได้" });
        }
      }
    });
  };

  const inputStyle = { padding: "0.6rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", color: "#334155", width: "100%", outline: "none", boxSizing: "border-box" as const, marginTop: "0.3rem" };
  const labelStyle = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155" };
  const sectionTitle = (icon: any, text: string) => (
    <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "6px", paddingBottom: "6px", borderBottom: "1px solid #e2e8f0", marginTop: "8px" }}>
      {icon}
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{text}</span>
    </div>
  );

  return (
    <div style={{ padding: "1.5rem", color: "#0f172a", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Gift color="#2563eb" /> จัดการโปรโมชัน
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>สร้างและตั้งค่าเงื่อนไขโปรโมชันสำหรับสมาชิก</p>
        </div>
        <button onClick={() => openModal()} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0f172a", color: "white", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", border: "none", fontSize: "0.875rem", fontWeight: 500 }}>
          <Plus size={18} /> เพิ่มโปรโมชัน
        </button>
      </div>

      {/* Grid การ์ด */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {promotions.map((p) => (
            <div key={p.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)" }}>
              {/* แถบสีสถานะ */}
              <div style={{ height: "4px", background: p.is_active ? "#10b981" : "#ef4444" }} />

              {/* รูปภาพ (ถ้ามี) */}
              {p.image_url && (
                <img src={p.image_url} alt={p.title} style={{ width: "100%", height: "140px", objectFit: "contain", backgroundColor: "transparent" }} />
              )}

              <div style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0, color: "#1e293b", flex: 1, paddingRight: "0.5rem" }}>{p.title}</h3>
                  <span style={{ background: p.is_active ? "#dcfce7" : "#fee2e2", color: p.is_active ? "#15803d" : "#b91c1c", padding: "0.2rem 0.6rem", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {p.is_active ? "เปิด" : "ปิด"}
                  </span>
                </div>

                {/* รายละเอียด */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                  <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "6px 8px" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.65rem" }}>ประเภท</div>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{typeLabels[p.type] || p.type}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "6px 8px" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.65rem" }}>ฝากขั้นต่ำ</div>
                    <div style={{ fontWeight: 600, color: "#2563eb" }}>฿{p.min_deposit?.toLocaleString()}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "6px 8px" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.65rem" }}>โบนัส / สูงสุด</div>
                    <div style={{ fontWeight: 600, color: "#7c3aed" }}>{p.bonus_percent}% / ฿{p.max_bonus?.toLocaleString()}</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "6px 8px" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.65rem" }}>Turnover / ถอนสูงสุด</div>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{p.turnover_multiplier}x / ฿{p.max_withdraw?.toLocaleString() || "ไม่อั้น"}</div>
                  </div>
                </div>

                {/* สิทธิ์ + วันที่ */}
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.75rem", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {p.claims_per_user && <span>สิทธิ์/คน: {p.claims_per_user}</span>}
                  {p.max_claims && <span>สิทธิ์ทั้งหมด: {p.max_claims}</span>}
                  {p.start_at && <span>เริ่ม: {new Date(p.start_at).toLocaleDateString("th-TH")}</span>}
                  {p.end_at && <span>สิ้นสุด: {new Date(p.end_at).toLocaleDateString("th-TH")}</span>}
                </div>

                {/* ปุ่ม */}
                <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                  <button onClick={() => openModal(p)} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.3rem", padding: "0.45rem", border: "1px solid #fdba74", background: "#ffedd5", color: "#ea580c", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                    <Edit size={14} /> แก้ไข
                  </button>
                  <button onClick={() => handleDelete(p.id, p.title)} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.3rem", padding: "0.45rem", border: "1px solid #dc2626", background: "#ef4444", color: "white", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                    <Trash2 size={14} /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
          {promotions.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", background: "white", borderRadius: "0.5rem", border: "1px solid #e2e8f0", color: "#64748b" }}>
              ไม่พบข้อมูลโปรโมชันในระบบ
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "0.75rem", width: "100%", maxWidth: "680px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>

            {/* Header */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderTopLeftRadius: "0.75rem", borderTopRightRadius: "0.75rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {formData.id ? "แก้ไขโปรโมชัน" : "เพิ่มโปรโมชันใหม่"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1 }}>
              <form id="promoForm" onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>

                {/* === ข้อมูลหลัก === */}
                {sectionTitle(<Gift size={14} color="#2563eb" />, "ข้อมูลหลัก")}

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>ชื่อโปรโมชัน *</label>
                  <input type="text" required style={inputStyle} placeholder="เช่น สมาชิกใหม่รับ 100%" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>ประเภท *</label>
                  <select style={inputStyle} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    <option value="welcome_bonus">โบนัสสมาชิกใหม่</option>
                    <option value="deposit_bonus">โบนัสฝากเงิน</option>
                    <option value="cashback">คืนยอดเสีย</option>
                    <option value="free_credit">เครดิตฟรี</option>
                    <option value="referral_bonus">โบนัสชวนเพื่อน</option>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>รายละเอียด / เนื้อหา (รองรับ HTML)</label>
                  <textarea style={{ ...inputStyle, minHeight: "100px", resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem" }} placeholder="รายละเอียดเงื่อนไข... (ใส่ HTML ได้)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  {formData.description && (
                    <button type="button" onClick={() => setPreviewOpen(!previewOpen)} style={{ marginTop: "4px", background: "none", border: "none", color: "#2563eb", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Eye size={12} /> {previewOpen ? "ซ่อนพรีวิว" : "ดูพรีวิว"}
                    </button>
                  )}
                  {previewOpen && formData.description && (
                    <div style={{ marginTop: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px", fontSize: "0.8rem", color: "#334155", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formData.description }} />
                  )}
                </div>

                {/* === รูปภาพ === */}
                {sectionTitle(<Image size={14} color="#2563eb" />, "รูปภาพ")}

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>รูปภาพโปรโมชัน (อัพโหลด หรือ ใส่ URL)</label>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", background: "#2563eb", color: "white", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                       อัพโหลดภาพ
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { Swal.fire({ icon: "warning", title: "ไฟล์ใหญ่เกิน 5MB" }); return; }
                        const fd = new FormData();
                        fd.append("image", file);
                        try {
                          const res = await api.post("/admin/promotions/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
                          if (res.data.url) { setFormData({ ...formData, image_url: res.data.url }); Swal.fire({ icon: "success", title: "อัพโหลดสำเร็จ", timer: 1500, showConfirmButton: false }); }
                        } catch { Swal.fire({ icon: "error", title: "อัพโหลดไม่สำเร็จ" }); }
                      }}
                    />
                    </label>
                  </div>
                  <input type="url" style={{ ...inputStyle, marginTop: "6px" }} placeholder="หรือวาง URL รูปภาพ https://..." value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                  {formData.image_url && (
                    <div style={{ marginTop: "8px", position: "relative", display: "inline-block", width: "100%" }}>
                      <img src={formData.image_url} alt="preview" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} style={{ position: "absolute", top: "4px", right: "4px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  )}
                </div>

                {/* === เงื่อนไขการเงิน === */}
                {sectionTitle(<Gift size={14} color="#10b981" />, "เงื่อนไขการเงิน")}

                <div>
                  <label style={labelStyle}>ฝากขั้นต่ำ (บาท)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.min_deposit} onChange={(e) => setFormData({ ...formData, min_deposit: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>โบนัส (%)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.bonus_percent} onChange={(e) => setFormData({ ...formData, bonus_percent: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>โบนัสสูงสุด (บาท)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.max_bonus} onChange={(e) => setFormData({ ...formData, max_bonus: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Turnover (เท่า)</label>
                  <input type="number" min="0" step="0.1" style={inputStyle} placeholder="เช่น 3" value={formData.turnover_multiplier} onChange={(e) => setFormData({ ...formData, turnover_multiplier: e.target.value })} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>ถอนได้สูงสุด (บาท, 0 = ไม่อั้น)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.max_withdraw} onChange={(e) => setFormData({ ...formData, max_withdraw: e.target.value })} />
                </div>

                {/* === จำกัดสิทธิ์ === */}
                {sectionTitle(<Users size={14} color="#f59e0b" />, "จำกัดสิทธิ์")}

                <div>
                  <label style={labelStyle}>สิทธิ์ต่อคน</label>
                  <input type="number" min="1" style={inputStyle} placeholder="1" value={formData.claims_per_user} onChange={(e) => setFormData({ ...formData, claims_per_user: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>สิทธิ์ทั้งหมด (เว้นว่าง = ไม่จำกัด)</label>
                  <input type="number" min="1" style={inputStyle} placeholder="ไม่จำกัด" value={formData.max_claims} onChange={(e) => setFormData({ ...formData, max_claims: e.target.value })} />
                </div>

                {/* === กำหนดเวลา === */}
                {sectionTitle(<Calendar size={14} color="#7c3aed" />, "กำหนดเวลา (เว้นว่าง = ไม่จำกัด)")}

                <div>
                  <label style={labelStyle}>วันเริ่มต้น</label>
                  <input type="datetime-local" style={inputStyle} value={formData.start_at} onChange={(e) => setFormData({ ...formData, start_at: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>วันสิ้นสุด</label>
                  <input type="datetime-local" style={inputStyle} value={formData.end_at} onChange={(e) => setFormData({ ...formData, end_at: e.target.value })} />
                </div>

                {/* === สถานะ === */}
                <div style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                    <input type="checkbox" style={{ width: "16px", height: "16px", cursor: "pointer" }} checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    เปิดใช้งานโปรโมชันนี้ทันที
                  </label>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem", background: "#f8fafc", borderBottomLeftRadius: "0.75rem", borderBottomRightRadius: "0.75rem" }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "white", color: "#475569", borderRadius: "0.375rem", fontWeight: 500, cursor: "pointer", fontSize: "0.875rem" }}>
                ยกเลิก
              </button>
              <button type="submit" form="promoForm" disabled={saving} style={{ padding: "0.5rem 1.25rem", border: "none", background: "#10b981", color: "white", borderRadius: "0.375rem", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontSize: "0.875rem", opacity: saving ? 0.7 : 1 }}>
                {saving ? "กำลังบันทึก..." : "บันทึกโปรโมชัน"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}