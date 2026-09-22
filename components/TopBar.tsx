"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { ChevronDown, RefreshCcw, Search, UserCog, Wallet } from "lucide-react";

type Person = { id: number; username: string; last_seen: string };
type TopbarData = {
  online_users: number; users: Person[];
  online_staff: number; staff: Person[];
  agent_credit: number | null;
};

const LOW_CREDIT = 10000; // เครดิตต่ำกว่านี้ขึ้นสีแดงเตือน

// ── อวตาร์ "สุ่มแบบคงที่" — คนเดิมได้รูปเดิมเสมอ ──
const EMOJIS = ["🦊", "🐼", "🐯", "🦁", "🐸", "🐵", "🐨", "🐰", "🐻", "🐶", "🐱", "🦄", "🐙", "🐳", "🦉", "🐧", "🐲", "🦖", "🐝", "🦋", "🍀", "🔥", "⭐", "💎", "🎯", "🎲", "🚀", "🌈", "🍉", "🍩"];
const TINTS = ["#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3", "#ede9fe", "#ffedd5", "#e0f2fe", "#f1f5f9"];
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const emojiFor = (key: string) => EMOJIS[hash(key) % EMOJIS.length];
const tintFor = (key: string) => TINTS[hash(key + "t") % TINTS.length];
// รูปการ์ตูนจาก DiceBear — ส่งแค่ตัวเลข hash ไม่ส่งชื่อจริงออกไป
const avatarUrl = (key: string, style: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=nx${hash(key)}&radius=50`;

const timeAgo = (iso: string) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso.replace(" ", "T")).getTime()) / 1000));
  if (s < 60) return "เมื่อสักครู่";
  return `${Math.floor(s / 60)} นาทีที่แล้ว`;
};

type BoxProps = {
  icon: React.ReactNode;
  label: string;
  count: number | null;
  people: Person[];
  open: boolean;
  onToggle: () => void;
  keyPrefix: string;
  avatarStyle: string;
  linkBase?: string;
  totalHint?: number;
};

function OnlineBox({ icon, label, count, people, open, onToggle, keyPrefix, avatarStyle, linkBase, totalHint }: BoxProps) {
  const [q, setQ] = useState("");
  const list = q ? people.filter((p) => p.username.toLowerCase().includes(q.toLowerCase())) : people;

  return (
    <div className="tb-wrap">
      <button type="button" className={`tb-box ${open ? "tb-box-open" : ""}`} onClick={onToggle}>
        {icon}
        <span className="tb-label">{label}</span>
        <b>{count === null ? "–" : count.toLocaleString()}</b>
        <ChevronDown size={14} className={`tb-chev ${open ? "tb-chev-up" : ""}`} />
      </button>

      {open && (
        <div className="tb-dropdown">
          <div className="tb-dd-title">{label} ({count ?? 0})</div>

          {people.length > 8 && (
            <div className="tb-search">
              <Search size={13} color="#94a3b8" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ..." />
            </div>
          )}

          <div className="tb-dd-list">
            {list.length === 0 ? (
              <div className="tb-dd-empty">{q ? "ไม่พบชื่อนี้" : `ไม่มี${label}`}</div>
            ) : (
              list.map((p) => {
                const key = keyPrefix + p.id;
                const inner = (
                  <>
                    <span className="tb-avatar" style={{ background: tintFor(key) }}>
                      <img
                        src={avatarUrl(key, avatarStyle)}
                        alt=""
                        loading="lazy"
                        onError={(e) => { const s = e.currentTarget.parentElement; if (s) s.textContent = emojiFor(key); }}
                      />
                    </span>
                    <span className="tb-dd-name">{p.username}</span>
                    <span className="tb-dd-time">{timeAgo(p.last_seen)}</span>
                  </>
                );
                return linkBase ? (
                  <a key={p.id} href={`${linkBase}/${p.id}`} className="tb-dd-row tb-dd-link">{inner}</a>
                ) : (
                  <div key={p.id} className="tb-dd-row">{inner}</div>
                );
              })
            )}
          </div>

          {typeof totalHint === "number" && totalHint > people.length && (
            <div className="tb-dd-foot">แสดง {people.length} คนล่าสุด จากทั้งหมด {totalHint.toLocaleString()} คน</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TopBar() {
  const [d, setD] = useState<TopbarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [openBox, setOpenBox] = useState<"users" | "staff" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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

  // กดที่อื่น → ปิดกล่องรายชื่อ
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenBox(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggle = (id: "users" | "staff") => setOpenBox((v) => (v === id ? null : id));
  const credit = d?.agent_credit;
  const lowCredit = typeof credit === "number" && credit < LOW_CREDIT;

  return (
    <div className="admin-topbar" ref={rootRef}>
      <OnlineBox
        icon={<span className="tb-dot" />}
        label="ลูกค้าออนไลน์"
        count={d ? d.online_users : null}
        people={d?.users || []}
        open={openBox === "users"}
        onToggle={() => toggle("users")}
        keyPrefix="u"
        avatarStyle="fun-emoji"
        linkBase="/dashboard/users"
        totalHint={d?.online_users}
      />

      <OnlineBox
        icon={<UserCog size={15} color="#475569" />}
        label="พนักงาน"
        count={d ? d.online_staff : null}
        people={d?.staff || []}
        open={openBox === "staff"}
        onToggle={() => toggle("staff")}
        keyPrefix="a"
        avatarStyle="bottts"
      />

      <div className="tb-divider" />

      <div className={`tb-box tb-credit ${lowCredit ? "tb-credit-low" : ""}`} title={lowCredit ? "เครดิตใกล้หมด กรุณาเติม" : "เครดิตคงเหลือที่ค่ายเกม"}>
        <Wallet size={15} />
        <span className="tb-label">เครดิต</span>
        <b>{typeof credit === "number" ? credit.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "–"}</b>
        <button onClick={() => load(true)} disabled={loading} aria-label="รีเฟรชเครดิต" className="tb-refresh">
          <RefreshCcw size={14} className={loading ? "tb-spin" : ""} />
        </button>
      </div>

      <style>{`
        .admin-topbar { display:flex; align-items:center; justify-content:flex-end; gap:0.6rem; padding:0.55rem 1.25rem; background:rgba(255,255,255,0.92); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border-bottom:1px solid #e2e8f0; flex-wrap:wrap; position:sticky; top:0; z-index:35; }
        .tb-wrap { position:relative; }
        .tb-box { display:flex; align-items:center; gap:0.45rem; border:1px solid #e2e8f0; border-radius:8px; padding:0.38rem 0.7rem; font-size:0.85rem; color:#334155; background:white; cursor:pointer; transition:border-color .15s, box-shadow .15s; font-family:inherit; }
        .tb-box:hover { border-color:#cbd5e1; box-shadow:0 1px 3px rgba(15,23,42,.06); }
        .tb-box-open { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
        .tb-box b { color:#0f172a; font-variant-numeric:tabular-nums; }
        .tb-chev { color:#94a3b8; transition:transform .15s; }
        .tb-chev-up { transform:rotate(180deg); }
        .tb-dot { width:9px; height:9px; border-radius:50%; background:#22c55e; animation:tbPulse 2s infinite; flex-shrink:0; }
        .tb-divider { width:1px; height:22px; background:#e2e8f0; margin:0 0.2rem; }
        .tb-credit { cursor:default; }
        .tb-refresh { background:none; border:none; cursor:pointer; color:#64748b; display:flex; padding:2px; }
        .tb-refresh:hover { color:#0f172a; }
        .tb-credit-low { border-color:#fecaca; background:#fef2f2; color:#b91c1c; }
        .tb-credit-low b { color:#b91c1c; }
        .tb-spin { animation:tbSpin .8s linear infinite; }

        .tb-dropdown { position:absolute; top:calc(100% + 8px); right:0; width:260px; background:white; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 12px 28px rgba(15,23,42,.14); padding:0.5rem; z-index:60; animation:tbDrop .14s ease-out; }
        .tb-dd-title { font-size:0.75rem; font-weight:700; color:#64748b; padding:0.25rem 0.5rem 0.45rem; }
        .tb-search { display:flex; align-items:center; gap:0.4rem; border:1px solid #e2e8f0; border-radius:8px; padding:0.35rem 0.55rem; margin:0 0.25rem 0.4rem; }
        .tb-search input { border:none; outline:none; font-size:0.8rem; width:100%; background:transparent; font-family:inherit; }
        .tb-dd-list { max-height:320px; overflow-y:auto; }
        .tb-dd-empty { font-size:0.8rem; color:#94a3b8; padding:0.6rem 0.5rem; }
        .tb-dd-row { display:flex; align-items:center; gap:0.55rem; padding:0.4rem 0.5rem; border-radius:8px; font-size:0.82rem; text-decoration:none; }
        .tb-dd-link:hover { background:#f1f5f9; }
        .tb-avatar { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; overflow:hidden; box-shadow:0 0 0 2px white, 0 0 0 3px #e2e8f0; }
        .tb-avatar img { width:100%; height:100%; display:block; }
        .tb-dd-name { flex:1; font-weight:600; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .tb-dd-time { font-size:0.7rem; color:#94a3b8; white-space:nowrap; }
        .tb-dd-foot { font-size:0.7rem; color:#94a3b8; padding:0.45rem 0.5rem 0.15rem; border-top:1px solid #f1f5f9; margin-top:0.3rem; }

        @keyframes tbPulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
        @keyframes tbSpin { to { transform:rotate(360deg) } }
        @keyframes tbDrop { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }

        @media (max-width:768px) {
          .admin-topbar { justify-content:space-between; gap:0.4rem; padding:0.5rem 0.75rem; top:65px; }
          .tb-label { display:none; }
          .tb-divider { display:none; }
          .tb-dropdown { width:min(260px, calc(100vw - 24px)); }
          .tb-wrap:first-child .tb-dropdown { left:0; right:auto; }
        }
      `}</style>
    </div>
  );
}