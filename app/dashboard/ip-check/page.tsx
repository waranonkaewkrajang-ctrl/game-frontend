"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface UserIP {
  id: number;
  username: string;
  phone: string;
  last_login_ip: string;
  last_login_at: string;
  status: string;
}

export default function IpCheckPage() {
  const [users, setUsers] = useState<UserIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchIPs = (searchQuery = search) => {
    setLoading(true);
    api.get("/admin/users/ip-check", { params: { search: searchQuery } })
      .then((res) => {
        setUsers(res.data.data.data || res.data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchIPs(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIPs(search);
  };

  const inputStyle = { padding: "0.5rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", color: "#334155", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ตรวจสอบ IP</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>ตรวจสอบ IP Address ล่าสุดที่ใช้เข้าสู่ระบบ (ป้องกันการสมัครซ้ำ)</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input style={{ ...inputStyle, width: "250px" }} placeholder="ค้นหา Username หรือ IP..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" style={{ background: "#10b981", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>ค้นหา</button>
        </form>
      </div>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
        {loading ? <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลดข้อมูล IP...</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["ID", "Username", "เบอร์โทร", "IP ล่าสุด", "เวลาที่เข้าใช้ล่าสุด", "สถานะบัญชี"].map(h => <th key={h} style={{ padding: "1rem", color: "#475569", fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem", color: "#64748b" }}>{u.id}</td>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#0f172a" }}>{u.username}</td>
                    <td style={{ padding: "1rem", color: "#475569" }}>{u.phone}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ background: "#f1f5f9", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", color: "#475569", fontFamily: "monospace", fontWeight: 600 }}>
                        {u.last_login_ip || "ยังไม่มีข้อมูล"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>{u.last_login_at ? new Date(u.last_login_at).toLocaleString("th-TH") : "-"}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ padding: "0.25rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: u.status === 'active' ? "#dcfce7" : "#fee2e2", color: u.status === 'active' ? "#166534" : "#991b1b" }}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )) : <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบข้อมูล</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}