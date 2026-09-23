"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";
import { Eye, Image as ImageIcon, MousePointerClick, Plus, RefreshCcw, Sparkles, Trash2, Upload } from "lucide-react";
import { Activity, AUDIENCES, emptyActivity, fromLocalInput, kb, PAGES, SLOTS, toLocalInput, TYPES, uploadImage } from "./helpers";

export default function ActivitiesPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Activity> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/activities");
      setItems(res.data.data || []);
    } catch { Swal.fire({ icon: "error", title: "โหลดข้อมูลไม่สำเร็จ" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: keyof Activity, v: any) => setForm((f) => ({ ...(f || {}), [k]: v }));

  const toggleIn = (k: "slots" | "pages", value: string) => {
    const cur: string[] = ((form?.[k] as string[]) || []).slice();
    const i = cur.indexOf(value);
    if (i >= 0) cur.splice(i, 1); else cur.push(value);
    set(k, cur);
  };

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { Swal.fire({ icon: "warning", title: "ไฟล์ใหญ่เกิน 5MB" }); return; }
    setUploading(true);
    try {
      const r = await uploadImage(file);
      set("image_url", r.url);
      Swal.fire({ icon: "success", title: "อัปโหลดสำเร็จ", text: `แปลงเป็น WebP แล้ว ${kb(r.size)}`, timer: 1800, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "อัปโหลดไม่สำเร็จ", text: err.response?.data?.message || "" });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    if (!form?.title?.trim()) { Swal.fire({ icon: "warning", title: "กรุณาใส่ชื่อกิจกรรม" }); return; }
    if (!form?.slots?.length) { Swal.fire({ icon: "warning", title: "เลือกตำแหน่งที่จะแสดงอย่างน้อย 1 จุด" }); return; }

    setSaving(true);
    const body = {
      ...form,
      start_at: fromLocalInput((form.start_at as string) || ""),
      end_at: fromLocalInput((form.end_at as string) || ""),
      pages: form.pages?.length ? form.pages : null,
    };
    try {
      if (form.id) await api.put(`/admin/activities/${form.id}`, body);
      else await api.post("/admin/activities", body);
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1400, showConfirmButton: false });
      setForm(null);
      load();
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: e.response?.data?.message || "" });
    }
    setSaving(false);
  };

  const toggle = async (a: Activity) => {
    await api.post(`/admin/activities/${a.id}/toggle`);
    load();
  };

  const remove = async (a: Activity) => {
    const r = await Swal.fire({
      title: "ลบกิจกรรมนี้?", text: a.title, icon: "warning",
      showCancelButton: true, confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก", confirmButtonColor: "#ef4444",
    });
    if (!r.isConfirmed) return;
    await api.delete(`/admin/activities/${a.id}`);
    Swal.fire({ icon: "success", title: "ลบแล้ว", timer: 1200, showConfirmButton: false });
    load();
  };

  const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" };
  const label: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.35rem" };
  const input: React.CSSProperties = { width: "100%", padding: "0.55rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "0.5rem", fontSize: "0.85rem", fontFamily: "inherit", boxSizing: "border-box" };
  const chip = (on: boolean): React.CSSProperties => ({
    padding: "0.5rem 0.7rem", borderRadius: "0.55rem", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
    border: on ? "2px solid #2563eb" : "1px solid #e2e8f0", background: on ? "#eff6ff" : "white",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={22} /> กิจกรรมหน้าเว็บ
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>สร้างกิจกรรมเอง เลือกได้ว่าจะไปโผล่หน้าไหน ตำแหน่งไหน</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "0.55rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "#475569" }}>
            <RefreshCcw size={15} /> รีเฟรช
          </button>
          <button onClick={() => setForm(emptyActivity())} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#0f172a", border: "none", color: "white", padding: "0.55rem 1.1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            <Plus size={16} /> สร้างกิจกรรม
          </button>
        </div>
      </div>

      {/* ── ฟอร์ม ── */}
      {form && (
        <div style={{ ...card, borderColor: "#bfdbfe", boxShadow: "0 8px 24px -12px rgba(37,99,235,.35)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem", color: "#0f172a" }}>
            {form.id ? `แก้ไข: ${form.title}` : "สร้างกิจกรรมใหม่"}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.1rem" }}>
            {/* ซ้าย */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <span style={label}>ประเภทกิจกรรม</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
                  {TYPES.map((t) => (
                    <button key={t.key} onClick={() => set("type", t.key)} style={chip(form.type === t.key)}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{t.icon} {t.label}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={label}>ชื่อกิจกรรม</span>
                <input style={input} value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="เช่น ทายบอลลุ้นเครดิต" />
              </div>

              <div>
                <span style={label}>คำอธิบายสั้น</span>
                <input style={input} value={form.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="เช่น ทายถูกรับ 100 เครดิต" />
              </div>

              <div>
                <span style={label}>กดแล้วไปที่ (ใส่เฉพาะประเภทภาพกดได้)</span>
                <input style={input} value={form.link_url || ""} onChange={(e) => set("link_url", e.target.value)} placeholder="/promotions หรือ https://lin.ee/xxxx" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <div>
                  <span style={label}>ป้ายมุมภาพ</span>
                  <input style={input} value={form.badge || ""} onChange={(e) => set("badge", e.target.value)} placeholder="ใหม่ / HOT" maxLength={20} />
                </div>
                <div>
                  <span style={label}>สีป้าย</span>
                  <input type="color" value={form.badge_color || "#ef4444"} onChange={(e) => set("badge_color", e.target.value)} style={{ ...input, padding: "0.15rem", height: "38px" }} />
                </div>
              </div>
            </div>

            {/* ขวา */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <span style={label}>ภาพกิจกรรม</span>
                <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", padding: "0.7rem", border: "1px dashed #cbd5e1", borderRadius: "0.6rem", background: "#f8fafc" }}>
                  <div style={{ width: 96, height: 96, borderRadius: "0.5rem", background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {form.image_url
                      ? <img src={form.image_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      : <ImageIcon size={26} color="#a5b4fc" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                      <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "#4f46e5", border: "none", color: "white", padding: "0.45rem 0.8rem", borderRadius: "0.45rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                        <Upload size={14} /> {uploading ? "กำลังอัปโหลด..." : "อัปโหลดภาพ"}
                      </button>
                      {form.image_url && (
                        <button onClick={() => set("image_url", null)} style={{ background: "white", border: "1px solid #fecaca", color: "#dc2626", padding: "0.45rem 0.8rem", borderRadius: "0.45rem", cursor: "pointer", fontSize: "0.78rem" }}>ลบภาพ</button>
                      )}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.45rem" }}>WebP / PNG / JPG / GIF / SVG · ไม่เกิน 5MB<br />ระบบแปลงเป็น WebP ให้อัตโนมัติ</div>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
              </div>

              <div>
                <span style={label}>แสดงที่ตำแหน่งไหน (เลือกได้หลายจุด)</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.45rem" }}>
                  {SLOTS.map((s) => (
                    <button key={s.key} onClick={() => toggleIn("slots", s.key)} style={chip((form.slots || []).includes(s.key))}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{s.label}</div>
                      <div style={{ fontSize: "0.66rem", color: "#64748b" }}>{s.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={label}>โผล่หน้าไหนบ้าง <span style={{ fontWeight: 400, color: "#94a3b8" }}>(ไม่เลือก = ทุกหน้า)</span></span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {PAGES.map((p) => {
                    const on = (form.pages || []).includes(p.key);
                    return (
                      <button key={p.key} onClick={() => toggleIn("pages", p.key)} style={{ padding: "0.35rem 0.75rem", borderRadius: "99px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit", border: on ? "1px solid #2563eb" : "1px solid #e2e8f0", background: on ? "#2563eb" : "white", color: on ? "white" : "#475569" }}>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <div>
                  <span style={label}>เริ่มแสดง</span>
                  <input type="datetime-local" style={input} value={toLocalInput((form.start_at as string) || null)} onChange={(e) => set("start_at", e.target.value)} />
                </div>
                <div>
                  <span style={label}>หยุดแสดง</span>
                  <input type="datetime-local" style={input} value={toLocalInput((form.end_at as string) || null)} onChange={(e) => set("end_at", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.7rem", alignItems: "end" }}>
                <div>
                  <span style={label}>ใครเห็นได้</span>
                  <select style={input} value={form.audience || "all"} onChange={(e) => set("audience", e.target.value)}>
                    {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#334155", paddingBottom: "0.55rem" }}>
                  <input type="checkbox" checked={!!form.show_once} onChange={(e) => set("show_once", e.target.checked)} /> แสดงครั้งเดียว
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
            <button onClick={save} disabled={saving} style={{ background: "#0f172a", border: "none", color: "white", padding: "0.6rem 1.4rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
              {saving ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
            </button>
            <button onClick={() => setForm(null)} style={{ background: "white", border: "1px solid #cbd5e1", color: "#475569", padding: "0.6rem 1.2rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.88rem" }}>ยกเลิก</button>
            <div style={{ flex: 1 }} />
            <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.85rem", fontWeight: 600, color: form.is_active ? "#16a34a" : "#64748b" }}>
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              {form.is_active ? "เปิดใช้งานทันทีหลังบันทึก" : "บันทึกแบบปิดไว้ก่อน"}
            </label>
          </div>
        </div>
      )}

      {/* ── รายการกิจกรรม ── */}
      {loading ? (
        <div style={{ ...card, textAlign: "center", color: "#64748b", padding: "2.5rem" }}>กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#64748b", padding: "2.5rem" }}>ยังไม่มีกิจกรรม — กดปุ่ม "สร้างกิจกรรม" ด้านบน</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {items.map((a) => {
            const type = TYPES.find((t) => t.key === a.type);
            return (
              <div key={a.id} style={{ ...card, padding: 0, overflow: "hidden", opacity: a.is_active ? 1 : 0.6 }}>
                <div style={{ position: "relative", height: 130, background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {a.image_url
                    ? <img src={a.image_url} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <ImageIcon size={30} color="#a5b4fc" />}
                  {a.badge && (
                    <span style={{ position: "absolute", top: 8, left: 8, background: a.badge_color || "#ef4444", color: "white", padding: "0.15rem 0.55rem", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700 }}>{a.badge}</span>
                  )}
                  <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(15,23,42,.75)", color: "white", padding: "0.15rem 0.55rem", borderRadius: "99px", fontSize: "0.7rem" }}>{type?.icon} {type?.label}</span>
                </div>

                <div style={{ padding: "0.9rem" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{a.title}</div>
                  {a.subtitle && <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.15rem" }}>{a.subtitle}</div>}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", margin: "0.6rem 0" }}>
                    {(a.slots || []).map((s) => (
                      <span key={s} style={{ fontSize: "0.68rem", background: "#f1f5f9", color: "#475569", padding: "0.15rem 0.5rem", borderRadius: "99px" }}>
                        {SLOTS.find((x) => x.key === s)?.label || s}
                      </span>
                    ))}
                    <span style={{ fontSize: "0.68rem", background: "#eff6ff", color: "#1d4ed8", padding: "0.15rem 0.5rem", borderRadius: "99px" }}>
                      {a.pages?.length ? `${a.pages.length} หน้า` : "ทุกหน้า"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.8rem", fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.7rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}><Eye size={12} /> {a.view_count}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}><MousePointerClick size={12} /> {a.click_count}</span>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => toggle(a)} style={{ flex: 1, padding: "0.4rem", borderRadius: "0.45rem", cursor: "pointer", fontSize: "0.76rem", fontWeight: 600, fontFamily: "inherit", border: "1px solid", background: a.is_active ? "#dcfce7" : "#f1f5f9", color: a.is_active ? "#166534" : "#64748b", borderColor: a.is_active ? "#bbf7d0" : "#e2e8f0" }}>
                      {a.is_active ? "เปิดอยู่" : "ปิดอยู่"}
                    </button>
                    <button onClick={() => setForm({ ...a, start_at: a.start_at, end_at: a.end_at })} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.45rem", cursor: "pointer", fontSize: "0.76rem", fontWeight: 600, fontFamily: "inherit", border: "1px solid #e2e8f0", background: "white", color: "#334155" }}>แก้ไข</button>
                    <button onClick={() => remove(a)} style={{ padding: "0.4rem 0.6rem", borderRadius: "0.45rem", cursor: "pointer", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}