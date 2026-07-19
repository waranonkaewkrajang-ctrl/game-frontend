"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";
import { Gift, Plus, Edit, Trash2, X } from "lucide-react";

interface Promotion {
  id: number;
  title: string;
  type: string;
  bonus_percent: number;
  turnover_multiplier: number;
  min_deposit: number;
  max_bonus: number;
  max_withdraw: number;
  is_active: boolean;
}

const typeLabels: Record<string, string> = { 
  welcome_bonus: "โบนัสสมาชิกใหม่", 
  deposit_bonus: "โบนัสฝากเงิน", 
  cashback: "คืนยอดเสีย", 
  free_credit: "เครดิตฟรี", 
  referral_bonus: "โบนัสชวนเพื่อน" 
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
    id: "", title: "", type: "deposit_bonus", bonus_percent: "", 
    turnover_multiplier: "", min_deposit: "", max_bonus: "", max_withdraw: "", is_active: true 
  });

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

  useEffect(() => { 
    fetchPromotions(); 
  }, []);

  const openModal = (promo: Promotion | null = null) => {
    if (promo) {
      setFormData({
        id: promo.id.toString(),
        title: promo.title,
        type: promo.type,
        min_deposit: promo.min_deposit?.toString() || "",
        max_bonus: promo.max_bonus?.toString() || "",
        bonus_percent: promo.bonus_percent?.toString() || "",
        turnover_multiplier: promo.turnover_multiplier?.toString() || "",
        max_withdraw: promo.max_withdraw?.toString() || "",
        is_active: promo.is_active,
      });
    } else {
      setFormData({ 
        id: "", title: "", type: "deposit_bonus", bonus_percent: "", 
        turnover_multiplier: "", min_deposit: "", max_bonus: "", max_withdraw: "", is_active: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSaving(true);
    
    const payload = {
      title: formData.title,
      type: formData.type,
      min_deposit: Number(formData.min_deposit) || 0,
      max_bonus: Number(formData.max_bonus) || 0,
      bonus_percent: Number(formData.bonus_percent) || 0,
      turnover_multiplier: Number(formData.turnover_multiplier) || 0,
      max_withdraw: Number(formData.max_withdraw) || 0,
      is_active: formData.is_active ? 1 : 0,
    };

    try { 
      if (formData.id) {
        await api.put(`/admin/promotions/${formData.id}`, payload);
      } else {
        await api.post("/admin/promotions", payload); 
      }
      setIsModalOpen(false); 
      fetchPromotions();
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลโปรโมชันเรียบร้อยแล้ว', confirmButtonColor: '#0f172a' });
    } catch (err: any) { 
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้" });
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = (id: number, title: string) => {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบโปรโมชัน "${title}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/admin/promotions/${id}`);
          fetchPromotions();
          Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'โปรโมชันถูกลบออกจากระบบแล้ว', confirmButtonColor: '#0f172a' });
        } catch (err: any) {
          Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถลบโปรโมชันได้' });
        }
      }
    });
  };

  // --- Inline Styles กลางเพื่อความสะอาดของโค้ด ---
  const inputStyle = { padding: "0.6rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", color: "#334155", width: "100%", outline: "none", boxSizing: "border-box" as const, marginTop: "0.3rem" };
  const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155" };

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
        <button 
          onClick={() => openModal()} 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0f172a", color: "white", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", border: "none", fontSize: "0.875rem", fontWeight: 500 }}
        >
          <Plus size={18} /> เพิ่มโปรโมชัน
        </button>
      </div>

      {/* Grid การ์ดโปรโมชัน */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {promotions.map((p) => (
            <div key={p.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)" }}>
              {/* แถบสีสถานะด้านบน */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: p.is_active ? "#10b981" : "#ef4444" }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0, color: "#1e293b", paddingRight: "1rem" }}>{p.title}</h3>
                <span style={{ background: p.is_active ? "#dcfce7" : "#fee2e2", color: p.is_active ? "#15803d" : "#b91c1c", padding: "0.25rem 0.6rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {p.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "#64748b" }}>ประเภท:</span>
                  <span style={{ fontWeight: 500, color: "#334155" }}>{typeLabels[p.type] || p.type}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "#64748b" }}>ฝากขั้นต่ำ:</span>
                  <span style={{ fontWeight: 600, color: "#2563eb" }}>{p.min_deposit} ฿</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "#64748b" }}>โบนัส / เทิร์น:</span>
                  <span style={{ fontWeight: 500, color: "#334155" }}>+{p.bonus_percent}% / {p.turnover_multiplier}x</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                <button onClick={() => openModal(p)} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.3rem", padding: "0.5rem", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
                  <Edit size={16} /> แก้ไข
                </button>
                <button onClick={() => handleDelete(p.id, p.title)} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.3rem", padding: "0.5rem", border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
                  <Trash2 size={16} /> ลบ
                </button>
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

      {/* Modal Popup (ฟอร์มแบบเต็ม) */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "0.75rem", width: "100%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderTopLeftRadius: "0.75rem", borderTopRightRadius: "0.75rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {formData.id ? "แก้ไขโปรโมชัน" : "เพิ่มโปรโมชันใหม่"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              <form id="promoForm" onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>ชื่อโปรโมชัน *</label>
                  <input type="text" required style={inputStyle} placeholder="เช่น โบนัสสมาชิกใหม่ 100%" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>ประเภทโปรโมชัน *</label>
                  <select style={inputStyle} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    <option value="welcome_bonus">โบนัสสมาชิกใหม่ (Welcome Bonus)</option>
                    <option value="deposit_bonus">โบนัสยอดฝาก (Deposit Bonus)</option>
                    <option value="cashback">คืนยอดเสีย (Cashback)</option>
                    <option value="free_credit">เครดิตฟรี (Free Credit)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>ฝากขั้นต่ำ (บาท)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.min_deposit} onChange={(e) => setFormData({ ...formData, min_deposit: e.target.value })} />
                </div>

                <div>
                  <label style={labelStyle}>โบนัสที่ได้รับ (%)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.bonus_percent} onChange={(e) => setFormData({ ...formData, bonus_percent: e.target.value })} />
                </div>

                <div>
                  <label style={labelStyle}>รับโบนัสสูงสุดไม่เกิน (บาท)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.max_bonus} onChange={(e) => setFormData({ ...formData, max_bonus: e.target.value })} />
                </div>

                <div>
                  <label style={labelStyle}>เทิร์นโอเวอร์ (เท่า)</label>
                  <input type="number" min="0" step="0.1" style={inputStyle} placeholder="เช่น 3" value={formData.turnover_multiplier} onChange={(e) => setFormData({ ...formData, turnover_multiplier: e.target.value })} />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>ถอนได้สูงสุด (บาท, 0 = ไม่อั้น)</label>
                  <input type="number" min="0" style={inputStyle} value={formData.max_withdraw} onChange={(e) => setFormData({ ...formData, max_withdraw: e.target.value })} />
                </div>

                <div style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                    <input type="checkbox" style={{ width: "16px", height: "16px", cursor: "pointer" }} checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    เปิดใช้งานโปรโมชันนี้ทันที
                  </label>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
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