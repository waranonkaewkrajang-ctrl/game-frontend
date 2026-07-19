"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface GameLog {
  id: number;
  user: { username: string };
  provider: string;
  game_name: string;
  round_id: string;
  action: string;
  bet_amount: string;
  win_amount: string;
  created_at: string;
}

export default function BetsPage() {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = (searchQuery = search) => {
    setLoading(true);
    api.get("/admin/game-logs", { params: { search: searchQuery } })
      .then((res) => {
        setLogs(res.data.data.data || res.data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(search);
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const inputStyle = { padding: "0.5rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", color: "#334155", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ประวัติเดิมพัน</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>ตรวจสอบประวัติการเล่นเกมของสมาชิกทั้งหมด</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input style={{ ...inputStyle, width: "250px" }} placeholder="ค้นหา Username, ชื่อเกม, Round ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" style={{ background: "#10b981", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>ค้นหา</button>
        </form>
      </div>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
        {loading ? <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลดประวัติเดิมพัน...</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["เวลา", "Username", "ค่ายเกม", "ชื่อเกม (Round ID)", "Action", "ยอดเดิมพัน", "ยอดชนะ"].map(h => <th key={h} style={{ padding: "1rem", color: "#475569", fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem", color: "#64748b" }}>{new Date(l.created_at).toLocaleString("th-TH")}</td>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#0f172a" }}>{l.user?.username || "-"}</td>
                    <td style={{ padding: "1rem", color: "#475569" }}>{l.provider}</td>
                    <td style={{ padding: "1rem", color: "#475569" }}>{l.game_name} <br/><span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{l.round_id}</span></td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, background: l.action === 'win' ? "#dcfce7" : "#f1f5f9", color: l.action === 'win' ? "#166534" : "#475569" }}>
                        {l.action.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "#ef4444", fontWeight: 600 }}>{parseFloat(l.bet_amount) > 0 ? `-฿${fmt(l.bet_amount)}` : "-"}</td>
                    <td style={{ padding: "1rem", color: "#10b981", fontWeight: 600 }}>{parseFloat(l.win_amount) > 0 ? `+฿${fmt(l.win_amount)}` : "-"}</td>
                  </tr>
                )) : <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบประวัติการเล่น</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}