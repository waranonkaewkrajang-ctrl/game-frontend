"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Transaction {
  id: number;
  reference_id: string;
  user: { username: string };
  type: string;
  direction: string;
  amount: string;
  balance_before: string;
  balance_after: string;
  description: string;
  created_at: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchTransactions = (searchQuery = search, typeQuery = typeFilter) => {
    setLoading(true);
    api.get("/admin/transactions", { 
      params: { search: searchQuery, type: typeQuery } 
    }).then((res) => {
      setTransactions(res.data.data.data || res.data.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTransactions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(search, typeFilter);
  };

  const fmt = (n: string | number) => Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#334155",
    outline: "none",
  };

  // ตัวช่วยแปลงชื่อและสีประเภทธุรกรรม
  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string, color: string, bg: string }> = {
      deposit: { label: "ฝากเงิน", color: "#166534", bg: "#dcfce7" },
      withdraw: { label: "ถอนเงิน", color: "#991b1b", bg: "#fee2e2" },
      bet: { label: "เดิมพัน", color: "#854d0e", bg: "#fef08a" },
      win: { label: "ชนะเดิมพัน", color: "#1d4ed8", bg: "#dbeafe" },
      bonus: { label: "โบนัส", color: "#6b21a8", bg: "#f3e8ff" },
      adjustment: { label: "ปรับยอด", color: "#475569", bg: "#f1f5f9" },
    };
    const t = types[type] || { label: type, color: "#475569", bg: "#f1f5f9" };
    
    return (
      <span style={{
        padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem",
        fontWeight: 600, color: t.color, background: t.bg
      }}>
        {t.label}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header & Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ประวัติธุรกรรม</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>ตรวจสอบการเคลื่อนไหวของเงินทั้งหมดในระบบ</p>
        </div>
        
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)} 
            style={{ ...inputStyle, width: "150px" }}
          >
            <option value="">ทุกประเภท</option>
            <option value="deposit">ฝากเงิน</option>
            <option value="withdraw">ถอนเงิน</option>
            <option value="bet">เดิมพัน</option>
            <option value="win">ชนะเดิมพัน</option>
            <option value="bonus">โบนัส</option>
            <option value="adjustment">ปรับยอด</option>
          </select>

          <input 
            style={{ ...inputStyle, width: "220px" }} 
            placeholder="ค้นหา Username, Ref ID..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <button 
            type="submit" 
            style={{
              background: "#10b981", color: "white", border: "none", borderRadius: "0.375rem",
              padding: "0 1.25rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer"
            }}
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Table Section */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748b", fontSize: "0.875rem" }}>กำลังโหลดข้อมูลธุรกรรม...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["เวลา", "Ref ID", "Username", "ประเภท", "จำนวนเงิน", "ก่อนหน้า", "คงเหลือ", "หมายเหตุ"].map((h) => (
                    <th key={h} style={{ padding: "1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem", color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(t.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" })}
                    </td>
                    <td style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.75rem" }}>{t.reference_id}</td>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#0f172a" }}>{t.user?.username || "-"}</td>
                    <td style={{ padding: "1rem" }}>{getTypeBadge(t.type)}</td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: t.direction === 'in' ? "#10b981" : "#ef4444" }}>
                      {t.direction === 'in' ? "+" : "-"}฿{fmt(t.amount)}
                    </td>
                    <td style={{ padding: "1rem", color: "#64748b" }}>฿{fmt(t.balance_before)}</td>
                    <td style={{ padding: "1rem", color: "#0f172a", fontWeight: 600 }}>฿{fmt(t.balance_after)}</td>
                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>{t.description || "-"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบประวัติธุรกรรม</td>
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