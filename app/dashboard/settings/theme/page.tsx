"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

type Theme = {
  primary: string; primary_light: string; accent: string; accent_dark: string;
  success: string; danger: string; bg: string; surface: string; text: string; text_muted: string;
  radius: number; btn_depth: number; glow: number;
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

export default function ThemeSettingsPage() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [defaults, setDefaults] = useState<Theme | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/theme").then((res) => {
      setTheme(res.data.data);
      setDefaults(res.data.defaults);
    }).catch(() => Swal.fire({ icon: "error", title: "โหลดธีมไม่สำเร็จ" }));
  }, []);

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
        </div>

        {/* ── ฝั่งตัวอย่าง ── */}
        <div style={{ ...card, position: "sticky", top: "1rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.75rem", color: "#0f172a" }}>ตัวอย่างหน้าเว็บ</h3>

          <div style={{ background: theme.bg, borderRadius: "0.75rem", padding: "1.25rem", color: theme.text }}>
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