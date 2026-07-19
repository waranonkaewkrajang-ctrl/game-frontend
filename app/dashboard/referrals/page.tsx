"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface ReferralData {
  id: number;
  username: string;
  referral_code: string;
  referred_count: number;
  created_at: string;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReferrals = (searchQuery = search) => {
    setLoading(true);
    api.get("/admin/referrals", { params: { search: searchQuery } })
      .then((res) => {
        setReferrals(res.data.data.data || res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReferrals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReferrals(search);
  };

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#334155",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header & Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ระบบแนะนำเพื่อน (Affiliate)</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>ตรวจสอบสถิติการชวนเพื่อนของสมาชิกแต่ละคน</p>
        </div>
        
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input 
            style={{ ...inputStyle, width: "250px" }} 
            placeholder="ค้นหา Username หรือ โค้ดแนะนำ..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <button 
            type="submit" 
            style={{
              background: "#10b981", // ปุ่มสีเขียวอ่อนตามที่ต้องการ
              color: "white", 
              border: "none", 
              borderRadius: "0.375rem",
              padding: "0.5rem 1.25rem", 
              fontSize: "0.875rem", 
              fontWeight: 600, 
              cursor: "pointer",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.2s"
            }}
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Table Section */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748b", fontSize: "0.875rem" }}>กำลังโหลดข้อมูลการแนะนำเพื่อน...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "1rem", color: "#475569", fontWeight: 600 }}>ID</th>
                  <th style={{ padding: "1rem", color: "#475569", fontWeight: 600 }}>Username (ผู้แนะนำ)</th>
                  <th style={{ padding: "1rem", color: "#475569", fontWeight: 600 }}>โค้ดแนะนำ</th>
                  <th style={{ padding: "1rem", color: "#475569", fontWeight: 600 }}>จำนวนเพื่อนที่สมัคร (คน)</th>
                  <th style={{ padding: "1rem", color: "#475569", fontWeight: 600 }}>วันที่สมัคร</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length > 0 ? referrals.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1rem", color: "#64748b" }}>{r.id}</td>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#0f172a" }}>{r.username}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ background: "#f1f5f9", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", color: "#475569", fontWeight: 500, fontFamily: "monospace" }}>
                        {r.referral_code || "-"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ 
                        display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700,
                        backgroundColor: r.referred_count > 0 ? "#dcfce7" : "#f1f5f9",
                        color: r.referred_count > 0 ? "#166534" : "#64748b",
                      }}>
                        {r.referred_count} คน
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(r.created_at).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบข้อมูลผู้แนะนำ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}