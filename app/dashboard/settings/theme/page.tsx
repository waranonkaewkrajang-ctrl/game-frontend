"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

type Theme = {
  primary: string; primary_light: string; accent: string; accent_dark: string;
  success: string; danger: string; bg: string; surface: string; text: string; text_muted: string;
  radius: number; btn_depth: number; glow: number;
  font: string; font_scale: number;
  wheel_slice_mode: string; wheel_slice_a: string; wheel_slice_b: string;
  wheel_ring: string; wheel_ring_border: string; wheel_glow: string;
  wheel_dot_a: string; wheel_dot_b: string; wheel_inner_ring: string;
  wheel_center: string; wheel_center_border: string; wheel_text: string;
  wheel_center_text: string;
};

const COLOR_FIELDS: { key: keyof Theme; label: string; hint: string }[] = [
  { key: "primary",       label: "สีหลัก",          hint: "แถบเมนู หัวข้อ ขอบการ์ด" },
  { key: "primary_light", label: "สีหลัก (อ่อน)",   hint: "ไล่สีคู่กับสีหลัก" },
  { key: "accent",        label: "สีปุ่มหลัก",       hint: "ปุ่มฝาก เล่นเกม รับโบนัส" },
  { key: "accent_dark",   label: "สีปุ่มหลัก (เข้ม)", hint: "ปลายไล่สีของปุ่ม" },
  { key: "success",       label: "สีสำเร็จ",         hint: "ปุ่มเขียว ยอดเงินเข้า" },
  { key: "danger",        label: "สีเตือน",          hint: "ปุ่มแดง ยอดถอน" },
  { key: "bg",            label: "สีพื้นหลัง",        hint: "หลังรูปพื้นหลัง" },
  { key: "surface",       label: "สีการ์ด",          hint: "กล่องเนื้อหา" },
  { key: "text",          label: "สีตัวอักษร",       hint: "ข้อความหลัก" },
  { key: "text_muted",    label: "สีตัวอักษรรอง",    hint: "คำอธิบาย ข้อความจาง" },
];

const PRESETS: { name: string; values: Partial<Theme> }[] = [
  { name: "เขียวมรกต", values: { primary: "#059669", primary_light: "#34d399", accent: "#22c55e", accent_dark: "#15803d" } },
  { name: "แดงเพลิง",  values: { primary: "#b91c1c", primary_light: "#f87171", accent: "#f97316", accent_dark: "#c2410c" } },
  { name: "ฟ้าไซเบอร์", values: { primary: "#1d4ed8", primary_light: "#38bdf8", accent: "#06b6d4", accent_dark: "#0e7490" } },
  { name: "ชมพูนีออน", values: { primary: "#be185d", primary_light: "#f472b6", accent: "#ec4899", accent_dark: "#9d174d" } },
];

const rgba = (hex: string, a: number) => {
  const h = (hex || "#000000").replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
};

const darker = (hex: string) => {
  const map: Record<string, string> = { "#7c3aed": "#6d28d9", "#5b21b6": "#4c1d95", "#4c1d95": "#2e1065" };
  const k = (hex || "").toLowerCase();
  if (map[k]) return map[k];
  const h = k.replace("#", "");
  if (!/^[0-9a-f]{6}$/.test(h)) return hex || "#000000";
  const f = (i: number) => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.72);
  return `rgb(${f(0)},${f(2)},${f(4)})`;
};

const readableText = (hex: string) => {
  const h = (hex || "#000000").replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1a2e" : "#ffffff";
};

const WHEEL_COLORS: { key: keyof Theme; label: string; prizeOnly?: boolean }[] = [
  { key: "wheel_slice_a",       label: "ช่องสี A",       prizeOnly: true },
  { key: "wheel_slice_b",       label: "ช่องสี B",       prizeOnly: true },
  { key: "wheel_ring",          label: "วงนอก" },
  { key: "wheel_ring_border",   label: "ขอบวงนอก" },
  { key: "wheel_glow",          label: "แสงเรือง" },
  { key: "wheel_inner_ring",    label: "วงแหวนใน" },
  { key: "wheel_dot_a",         label: "หมุดไฟ A" },
  { key: "wheel_dot_b",         label: "หมุดไฟ B" },
  { key: "wheel_center",        label: "วงกลางกลาง" },
  { key: "wheel_center_border", label: "ขอบวงกลาง" },
  { key: "wheel_text",          label: "ตัวอักษรในช่อง" },
];

