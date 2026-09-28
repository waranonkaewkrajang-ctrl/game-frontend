"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Rank {
  name: string;
  min_deposit: number;
  color: string;
  image_url: string;
}

const emptyRank = (): Rank => ({ name: "", min_deposit: 0, color: "#f59e0b", image_url: "" });

export default function RankSettingsPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Rank>(emptyRank());
  const [editIndex, setEditIndex] = useState<number | null>(null);   // null = เพิ่มใหม่
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      try { setRanks(JSON.parse(res.data.ranks || "[]")); } catch { setRanks([]); }
    }).catch(() => {});
  }, []);

  const sorted = [...ranks].sort((a, b) => a.min_deposit - b.min_deposit);

  const handleSave = async () => {
    // เตือนถ้ายอดขั้นต่ำซ้ำกัน — ระบบจะเลือกแรงค์เพี้ยน
    const amounts = ranks.map((r) => r.min_deposit);
    const dup = amounts.filter((v, i) => amounts.indexOf(v) !== i);
    if (dup.length > 0) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "ยอดฝากขั้นต่ำซ้ำกัน",
        text: `มีแรงค์ที่ตั้งยอด ${[...new Set(dup)].join(", ")} เท่ากัน ระบบอาจเลือกแรงค์ผิด`,
        showCancelButton: true,
        confirmButtonText: "บันทึกต่อ",
        cancelButtonText: "กลับไปแก้",
        confirmButtonColor: "#f59e0b",
      });
      if (!ok.isConfirmed) return;
    }

    setSaving(true);
    try {
      await api.post("/admin/settings", { ranks: JSON.stringify(sorted) });
      setRanks(sorted);
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ" });
    }
    setSaving(false);
  };

  const submitForm = () => {
    const name = form.name.trim();                       // ตัดช่องว่างหัวท้าย
    if (!name || form.min_deposit < 0) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบ" });
      return;
    }
    const clean: Rank = { ...form, name };

    if (editIndex !== null) {
      const list = ranks.slice();
      list[editIndex] = clean;
      setRanks(list);
      Swal.fire({ icon: "success", title: "แก้ไขแล้ว — อย่าลืมกดบันทึก", timer: 1600, showConfirmButton: false });
    } else {
      setRanks([...ranks, clean]);
    }
    setForm(emptyRank());
    setEditIndex(null);
  };

  const startEdit = (rank: Rank) => {
    const idx = ranks.findIndex((r) => r.name === rank.name && r.min_deposit === rank.min_deposit);
    if (idx < 0) return;
    setForm({ ...ranks[idx] });
    setEditIndex(idx);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setForm(emptyRank());
    setEditIndex(null);
  };

  const removeRank = async (rank: Rank) => {
    const r = await Swal.fire({
      title: "ลบแรงค์นี้?",
      text: rank.name,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!r.isConfirmed) return;
    setRanks(ranks.filter((x) => !(x.name === rank.name && x.min_deposit === rank.min_deposit)));
    if (editIndex !== null) cancelEdit();
  };

  // อัปโหลดรูปเข้าเซิร์ฟเวอร์เรา — ไม่ต้องพึ่งเว็บนอก
  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "ไฟล์ใหญ่เกิน 3MB" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/admin/ranks/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, image_url: res.data.url }));
      Swal.fire({
        icon: "success",
        title: "อัปโหลดสำเร็จ",
        text: res.data.size ? `เก็บไว้ในเซิร์ฟเวอร์แล้ว ${Math.round(res.data.size / 1024)} KB` : "",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "อัปโหลดไม่สำเร็จ", text: err.response?.data?.message || "" });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" };
  const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" };

  const badge = (rank: Rank, size: number) =>
    rank.image_url ? (
      <img src={rank.image_url} alt={rank.name} style={{ width: size, height: size, borderRadius: size / 5, objectFit: "contain", flexShrink: 0 }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: size / 5, background: rank.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
        {rank.name.charAt(0) || "?"}
      </div>
    );

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ตั้งค่าแรงค์สมาชิก</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>กำหนดระดับแรงค์ตามยอดฝากรวม พร้อมรูปและสีแรงค์</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* รายการแรงค์ */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem" }}>แรงค์ทั้งหมด ({ranks.length})</h3>

          {sorted.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sorted.map((rank, i) => {
                const next = sorted[i + 1];
                return (
                  <div key={`${rank.name}-${rank.min_deposit}-${i}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, width: 18 }}>{i + 1}</span>
                    {badge(rank, 40)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: rank.color }}>{rank.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {rank.min_deposit.toLocaleString()}
                        {next ? ` – ${(next.min_deposit - 1).toLocaleString()}` : "+"} บาท
                      </div>
                    </div>
                    <button type="button" onClick={() => startEdit(rank)} style={{ fontSize: "0.75rem", padding: "4px 12px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer", background: "white", color: "#334155", fontWeight: 600 }}>แก้ไข</button>
                    <button type="button" onClick={() => removeRank(rank)} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>ลบ</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>ยังไม่มีแรงค์</p>
          )}

          {sorted.length === 1 && (
            <p style={{ marginTop: "0.9rem", fontSize: "0.75rem", color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.5rem", padding: "0.6rem 0.75rem" }}>
              มีแรงค์เดียว ลูกค้าทุกคนจะได้แรงค์นี้ และแถบความคืบหน้าจะเต็ม 100% ตลอด — เพิ่มอีกอย่างน้อย 1 ระดับเพื่อให้ไต่ระดับได้
            </p>
          )}
        </div>

        {/* เพิ่ม / แก้ไขแรงค์ */}
        <div style={{ ...cardStyle, borderColor: editIndex !== null ? "#bfdbfe" : "#e2e8f0", boxShadow: editIndex !== null ? "0 8px 24px -12px rgba(37,99,235,.35)" : "none" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem" }}>
            {editIndex !== null ? `แก้ไขแรงค์: ${ranks[editIndex]?.name || ""}` : "เพิ่มแรงค์ใหม่"}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={labelStyle}>ชื่อแรงค์</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Bronze, Silver, Gold" />
            </div>
            <div>
              <label style={labelStyle}>ยอดฝากขั้นต่ำ (บาท)</label>
              <input className="input" type="number" min="0" value={form.min_deposit} onChange={(e) => setForm({ ...form, min_deposit: parseInt(e.target.value) || 0 })} placeholder="0" />
            </div>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>สีแรงค์</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", maxWidth: "50%" }}>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: "40px", height: "36px", border: "none", cursor: "pointer" }} />
              <input className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#f59e0b" style={{ flex: 1 }} />
            </div>
          </div>

          {/* รูปแรงค์ */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>รูปแรงค์</label>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", padding: "0.7rem", border: "1px dashed #cbd5e1", borderRadius: "0.6rem", background: "#f8fafc" }}>
              <div style={{ width: 64, height: 64, borderRadius: "0.5rem", background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {form.image_url
                  ? <img src={form.image_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  : <span style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>ไม่มีรูป</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "#4f46e5", border: "none", color: "white", padding: "0.45rem 0.9rem", borderRadius: "0.45rem", cursor: uploading ? "wait" : "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                    {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
                  </button>
                  {form.image_url && (
                    <button type="button" onClick={() => setForm({ ...form, image_url: "" })} style={{ background: "white", border: "1px solid #fecaca", color: "#dc2626", padding: "0.45rem 0.8rem", borderRadius: "0.45rem", cursor: "pointer", fontSize: "0.78rem" }}>ลบรูป</button>
                  )}
                </div>
                <input className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="หรือวาง URL รูป https://..." style={{ marginTop: "0.5rem", fontSize: "0.78rem" }} />
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.35rem" }}>PNG / JPG / WebP / SVG · ไม่เกิน 3MB — ระบบแปลงเป็น WebP และเก็บในเซิร์ฟเวอร์เราให้อัตโนมัติ</div>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
          </div>

          {/* ตัวอย่าง */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>ตัวอย่าง:</span>
            {badge(form, 32)}
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: form.color }}>{form.name.trim() || "ชื่อแรงค์"}</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({form.min_deposit.toLocaleString()}+ บาท)</span>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="button" onClick={submitForm} style={{ background: editIndex !== null ? "#2563eb" : "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
              {editIndex !== null ? "บันทึกการแก้ไข" : "+ เพิ่มแรงค์"}
            </button>
            {editIndex !== null && (
              <button type="button" onClick={cancelEdit} style={{ background: "white", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "0.375rem", padding: "0.5rem 1.2rem", fontSize: "0.8rem", cursor: "pointer" }}>ยกเลิก</button>
            )}
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>การเพิ่ม / แก้ไข / ลบ จะมีผลจริงเมื่อกดบันทึก</span>
          <button type="button" onClick={handleSave} disabled={saving} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.7rem 2.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}