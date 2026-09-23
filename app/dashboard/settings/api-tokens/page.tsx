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
    Swal.fire({ icon: "success", title: `เธเธฑเธ”เธฅเธญเธ${what}เนเธฅเนเธง`, timer: 1200, showConfirmButton: false });
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
      Swal.fire({ icon: "error", title: "เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเนเธกเนเธชเธณเน€เธฃเนเธ" });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createToken = async () => {
    const { value: v } = await Swal.fire({
      title: "เธชเธฃเนเธฒเธ Token เนเธซเธกเน",
      html: `
        <div style="text-align:left">
          <label style="font-size:13px;font-weight:600;color:#334155;display:block;margin-bottom:4px">เธเธทเนเธญเธเธณเธเธฑเธ</label>
          <input id="t-name" class="swal2-input" style="margin:0 0 12px;width:100%;box-sizing:border-box" placeholder="เน€เธเนเธ เธฃเธฐเธเธ LINE Chat">
          <label style="font-size:13px;font-weight:600;color:#334155;display:block;margin-bottom:4px">IP เธ—เธตเนเธญเธเธธเธเธฒเธ•</label>
          <input id="t-ips" class="swal2-input" style="margin:0;width:100%;box-sizing:border-box" placeholder="31.97.51.22" value="31.97.51.22">
          <div style="font-size:11px;color:#94a3b8;margin-top:6px">เธซเธฅเธฒเธข IP เธเธฑเนเธเธ”เนเธงเธขเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธข , โ€” เน€เธงเนเธเธงเนเธฒเธ = เธญเธเธธเธเธฒเธ•เธ—เธธเธ IP (เนเธกเนเนเธเธฐเธเธณ)</div>
        </div>`,
      width: 460,
      showCancelButton: true,
      confirmButtonText: "เธชเธฃเนเธฒเธ Token",
      cancelButtonText: "เธขเธเน€เธฅเธดเธ",
      confirmButtonColor: "#0f172a",
      preConfirm: () => {
        const name = (document.getElementById("t-name") as HTMLInputElement).value.trim();
        if (!name) { Swal.showValidationMessage("เธเธฃเธธเธ“เธฒเนเธชเนเธเธทเนเธญเธเธณเธเธฑเธ"); return false; }
        return { name, allowed_ips: (document.getElementById("t-ips") as HTMLInputElement).value.trim() || null };
      },
    });
    if (!v) return;

    try {
      const res = await api.post("/admin/api-tokens", v);
      const plain = res.data.data.token as string;
      await Swal.fire({
        icon: "success",
        title: "เธชเธฃเนเธฒเธเธชเธณเน€เธฃเนเธ",
        html: `
          <p style="font-size:13px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px;margin:0 0 12px">
            เธเธฑเธ”เธฅเธญเธเน€เธเนเธเนเธงเนเธ—เธฑเธเธ—เธต โ€” เธฃเธฐเธเธเธเธฐเนเธกเนเนเธชเธ”เธ Token เธเธตเนเธญเธตเธ
          </p>
          <code style="display:block;word-break:break-all;background:#0f172a;color:#4ade80;padding:12px;border-radius:8px;font-size:12px;text-align:left">${plain}</code>`,
        width: 520,
        confirmButtonText: "เธเธฑเธ”เธฅเธญเธ Token",
        confirmButtonColor: "#0f172a",
      }).then((r) => { if (r.isConfirmed) copy(plain, "Token"); });
      load();
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "เธชเธฃเนเธฒเธเนเธกเนเธชเธณเน€เธฃเนเธ", text: e.response?.data?.message || "" });
    }
  };

  const editIps = async (t: Token) => {
    const { value: ips } = await Swal.fire({
      title: "เนเธเนเนเธ IP เธ—เธตเนเธญเธเธธเธเธฒเธ•",
      input: "text",
      inputValue: t.allowed_ips || "",
      inputPlaceholder: "31.97.51.22, 1.2.3.4",
      html: `<div style="font-size:12px;color:#64748b">Token: <b>${t.name}</b></div>`,
      showCancelButton: true,
      confirmButtonText: "เธเธฑเธเธ—เธถเธ",
      cancelButtonText: "เธขเธเน€เธฅเธดเธ",
      confirmButtonColor: "#0f172a",
    });
    if (ips === undefined) return;
    await api.put(`/admin/api-tokens/${t.id}`, { allowed_ips: ips || null });
    Swal.fire({ icon: "success", title: "เธเธฑเธเธ—เธถเธเนเธฅเนเธง", timer: 1200, showConfirmButton: false });
    load();
  };

  const toggle = async (t: Token) => {
    await api.put(`/admin/api-tokens/${t.id}`, { is_active: !t.is_active });
    load();
  };

  const remove = async (t: Token) => {
    const r = await Swal.fire({
      title: "เน€เธเธดเธเธ–เธญเธ Token เธเธตเน?",
      text: `${t.name} โ€” เธฃเธฐเธเธเธ—เธตเนเนเธเน Token เธเธตเนเธเธฐเน€เธฃเธตเธขเธ API เนเธกเนเนเธ”เนเธ—เธฑเธเธ—เธต`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "เน€เธเธดเธเธ–เธญเธ",
      cancelButtonText: "เธขเธเน€เธฅเธดเธ",
      confirmButtonColor: "#ef4444",
    });
    if (!r.isConfirmed) return;
    await api.delete(`/admin/api-tokens/${t.id}`);
    Swal.fire({ icon: "success", title: "เน€เธเธดเธเธ–เธญเธเนเธฅเนเธง", timer: 1200, showConfirmButton: false });
    load();
  };

  const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" };
  const th: React.CSSProperties = { padding: "0.75rem 0.9rem", textAlign: "left", color: "#ffffff", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap", letterSpacing: "0.01em" };
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
            เธชเธณเธซเธฃเธฑเธเนเธซเนเธฃเธฐเธเธเธ เธฒเธขเธเธญเธ (เน€เธเนเธ เธฃเธฐเธเธเนเธเธ— LINE) เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธกเธฒเธเธดเธ
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "0.55rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, color: "#475569" }}>
            <RefreshCcw size={15} /> เธฃเธตเน€เธเธฃเธ
          </button>
          <button onClick={createToken} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "linear-gradient(180deg, #22c55e, #16a34a)", border: "none", color: "white", padding: "0.55rem 1.1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 3px 0 #15803d, 0 6px 14px rgba(22,163,74,.35)" }}>
            <Plus size={16} /> เธชเธฃเนเธฒเธ Token
          </button>
        </div>
      </div>

      {/* เธเนเธญเธกเธนเธฅเธชเธณเธซเธฃเธฑเธเธเธฑเนเธเธ—เธตเนเน€เธฃเธตเธขเธเนเธเน */}
      <div style={{ ...card, background: "#f8fafc" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>เธเนเธญเธกเธนเธฅเธชเธณเธซเธฃเธฑเธเธ•เธฑเนเธเธเนเธฒเธเธฑเนเธเธฃเธฐเธเธ LINE</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <code style={{ background: "#0f172a", color: "#93c5fd", padding: "0.5rem 0.8rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}>POST {ENDPOINT_URL}</code>
          <button onClick={() => copy(ENDPOINT_URL, "URL")} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "white", border: "1px solid #cbd5e1", padding: "0.4rem 0.7rem", borderRadius: "0.45rem", cursor: "pointer", fontSize: "0.78rem", color: "#334155" }}>
            <Copy size={13} /> เธเธฑเธ”เธฅเธญเธ URL
          </button>
          <code style={{ background: "#0f172a", color: "#fbbf24", padding: "0.5rem 0.8rem", borderRadius: "0.5rem", fontSize: "0.78rem" }}>body: {`{"username":"เน€เธเธญเธฃเนเนเธ—เธฃ","token":"TOKEN"}`}</code>
        </div>
      </div>

      {/* เธฃเธฒเธขเธเธฒเธฃ Token */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>เธเธณเธฅเธฑเธเนเธซเธฅเธ”...</div>
        ) : tokens.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>เธขเธฑเธเนเธกเนเธกเธต Token โ€” เธเธ”เธเธธเนเธก "เธชเธฃเนเธฒเธ Token" เธ”เนเธฒเธเธเธ</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "linear-gradient(180deg, #2563eb, #1d4ed8)", borderBottom: "2px solid #1e40af" }}>
                  {["เธเธทเนเธญ", "Token", "IP เธ—เธตเนเธญเธเธธเธเธฒเธ•", "เน€เธฃเธตเธขเธเนเธฅเนเธง", "เนเธเนเธฅเนเธฒเธชเธธเธ”", "เธชเธ–เธฒเธเธฐ", "เธเธฑเธ”เธเธฒเธฃ"].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ ...td, fontWeight: 600, color: "#0f172a" }}>{t.name}</td>
                    <td style={td}><code style={{ background: "#f1f5f9", padding: "0.2rem 0.45rem", borderRadius: "0.35rem", fontSize: "0.78rem" }}>{t.token_prefix}โ€ขโ€ขโ€ขโ€ขโ€ขโ€ข</code></td>
                    <td style={td}>
                      <button onClick={() => editIps(t)} style={{ background: "none", border: "none", color: t.allowed_ips ? "#334155" : "#dc2626", cursor: "pointer", fontSize: "0.83rem", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>
                        {t.allowed_ips || "เธ—เธธเธ IP (เนเธกเนเธเธฅเธญเธ”เธ เธฑเธข)"}
                      </button>
                    </td>
                    <td style={td}>{t.calls_count.toLocaleString()} เธเธฃเธฑเนเธ</td>
                    <td style={{ ...td, color: "#64748b", fontSize: "0.78rem" }}>
                      {t.last_used_at ? <>{t.last_used_at}<div style={{ color: "#94a3b8" }}>{t.last_used_ip}</div></> : "เธขเธฑเธเนเธกเนเน€เธเธขเนเธเน"}
                    </td>
                    <td style={td}>
                      <button onClick={() => toggle(t)} style={{ padding: "0.2rem 0.65rem", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", border: "1px solid", background: t.is_active ? "#dcfce7" : "#f1f5f9", color: t.is_active ? "#166534" : "#64748b", borderColor: t.is_active ? "#bbf7d0" : "#e2e8f0" }}>
                        {t.is_active ? "เนเธเนเธเธฒเธเธญเธขเธนเน" : "เธเธดเธ”เนเธเนเธเธฒเธ"}
                      </button>
                    </td>
                    <td style={td}>
                      <button onClick={() => remove(t)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.7rem", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500 }}>
                        <Trash2 size={13} /> เน€เธเธดเธเธ–เธญเธ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเน€เธฃเธตเธขเธ */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <button onClick={() => setShowLogs((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
            <ScrollText size={18} /> เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเน€เธฃเธตเธขเธ API ({logs.length})
          </span>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{showLogs ? "เธเนเธญเธ" : "เนเธชเธ”เธ"}</span>
        </button>

        {showLogs && (
          <div style={{ maxHeight: "420px", overflow: "auto", borderTop: "1px solid #f1f5f9" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "linear-gradient(180deg, #2563eb, #1d4ed8)", borderBottom: "2px solid #1e40af", position: "sticky", top: 0 }}>
                  {["เน€เธงเธฅเธฒ", "Token", "เธเนเธเธซเธฒ", "IP", "เธเธฅ", "เธซเธกเธฒเธขเน€เธซเธ•เธธ"].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#94a3b8", padding: "2rem" }}>เธขเธฑเธเนเธกเนเธกเธตเธเธฒเธฃเน€เธฃเธตเธขเธ</td></tr>
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
