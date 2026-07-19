"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface ProfitReport {
  total_bet: number;
  total_win: number;
  profit: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(true);

  // ตั้งค่า Default วันที่เริ่มต้นเป็น 1 เดือนที่แล้ว และสิ้นสุดคือวันนี้
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // เรียก API โดยส่ง from และ to ไปด้วย
      const res = await api.get("/admin/reports/profit", {
        params: { from: startDate, to: endDate }
      });
      setReport(res.data.data || res.data);
    } catch (error) {
      console.error("ดึงข้อมูลรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n: number) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });

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
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>สรุปผลประกอบการ</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>รายงานกำไร-ขาดทุนจากประวัติการเล่นทั้งหมด</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "#475569" }}>ตั้งแต่:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: "0.875rem", color: "#475569", marginLeft: "0.25rem" }}>ถึง:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          <button 
            onClick={fetchReport}
            style={{
              background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem",
              padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", marginLeft: "0.5rem"
            }}
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
         <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลดข้อมูลรายงาน...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.5rem", borderTop: "3px solid #6366f1" }}>
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>ยอดเดิมพันสะสมรวม</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#6366f1", margin: 0 }}>
              ฿{fmt(report?.total_bet ?? 0)}
            </p>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.5rem", borderTop: "3px solid #ec4899" }}>
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>ยอดจ่ายรางวัลสะสม</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#ec4899", margin: 0 }}>
              ฿{fmt(report?.total_win ?? 0)}
            </p>
          </div>

          <div style={{ 
            background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.5rem", 
            borderTop: `3px solid ${(report?.profit ?? 0) >= 0 ? "#10b981" : "#ef4444"}` 
          }}>
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>กำไรสุทธิ (Win/Loss)</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: (report?.profit ?? 0) >= 0 ? "#10b981" : "#ef4444", margin: 0 }}>
              {(report?.profit ?? 0) >= 0 ? "+" : ""}฿{fmt(report?.profit ?? 0)}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}