"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Statement {
  id: number;
  deposit_id: number | null;
  user_id: number | null;
  amount: string;
  bank_code: string | null;
  from_name: string | null;
  reference_id: string | null;
  approved_method: "auto" | "manual";
  approved_by: number | null;
  transaction_time: string | null;
  created_at: string;
  user?: { id: number; username: string } | null;
  admin?: { id: number; username: string } | null;
}

interface Summary {
  today_count: number;
  today_sum: number;
  total_count: number;
}

export default function BankStatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [summary, setSummary] = useState<Summary>({ today_count: 0, today_sum: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "auto" | "manual">("all");

  const fetchStatements = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (methodFilter !== "all") params.set("method", methodFilter);
      params.set("per_page", "50");

      const [listRes, sumRes] = await Promise.all([
        api.get(`/admin/bank-statements?${params.toString()}`),
        api.get("/admin/bank-statements/summary"),
      ]);
      setStatements(listRes.data.data.data || []);
      setSummary(sumRes.data.data);
    } catch (e) {
      console.error("Fetch statements failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [search, methodFilter]);

  const formatDateTime = (dt: string | null) => {
    if (!dt) return "-";
    return new Date(dt).toLocaleString("th-TH", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
          รายการเดินบัญชี (Bank Statement)
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
          บันทึกทุกยอดที่เข้าบัญชีสำเร็จ · เก็บย้อนหลัง 30 วัน
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", marginBottom: "20px" }}>
        <SummaryCard title="วันนี้" value={`${summary.today_count} รายการ`} sub={`฿${summary.today_sum.toLocaleString()}`} color="#16a34a" />
        <SummaryCard title="ทั้งหมด" value={`${summary.total_count} รายการ`} sub="เก็บย้อนหลัง 30 วัน" color="#7c3aed" />
      </div>

      {/* Filters */}
      <div style={{ background: "white", padding: "14px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา (username, reference, ชื่อผู้โอน)"
          style={{ flex: 1, minWidth: "240px", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem" }}
        />
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as any)}
          style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", background: "white" }}
        >
          <option value="all">ทั้งหมด</option>
          <option value="auto">Auto เท่านั้น</option>
          <option value="manual">Manual เท่านั้น</option>
        </select>
        <button
          onClick={fetchStatements}
          style={{ padding: "9px 18px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
        >
          รีเฟรช
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <Th>เวลา</Th>
                <Th>ผู้โอน</Th>
                <Th>ยอดเงิน</Th>
                <Th>ธนาคาร</Th>
                <Th>ลูกค้า</Th>
                <Th>วิธี</Th>
                <Th>แอดมิน</Th>
                <Th>Reference</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>กำลังโหลด...</td></tr>
              ) : statements.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>ไม่มีข้อมูล</td></tr>
              ) : (
                statements.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <Td>
                      <div style={{ color: "#334155", fontWeight: 600 }}>{formatDateTime(s.created_at)}</div>
                    </Td>
                    <Td>{s.from_name || <span style={{ color: "#94a3b8" }}>-</span>}</Td>
                    <Td>
                      <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.95rem" }}>
                        +{Number(s.amount).toLocaleString()}
                      </span>
                    </Td>
                    <Td>
                      {s.bank_code && (
                        <img
                          src={`/logos/${s.bank_code}.webp`}
                          alt={s.bank_code}
                          style={{ width: "24px", height: "24px", objectFit: "contain", verticalAlign: "middle", marginRight: "6px" }}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                      {s.bank_code}
                    </Td>
                    <Td>
                      {s.user?.username ? (
                        <span style={{ color: "#0891b2", fontWeight: 600 }}>{s.user.username}</span>
                      ) : <span style={{ color: "#94a3b8" }}>-</span>}
                    </Td>
                    <Td>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: "12px",
                        background: s.approved_method === "auto" ? "#dcfce7" : "#fef3c7",
                        color: s.approved_method === "auto" ? "#16a34a" : "#d97706",
                      }}>
                        {s.approved_method === "auto" ? "Auto" : "Manual"}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                        {s.admin?.username || "-"}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ color: "#64748b", fontSize: "0.75rem", fontFamily: "monospace" }}>
                        {s.reference_id || "-"}
                      </span>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: "white", padding: "16px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>{sub}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: "12px 14px", color: "#334155" }}>
      {children}
    </td>
  );
}