export default function ThemeSettingsPage() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [defaults, setDefaults] = useState<Theme | null>(null);
  const [saving, setSaving] = useState(false);
  const [fonts, setFonts] = useState<string[]>([]);
  const [wheelPrizes, setWheelPrizes] = useState<{ label: string; color: string }[]>([]);

  useEffect(() => {
        api.get("/admin/theme").then((res) => {
      setTheme({ ...res.data.defaults, ...res.data.data });
      setDefaults(res.data.defaults);
      setFonts(res.data.fonts || []);
    }).catch(() => Swal.fire({ icon: "error", title: "โหลดธีมไม่สำเร็จ" }));

    api.get("/admin/spin-wheel/prizes").then((res) => {
      const raw = res.data?.data ?? res.data;
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      setWheelPrizes(
        list
          .filter((p: any) => p.is_active === undefined || p.is_active === true || p.is_active === 1)
          .map((p: any) => ({ label: String(p.label || ""), color: String(p.color || "#7c3aed") }))
      );
    }).catch(() => {});
  }, []);

  // โหลดทุกฟอนต์มาไว้แสดงตัวอย่างในหน้านี้
  useEffect(() => {
    const list = fonts.filter((f) => f !== "Inter");
    if (list.length === 0) return;
    const id = "admin-theme-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?" +
      list.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`).join("&") + "&display=swap";
    document.head.appendChild(link);
  }, [fonts]);

  if (!theme || !defaults) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>กำลังโหลด...</div>;
  }

  const set = (key: keyof Theme, value: string | number) => setTheme({ ...theme, [key]: value });

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/theme", theme);
      Swal.fire({ icon: "success", title: "บันทึกธีมสำเร็จ", text: "หน้าเว็บลูกค้าเปลี่ยนภายใน 5 นาที (หรือรีเฟรช)", timer: 2200, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: e.response?.data?.message || "ตรวจสอบค่าสี" });
    }
    setSaving(false);
  };

  const resetDefault = async () => {
    const r = await Swal.fire({ title: "คืนค่าธีมเดิม?", text: "สีทั้งหมดจะกลับเป็นค่าเริ่มต้น (ยังไม่บันทึกจนกว่าจะกดบันทึก)", icon: "question", showCancelButton: true, confirmButtonText: "คืนค่า", cancelButtonText: "ยกเลิก" });
    if (r.isConfirmed) setTheme({ ...defaults });
  };

  // ── สไตล์ปุ่มตัวอย่าง (เหมือนหน้าเว็บลูกค้า) ──
  const shine = theme.btn_depth > 0 ? 0.35 : 0;
  const btn = (from: string, to: string, color: string, glowHex: string): React.CSSProperties => ({
    background: `linear-gradient(135deg, ${from}, ${to})`,
    color, border: "none", borderRadius: theme.radius,
    padding: "0.65rem 1.4rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
    boxShadow: `inset 0 1px 0 rgba(255,255,255,${shine}), 0 ${theme.btn_depth}px 0 rgba(0,0,0,0.35), 0 4px 20px ${rgba(glowHex, theme.glow / 100)}`,
    transition: "transform 0.1s",
  });

  const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" };
  const label: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#334155" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <style>{`.pv-btn:active { transform: translateY(${Math.round(theme.btn_depth * 0.6)}px); }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ธีมหน้าเว็บลูกค้า</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>ปรับสี ปุ่ม และมิติ — ดูตัวอย่างด้านขวาก่อนบันทึก</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={resetDefault} style={{ background: "white", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "0.5rem", padding: "0.55rem 1rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>คืนค่าเดิม</button>
          <button onClick={save} disabled={saving} style={{ background: "#0f172a", border: "none", color: "white", borderRadius: "0.5rem", padding: "0.55rem 1.25rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "กำลังบันทึก..." : "บันทึกธีม"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: "1.25rem", alignItems: "start" }}>

        {/* ── ฝั่งตั้งค่า ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* ธีมสำเร็จรูป */}
          <div style={card}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.75rem", color: "#0f172a" }}>ธีมสำเร็จรูป</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button onClick={() => setTheme({ ...theme, ...{ primary: defaults.primary, primary_light: defaults.primary_light, accent: defaults.accent, accent_dark: defaults.accent_dark } })}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: `linear-gradient(135deg, ${defaults.primary}, ${defaults.accent})` }} />
                ม่วงทอง (ค่าเดิม)
              </button>
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => setTheme({ ...theme, ...p.values })}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: `linear-gradient(135deg, ${p.values.primary}, ${p.values.accent})` }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* สี */}
          <div style={card}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.85rem", color: "#0f172a" }}>สี</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.75rem" }}>
              {COLOR_FIELDS.map((f) => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem", border: "1px solid #f1f5f9", borderRadius: "0.5rem" }}>
                  <input type="color" value={theme[f.key] as string} onChange={(e) => set(f.key, e.target.value)}
                    style={{ width: 38, height: 38, border: "none", padding: 0, background: "none", cursor: "pointer", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={label}>{f.label}</div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{f.hint}</div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontFamily: "monospace" }}>{theme[f.key]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ปุ่ม */}
          <div style={card}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.85rem", color: "#0f172a" }}>สไตล์ปุ่ม</h3>
            {[
              { key: "radius" as const,    label: "ความโค้งมุม",         min: 0, max: 32, unit: "px", hint: "0 = เหลี่ยม, 32 = กลมมน" },
              { key: "btn_depth" as const, label: "ความนูน 3D",          min: 0, max: 12, unit: "px", hint: "0 = แบน, 5-8 = นูนกำลังดี" },
              { key: "glow" as const,      label: "แสงเรือง (ตอนชี้เมาส์)", min: 0, max: 100, unit: "%", hint: "ความสว่างของแสงรอบปุ่ม" },
            ].map((s) => (
              <div key={s.key} style={{ marginBottom: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={label}>{s.label}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2563eb" }}>{theme[s.key]}{s.unit}</span>
                </div>
                <input type="range" min={s.min} max={s.max} value={theme[s.key] as number}
                  onChange={(e) => set(s.key, Number(e.target.value))} style={{ width: "100%" }} />
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{s.hint}</div>
              </div>
            ))}
          </div>

          {/* ฟอนต์ */}
          <div style={card}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.85rem", color: "#0f172a" }}>ตัวอักษร</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.5rem", marginBottom: "1rem" }}>
              {fonts.map((f) => {
                const active = theme.font === f;
                return (
                  <button key={f} onClick={() => set("font", f)} style={{
                    padding: "0.6rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", textAlign: "left",
                    border: active ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: active ? "#eff6ff" : "white",
                  }}>
                    <div style={{ fontFamily: `'${f}', sans-serif`, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>สล็อต 168</div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "0.15rem" }}>
                      {f}{f === "Inter" ? " (ค่าเดิม)" : ""}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span style={label}>ขนาดตัวอักษรทั้งเว็บ</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2563eb" }}>{theme.font_scale}%</span>
            </div>
            <input type="range" min={85} max={125} value={theme.font_scale}
              onChange={(e) => set("font_scale", Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>100% = ขนาดปกติ · มือถือจอเล็กแนะนำ 95-100%</div>
          </div>

          {/* วงล้อ */}
          <div style={card}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.85rem", color: "#0f172a" }}>วงล้อ</h3>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", background: "#0a0a1a", borderRadius: "0.75rem", padding: "1rem" }}>
              <WheelPreview t={theme} prizes={wheelPrizes} />
            </div>

            {/* โหมดสีช่อง */}
            <div style={{ ...label, marginBottom: "0.4rem" }}>สีของช่องรางวัล</div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              {[
                { v: "theme", t: "สลับ 2 สี", d: "ใช้ช่องสี A / B ด้านล่าง" },
                { v: "prize", t: "สีรายช่อง", d: "ใช้สีที่ตั้งในหน้ารางวัลวงล้อ" },
              ].map((m) => {
                const active = theme.wheel_slice_mode === m.v;
                return (
                  <button key={m.v} onClick={() => set("wheel_slice_mode", m.v)} style={{
                    flex: 1, padding: "0.6rem", borderRadius: "0.5rem", cursor: "pointer", textAlign: "left",
                    border: active ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: active ? "#eff6ff" : "white",
                  }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{m.t}</div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{m.d}</div>
                  </button>
                );
              })}
            </div>

            {/* สีส่วนต่างๆ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem", marginBottom: "1rem" }}>
              {WHEEL_COLORS.map((f) => {
                const disabled = f.prizeOnly && theme.wheel_slice_mode === "prize";
                return (
                  <label key={f.key} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem",
                    border: "1px solid #f1f5f9", borderRadius: "0.5rem",
                    opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer",
                  }}>
                    <input type="color" disabled={disabled} value={theme[f.key] as string}
                      onChange={(e) => set(f.key, e.target.value)}
                      style={{ width: 30, height: 30, border: "none", padding: 0, background: "none", cursor: "inherit", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>{f.label}</span>
                  </label>
                );
              })}
            </div>

            {/* ข้อความกลาง */}
            <div style={{ ...label, marginBottom: "0.3rem" }}>ข้อความกลางวงล้อ</div>
            <input value={theme.wheel_center_text} maxLength={8}
              onChange={(e) => set("wheel_center_text", e.target.value)}
              placeholder="SPIN"
              style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.85rem" }} />
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" }}>สูงสุด 8 ตัวอักษร เช่น SPIN, หมุน, GO</div>
          </div>
        </div>

        {/* ── ฝั่งตัวอย่าง ── */}
        <div style={{ ...card, position: "sticky", top: "1rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.75rem", color: "#0f172a" }}>ตัวอย่างหน้าเว็บ</h3>

          <div style={{ background: theme.bg, borderRadius: "0.75rem", padding: "1.25rem", color: theme.text, fontFamily: `'${theme.font}', 'Kanit', sans-serif`, fontSize: `${theme.font_scale}%` }}>
            {/* แถบบน */}
            <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary_light})`, borderRadius: theme.radius, padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 800, color: "white" }}>SNAKE168</span>
              <span style={{ fontSize: "0.8rem", color: "white", opacity: 0.9 }}>฿1,250.00</span>
            </div>

            {/* การ์ด */}
            <div style={{ background: theme.surface, borderRadius: theme.radius, padding: "1rem", border: `1px solid ${rgba(theme.primary, 0.35)}`, marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>โปรโมชันพิเศษ</div>
              <div style={{ fontSize: "0.78rem", color: theme.text_muted, marginBottom: "0.85rem" }}>ฝากครั้งแรกรับโบนัส 50%</div>
              <button className="pv-btn" style={btn(theme.accent, theme.accent_dark, "#1a1a2e", theme.accent)}>รับโบนัส</button>
            </div>

            {/* ปุ่มรวม */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button className="pv-btn" style={btn(theme.success, "#059669", "white", theme.success)}>ฝากเงิน</button>
              <button className="pv-btn" style={btn(theme.danger, "#b91c1c", "white", theme.danger)}>ถอนเงิน</button>
              <button className="pv-btn" style={{ ...btn("rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)", theme.text, "#000000"), border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" }}>ประวัติ</button>
            </div>
          </div>

          <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "0.75rem 0 0" }}>
            กดปุ่มตัวอย่างเพื่อลองแรงยุบ · หน้าเว็บจริงแสดงแสงเรืองตอนเอาเมาส์ชี้
          </p>
        </div>
      </div>
    </div>
  );
}


// ── วงล้อตัวอย่าง (วาดแบบเดียวกับหน้าเว็บลูกค้า) ──
function WheelPreview({ t, prizes }: { t: Theme; prizes: { label: string; color: string }[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const list = prizes.length > 0
      ? prizes
      : Array.from({ length: 8 }, (_, i) => ({ label: `รางวัล ${i + 1}`, color: "#7c3aed" }));

    const size = canvas.width, cx = size / 2, cy = size / 2;
    const outerR = size / 2 - 8, wheelR = outerR - 26;
    const slice = (2 * Math.PI) / list.length;
    const prizeMode = t.wheel_slice_mode === "prize";

    ctx.clearRect(0, 0, size, size);

    // แสงเรือง
    const g = ctx.createRadialGradient(cx, cy, outerR - 8, cx, cy, outerR + 8);
    g.addColorStop(0, rgba(t.wheel_glow, 0.35));
    g.addColorStop(1, rgba(t.wheel_glow, 0));
    ctx.beginPath(); ctx.arc(cx, cy, outerR + 8, 0, 2 * Math.PI); ctx.fillStyle = g; ctx.fill();

    // วงนอก
    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
    ctx.fillStyle = t.wheel_ring; ctx.fill();
    ctx.strokeStyle = t.wheel_ring_border; ctx.lineWidth = 3; ctx.stroke();

    // หมุดไฟ
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 2 * Math.PI;
      const x = cx + Math.cos(a) * (outerR - 10), y = cy + Math.sin(a) * (outerR - 10);
      const c = i % 2 === 0 ? t.wheel_dot_a : t.wheel_dot_b;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.fillStyle = rgba(c, 0.35); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fillStyle = c; ctx.fill();
    }

    // วงแหวนใน
    ctx.beginPath(); ctx.arc(cx, cy, wheelR + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = t.wheel_inner_ring; ctx.lineWidth = 3;
    ctx.shadowColor = rgba(t.wheel_inner_ring, 0.6); ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;

    // ช่องรางวัล
    list.forEach((p, i) => {
      const s = i * slice - Math.PI / 2, e = s + slice;
      const base = prizeMode && p.color ? p.color : (i % 2 === 0 ? t.wheel_slice_a : t.wheel_slice_b);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, wheelR, s, e); ctx.closePath();
      const sg = ctx.createRadialGradient(cx, cy, size * 0.06, cx, cy, wheelR);
      sg.addColorStop(0, darker(base)); sg.addColorStop(1, base);
      ctx.fillStyle = sg; ctx.fill();
      ctx.strokeStyle = rgba(t.wheel_glow, 0.4); ctx.lineWidth = 1.2; ctx.stroke();

      ctx.save(); ctx.translate(cx, cy); ctx.rotate(s + slice / 2);
      ctx.fillStyle = prizeMode ? readableText(base) : t.wheel_text;
      ctx.font = `bold ${size * 0.038}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(p.label.length > 10 ? p.label.slice(0, 9) + "…" : p.label, wheelR * 0.6, 0);
      ctx.restore();
    });

    // วงกลางกลาง
    const cr = size * 0.13;
    const cg = ctx.createRadialGradient(cx, cy - cr * 0.3, 0, cx, cy, cr);
    cg.addColorStop(0, t.wheel_ring_border); cg.addColorStop(0.7, t.wheel_center); cg.addColorStop(1, darker(t.wheel_center));
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 2 * Math.PI); ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = t.wheel_center_border; ctx.lineWidth = 3; ctx.stroke();

    ctx.fillStyle = "#f5f3ff";
    ctx.font = `bold ${size * 0.06}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(t.wheel_center_text || "SPIN", cx, cy);
  }, [t, prizes]);

  return <canvas ref={ref} width={280} height={280} style={{ width: 280, height: 280, maxWidth: "100%" }} />;
}