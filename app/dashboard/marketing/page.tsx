"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Download, Users, TrendingUp, Clock, Phone } from "lucide-react";

interface MarketingUser {
  id: number;
  username: string;
  amb_username: string | null;
  phone: string;
  full_name: string | null;
  bank_name: string | null;
  bank_code: string | null;
  bank_account: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
  balance: number;
  total_deposit: number;
  total_withdraw: number;
  profit: number;
  days_inactive: number;
}

export default function MarketingPage() {
  const [users, setUsers] = useState<MarketingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minDaysInactive, setMinDaysInactive] = useState(0);
  const [minDeposit, setMinDeposit] = useState(0);
  const [sortBy, setSortBy] = useState("days_inactive");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const fetchUsers = () => {
    setLoading(true);
    api.get("/admin/marketing/users", {
      params: {
        search,
        min_days_inactive: minDaysInactive,
        min_deposit: minDeposit,
        sort_by: sortBy,
        sort_order: sortOrder,
        per_page: perPage,
        page: currentPage,
      }
    }).then((res) => {
      const data = res.data.data;
      setUsers(data.data || []);
      setTotalUsers(data.total || 0);
      setLastPage(data.last_page || 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [minDaysInactive, minDeposit, sortBy, sortOrder, perPage, currentPage]); // eslint-disable-line

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const query = new URLSearchParams({
        min_days_inactive: String(minDaysInactive),
        min_deposit: String(minDeposit),
      }).toString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/admin/marketing/export?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing_users_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export ไม่สำเร็จ");
    }
  };

  const fmt = (n: number) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const daysBadge = (d: number) => {
    if (d >= 9999) return { color: "#64748b", bg: "#f1f5f9", label: "ไม่เคยเข้า" };
    if (d >= 30) return { color: "#991b1b", bg: "#fee2e2", label: `${d} วัน` };
    if (d >= 7)  return { color: "#c2410c", bg: "#ffedd5", label: `${d} วัน` };
    if (d >= 3)  return { color: "#a16207", bg: "#fef3c7", label: `${d} วัน` };
    return { color: "#166534", bg: "#dcfce7", label: d === 0 ? "วันนี้" : `${d} วัน` };
  };

  const inputStyle = { padding: "0.5rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", background: "white" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>📢 การตลาด — Marketing View</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>วิเคราะห์ user เพื่อการติดต่อกลับ (ยอดฝาก / ถอน / หายไป)</p>
      </div>

      {/* Filter Bar */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={16} color="#64748b" />
          <input placeholder="ค้นหา username / เบอร์ / ชื่อ" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (setCurrentPage(1), fetchUsers())} style={{ ...inputStyle, width: "220px" }} />
        </div>

        <select value={minDaysInactive} onChange={(e) => { setMinDaysInactive(Number(e.target.value)); setCurrentPage(1); }} style={inputStyle}>
          <option value={0}>หายไปทุกช่วง</option>
          <option value={3}>หาย ≥ 3 วัน</option>
          <option value={7}>หาย ≥ 7 วัน</option>
          <option value={14}>หาย ≥ 14 วัน</option>
          <option value={30}>หาย ≥ 30 วัน</option>
        </select>

        <select value={minDeposit} onChange={(e) => { setMinDeposit(Number(e.target.value)); setCurrentPage(1); }} style={inputStyle}>
          <option value={0}>ยอดฝากทุกระดับ</option>
          <option value={100}>ฝาก ≥ ฿100</option>
          <option value={500}>ฝาก ≥ ฿500</option>
          <option value={1000}>ฝาก ≥ ฿1,000</option>
          <option value={5000}>ฝาก ≥ ฿5,000</option>
          <option value={10000}>ฝาก ≥ ฿10,000</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
          <option value="days_inactive">เรียงตาม: หายนานสุด</option>
          <option value="total_deposit">เรียงตาม: ฝากมากสุด</option>
          <option value="total_withdraw">เรียงตาม: ถอนมากสุด</option>
          <option value="profit">เรียงตาม: กำไรมากสุด</option>
          <option value="balance">เรียงตาม: ยอดคงเหลือ</option>
          <option value="last_login_at">เรียงตาม: เข้าล่าสุด</option>
          <option value="created_at">เรียงตาม: สมัครใหม่</option>
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")} style={inputStyle}>
          <option value="desc">มาก → น้อย</option>
          <option value="asc">น้อย → มาก</option>
        </select>

        <button onClick={() => { setCurrentPage(1); fetchUsers(); }} style={{ background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
          กรอง
        </button>

        <button onClick={handleExport} style={{ marginLeft: "auto", background: "#10b981", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Info */}
      <div style={{ fontSize: "0.875rem", color: "#475569" }}>
        พบ <strong style={{ color: "#0f172a" }}>{totalUsers.toLocaleString()}</strong> คน · แสดงหน้า {currentPage}/{lastPage}
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ ...inputStyle, marginLeft: "1rem" }}>
          <option value={20}>20/หน้า</option>
          <option value={50}>50/หน้า</option>
          <option value={100}>100/หน้า</option>
          <option value={500}>500/หน้า</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลด...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Username", "ชื่อ / ธนาคาร", "เบอร์โทร", "ยอดฝากรวม", "ยอดถอนรวม", "กำไร", "หายไป", "เข้าล่าสุด", "สถานะ"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((u) => {
                  const badge = daysBadge(u.days_inactive);
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.username}</div>
                        {u.amb_username && <div style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: 600, marginTop: "2px" }}>🆔 {u.amb_username}</div>}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                        <div>{u.full_name || u.bank_name || "-"}</div>
                        {u.bank_code && <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>{u.bank_code} {u.bank_account}</div>}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>{u.phone}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#10b981", fontWeight: 600 }}>฿{fmt(u.total_deposit)}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#f59e0b", fontWeight: 600 }}>฿{fmt(u.total_withdraw)}</td>
                      <td style={{ padding: "0.75rem 1rem", color: u.profit >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                        {u.profit >= 0 ? "+" : ""}฿{fmt(u.profit)}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.78rem" }}>
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "ยังไม่เคย"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700, background: u.status === "active" ? "#dcfce7" : "#fee2e2", color: u.status === "active" ? "#166534" : "#991b1b" }}>
                          {u.status === "active" ? "ใช้งาน" : "ระงับ"}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center" }}>
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ ...inputStyle, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}>◀ ก่อนหน้า</button>
          <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>หน้า {currentPage} / {lastPage}</span>
          <button onClick={() => setCurrentPage(Math.min(lastPage, currentPage + 1))} disabled={currentPage === lastPage} style={{ ...inputStyle, cursor: currentPage === lastPage ? "not-allowed" : "pointer", opacity: currentPage === lastPage ? 0.5 : 1 }}>ถัดไป ▶</button>
        </div>
      )}
    </div>
  );
}