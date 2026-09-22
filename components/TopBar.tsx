"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { RefreshCcw, UserCog, Wallet } from "lucide-react";

type Staff = { id: number; username: string; last_seen: string };
type TopbarData = { online_users: number; online_staff: number; staff: Staff[]; agent_credit: number | null };

const LOW_CREDIT = 10000; // ต่ำกว่านี้ขึ้นสีแดงเตือน

const timeAgo = (iso: string) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso.replace(" ", "T")).getTime()) / 1000));
  if (s < 60) return "เมื่อสักครู่";
  return `${Math.floor(s / 60)} นาทีที่แล้ว`;
};

export default function TopBar() {
  const [d, setD] = useState<TopbarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStaff, setShowStaff] = useState(false);

  const load = async (refresh = false) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/topbar", { params: refresh ? { refresh: 1 } : {} });
      setD(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 30000);
    return () => clearInterval(t);
  }, []);

  const credit = d?.agent_credit;
  const lowCredit = typeof credit === "number" && credit < LOW_CREDIT;

  return (
    <div className="admin-topbar">
      {/* ลูกค้าออนไลน์ */}
      <div className="tb-item" title="ลูกค้าที่ใช้งานใน 5 นาทีล่าสุด">
        <span className="tb-dot" />
        <span className="tb-label">ลูกค้าออนไลน์</span>
        <b>{d ? d.online_users.toLocaleString() : "–"}</b>
      </div>

      {/* พนักงานออนไลน์ */}
      <div className="tb-item tb-staff" onMouseEnter={() => setShowStaff(true)} onMouseLeave={() => setShowStaff(false)} onClick={() => setShowStaff((v) => !v)}>
        <UserCog size={16} color="#475569" />
        <span className="tb-label">พนักงาน</span>
        <b>{d ? d.online_staff : "–"}</b>

        {showStaff && d && (
          <div className="tb-dropdown">
            <div className="tb-dd-title">พนักงานออนไลน์ ({d.online_staff})</div>
            {d.staff.length === 0 ? (
              <div className="tb-dd-empty">ไม่มีพนักงานออนไลน์</div>
            ) : (
              d.staff.map((s) => (
                <div key={s.id} className="tb-dd-row">
                  <span className="tb-dot tb-dot-sm" />
                  <span className="tb-dd-name">{s.username}</span>
                  <span className="tb-dd-time">{timeAgo(s.last_seen)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="tb-divider" />

      {/* เครดิต agent */}
      <div className={`tb-credit ${lowCredit ? "tb-credit-low" : ""}`} title={lowCredit ? "เครดิตใกล้หมด กรุณาเติม" : "เครดิตคงเหลือที่ค่ายเกม"}>
        <Wallet size={15} />
        <span className="tb-label">เครดิต</span>
        <b>{typeof credit === "number" ? credit.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "–"}</b>
        <button onClick={() => load(true)} disabled={loading} aria-label="รีเฟรชเครดิต">
          <RefreshCcw size={14} className={loading ? "tb-spin" : ""} />
        </button>
      </div>

      <style>{`
        .admin-topbar { display:flex; align-items:center; justify-content:flex-end; gap:1.1rem; padding:0.6rem 1.25rem; background:rgba(255,255,255,0.92); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border-bottom:1px solid #e2e8f0; flex-wrap:wrap; position:sticky; top:0; z-index:35; }
        .tb-item { display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; color:#334155; position:relative; }
        .tb-item b { color:#0f172a; font-variant-numeric:tabular-nums; }
        .tb-staff { cursor:pointer; }
        .tb-dot { width:9px; height:9px; border-radius:50%; background:#22c55e; box-shadow:0 0 0 0 rgba(34,197,94,.6); animation:tbPulse 2s infinite; }
        .tb-dot-sm { width:7px; height:7px; animation:none; }
        .tb-divider { width:1px; height:22px; background:#e2e8f0; }
        .tb-credit { display:flex; align-items:center; gap:0.45rem; border:1px solid #e2e8f0; border-radius:8px; padding:0.35rem 0.7rem; font-size:0.85rem; color:#334155; }
        .tb-credit b { font-variant-numeric:tabular-nums; color:#0f172a; }
        .tb-credit button { background:none; border:none; cursor:pointer; color:#64748b; display:flex; padding:2px; }
        .tb-credit button:hover { color:#0f172a; }
        .tb-credit-low { border-color:#fecaca; background:#fef2f2; color:#b91c1c; }
        .tb-credit-low b { color:#b91c1c; }
        .tb-spin { animation:tbSpin .8s linear infinite; }
        .tb-dropdown { position:absolute; top:calc(100% + 8px); right:0; min-width:220px; background:white; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 10px 25px rgba(15,23,42,.12); padding:0.5rem; z-index:60; }
        .tb-dd-title { font-size:0.75rem; font-weight:700; color:#64748b; padding:0.25rem 0.5rem 0.4rem; }
        .tb-dd-empty { font-size:0.8rem; color:#94a3b8; padding:0.5rem; }
        .tb-dd-row { display:flex; align-items:center; gap:0.5rem; padding:0.4rem 0.5rem; border-radius:6px; font-size:0.82rem; }
        .tb-dd-row:hover { background:#f8fafc; }
        .tb-dd-name { flex:1; font-weight:600; color:#0f172a; }
        .tb-dd-time { font-size:0.72rem; color:#94a3b8; }
        @keyframes tbPulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
        @keyframes tbSpin { to { transform:rotate(360deg) } }
        @media (max-width:768px) {
          .admin-topbar { justify-content:space-between; gap:0.6rem; padding:0.5rem 0.75rem; top:65px; }
          .tb-label { display:none; }
          .tb-divider { display:none; }
        }
      `}</style>
    </div>
  );
}