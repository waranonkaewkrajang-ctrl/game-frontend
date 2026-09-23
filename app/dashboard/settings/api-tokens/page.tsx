"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";
import { Copy, KeyRound, Plus, RefreshCcw, ScrollText, Trash2 } from "lucide-react";

type Token = {
  id: number; name: string; token_prefix: string; allowed_ips: string | null;
  is_active: boolean; calls_count: number;
  last_used_at: string | null; last_used_ip: string | null; created_at: string | null;
};
type Log = {
  id: number; token_name: string | null; endpoint: string; ip: string | null;
  query_value: string | null; status_code: number; note: string | null; created_at: string | null;
};

const ENDPOINT_URL = "https://admintg289.sbs/api/member-info";

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text);
    Swal.fire({ icon: "success", title: `คัดลอก${what}แล้ว`, timer: 1200, showConfirmButton: false });
  } catch {
    Swal.fire({ icon: "info", title: what, text, confirmButtonColor: "#0f172a" });
  }
};

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [t, l] = await Promise.all([api.get("/admin/api-tokens"), api.get("/admin/api-tokens/logs/all")]);
      setTokens(t.data.data || []);
      setLogs(l.data.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "โหลดข้อมูลไม่สำเร็จ" });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createToken = async () => {
    const { value: v } = await Swal.fire({
      title: "สร้าง Token ใหม่",
      html: `
        <div style="text-align:left">
          <label style="font-size:13px;font-weight:600;color:#334155;display:block;margin-bottom:4px">ชื่อกำกับ</label>
          <input id="t-name" class="swal2-input" style="margin:0 0 12px;width:100%;box-sizing:border-box" placeholder="เช่น ระบบ LINE Chat">
          <label style="font-size:13px;font-weight:600;color:#334155;display:block;margin-bottom:4px">IP ที่อนุญาต</label>
          <input id="t-ips" class="swal2-input" style="margin:0;width:100%;box-sizing:border-box" placeholder="31.97.51.22" value="31.97.51.22">
          <div style="font-size:11px;color:#94a3b8;margin-top:6px">หลาย IP คั่นด้วยเครื่องหมาย , — เว้นว่าง = อนุญาตทุก IP (ไม่แนะนำ)</div>
        </div>`,
      width: 460,
      showCancelButton: true,
      confirmButtonText: "สร้าง Token",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#0f172a",
      preConfirm: () => {
        const name = (document.getElementById("t-name") as HTMLInputElement).value.trim();
        if (!name) { Swal.showValidationMessage("กรุณาใส่ชื่อกำกับ"); return false; }
        return { name, allowed_ips: (document.getElementById("t-ips") as HTMLInputElement).value.trim() || null };
      },
    });
    if (!v) return;

    try {
      const res = await api.post("/admin/api-tokens", v);
      const plain = res.data.data.token as string;
      await Swal.fire({
        icon: "success",
        title: "สร้างสำเร็จ",
        html: `
          <p style="font-size:13px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px;margin:0 0 12px">
            คัดลอกเก็บไว้ทันที — ระบบจะไม่แสดง Token นี้อีก
          </p>
          <code style="display:block;word-break:break-all;background:#0f172a;color:#4ade80;padding:12px;border-radius:8px;font-size:12px;text-align:left">${plain}</code>`,
        width: 520,
        confirmButtonText: "คัดลอก Token",
        confirmButtonColor: "#0f172a",
      }).then((r) => { if (r.isConfirmed) copy(plain, "Token"); });
      load();
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "สร้างไม่สำเร็จ", text: e.response?.data?.message || "" });
    }
  };

  const editIps = async (t: Token) => {
    const { value: ips } = await Swal.fire({
      title: "แก้ไข IP ที่อนุญาต",
      input: "text",
      inputValue: t.allowed_ips || "",
      inputPlaceholder: "31.97.51.22, 1.2.3.4",
      html: `<div style="font-size:12px;color:#64748b">Token: <b>${t.name}</b></div>`,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#0f172a",
    });
    if (ips === undefined) return;
    await api.put(`/admin/api-tokens/${t.id}`, { allowed_ips: ips || null });
    Swal.fire({ icon: "success", title: "บันทึกแล้ว", timer: 1200, showConfirmButton: false });
    load();
  };

  const toggle = async (t: Token) => {
    await api.put(`/admin/api-tokens/${t.id}`, { is_active: !t.is_active });
    load();
  };

  const remove = async (t: Token) => {
    const r = await Swal.fire({
      title: "เพิกถอน Token นี้?",
      text: `${t.name} — ระบบที่ใช้ Token นี้จะเรียก API ไม่ได้ทันที`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "เพิกถอน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!r.isConfirmed) return;
    await api.delete(`/admin/api-tokens/${t.id}`);
    Swal.fire({ icon: "success", title: "เพิกถอนแล้ว", timer: 1200, showConfirmButton: false });
    load();
  };

  const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" };
  const th: React.CSSProperties = { padding: "0.7rem 0.9rem", textAlign: "left", color: "#475569", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "0.7rem 0.9rem", fontSize: "0.83rem", color: "#334155", whiteSpace: "nowrap" };
  const statusColor = (c: number) => (c === 200 ? "#16a34a" : c === 404 ? "#d97706" : "#dc2626");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <KeyRound size={22} /> API Token
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            สำหรับให้ระบบภายนอก (เช่น ระบบแชท LINE) ดึงข้อมูลสมาชิก
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "0.55rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, color: "#475569" }}>
            <RefreshCcw size={15} /> รีเฟรช
          </button>
          <button onClick={createToken} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#0f172a", border: "none", color: "white", padding: "0.55rem 1.1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            <Plus size={16} /> สร้าง Token
          </button>
        </div>
      </div>

      {/* ข้อมูลสำหรับฝั่งที่เรียกใช้ */}
      <div style={{ ...card, background: "#f8fafc" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>ข้อมูลสำหรับตั้งค่าฝั่งระบบ LINE</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <code style={{ background: "#0f172a", color: "#93c5fd", padding: "0.5rem 0.8rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}>POST {ENDPOINT_URL}</code>
          <button onClick={() => copy(ENDPOINT_URL, "URL")} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "white", border: "1px solid #cbd5e1", padding: "0.4rem 0.7rem", borderRadius: "0.45rem", cursor: "pointer", fontSize: "0.78rem", color: "#334155" }}>
            <Copy size={13} /> คัดลอก URL
          </button>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>body: {`{"username":"เบอร์โทร","token":"TOKEN"}`}</span>
        </div>
      </div>

      {/* รายการ Token */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>กำลังโหลด...</div>
        ) : tokens.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>ยังไม่มี Token — กดปุ่ม "สร้าง Token" ด้านบน</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["ชื่อ", "Token", "IP ที่อนุญาต", "เรียกแล้ว", "ใช้ล่าสุด", "สถานะ", "จัดการ"].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ ...td, fontWeight: 600, color: "#0f172a" }}>{t.name}</td>
                    <td style={td}><code style={{ background: "#f1f5f9", padding: "0.2rem 0.45rem", borderRadius: "0.35rem", fontSize: "0.78rem" }}>{t.token_prefix}••••••</code></td>
                    <td style={td}>
                      <button onClick={() => editIps(t)} style={{ background: "none", border: "none", color: t.allowed_ips ? "#334155" : "#dc2626", cursor: "pointer", fontSize: "0.83rem", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>
                        {t.allowed_ips || "ทุก IP (ไม่ปลอดภัย)"}
                      </button>
                    </td>
                    <td style={td}>{t.calls_count.toLocaleString()} ครั้ง</td>
                    <td style={{ ...td, color: "#64748b", fontSize: "0.78rem" }}>
                      {t.last_used_at ? <>{t.last_used_at}<div style={{ color: "#94a3b8" }}>{t.last_used_ip}</div></> : "ยังไม่เคยใช้"}
                    </td>
                    <td style={td}>
                      <button onClick={() => toggle(t)} style={{ padding: "0.2rem 0.65rem", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", border: "1px solid", background: t.is_active ? "#dcfce7" : "#f1f5f9", color: t.is_active ? "#166534" : "#64748b", borderColor: t.is_active ? "#bbf7d0" : "#e2e8f0" }}>
                        {t.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                      </button>
                    </td>
                    <td style={td}>
                      <button onClick={() => remove(t)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.7rem", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500 }}>
                        <Trash2 size={13} /> เพิกถอน
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ประวัติการเรียก */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <button onClick={() => setShowLogs((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
            <ScrollText size={18} /> ประวัติการเรียก API ({logs.length})
          </span>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{showLogs ? "ซ่อน" : "แสดง"}</span>
        </button>

        {showLogs && (
          <div style={{ maxHeight: "420px", overflow: "auto", borderTop: "1px solid #f1f5f9" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0 }}>
                  {["เวลา", "Token", "ค้นหา", "IP", "ผล", "หมายเหตุ"].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8", padding: "2rem" }}>ยังไม่มีการเรียก</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ ...td, color: "#64748b", fontSize: "0.78rem" }}>{l.created_at}</td>
                    <td style={td}>{l.token_name || "-"}</td>
                    <td style={td}>{l.query_value || "-"}</td>
                    <td style={{ ...td, color: "#64748b" }}>{l.ip || "-"}</td>
                    <td style={{ ...td, fontWeight: 700, color: statusColor(l.status_code) }}>{l.status_code}</td>
                    <td style={{ ...td, color: "#64748b" }}>{l.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}