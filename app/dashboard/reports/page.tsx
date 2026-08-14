"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface DailyRow {
  date: string;
  date_label: string;
  total_deposit: number;
  total_withdraw: number;
  deposit_count: number;
  withdraw_count: number;
  total_bet: number;
  total_win: number;
  new_users: number;
  net_cash: number;
  game_profit: number;
}

interface ProfitReport {
  total_deposit: number;
  total_withdraw: number;
  total_bet: number;
  total_win: number;
  total_bonus: number;
  profit: number;
  daily?: DailyRow[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Default: วันนี้ตามเวลาไทย (Bangkok)
  const bangkokToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

  const [startDate, setStartDate] = useState(bangkokToday());
  const [endDate, setEndDate] = useState(bangkokToday());
  const [showDays, setShowDays] = useState(10);

  const fetchReport = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports/profit", {
        params: { from: from ?? startDate, to: to ?? endDate },
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

  // เปลี่ยนจำนวนวันย้อนหลัง
  const handleChangeDays = (days: number) => {
    setShowDays(days);
    const f = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const s = f(start);
    const e = f(end);
    setStartDate(s);
    setEndDate(e);
    fetchReport(s, e);
  };

  const fmt = (n: number) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#334155",
    outline: "none",
  };

  const depositMinusWithdraw = (report?.total_deposit ?? 0) - (report?.total_withdraw ?? 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header & Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>สรุปผลประกอบการ</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>รายงานกำไร-ขาดทุนจากประวัติการเล่นทั้งหมด</p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.875rem", color: "#475569" }}>ตั้งแต่:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: "0.875rem", color: "#475569", marginLeft: "0.25rem" }}>ถึง:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          <button
            onClick={() => fetchReport()}
            style={{
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              marginLeft: "0.5rem",
            }}
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Dropdown จำนวนวัน + Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#475569" }}>
          <span>แสดง</span>
          <select
            value={showDays}
            onChange={(e) => handleChangeDays(Number(e.target.value))}
            style={{
              padding: "0.375rem 0.75rem",
              border: "1px solid #cbd5e1",
              borderRadius: "0.375rem",
              background: "white",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
            <option value={180}>180</option>
            <option value={365}>365</option>
          </select>
          <span>วันย้อนหลัง</span>
        </div>
        <div style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>
          ทั้งหมด <span style={{ color: "#0f172a" }}>{report?.daily?.length ?? 0}</span> วัน
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลดข้อมูลรายงาน...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.5rem", borderTop: "3px solid #10b981" }}>
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>ยอดฝากรวม</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981", margin: 0 }}>฿{fmt(report?.total_deposit ?? 0)}</p>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.5rem", borderTop: "3px solid #f59e0b" }}>
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>ยอดถอนรวม</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b", margin: 0 }}>฿{fmt(report?.total_withdraw ?? 0)}</p>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              borderTop: `3px solid ${depositMinusWithdraw >= 0 ? "#10b981" : "#ef4444"}`,
            }}
          >
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>กำไรฝาก-ถอน</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: depositMinusWithdraw >= 0 ? "#10b981" : "#ef4444", margin: 0 }}>
              {depositMinusWithdraw >= 0 ? "+" : ""}฿{fmt(depositMinusWithdraw)}
            </p>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.5rem", borderTop: "3px solid #6366f1" }}>
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>ยอดเดิมพันสะสมรวม</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#6366f1", margin: 0 }}>฿{fmt(report?.total_bet ?? 0)}</p>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.5rem", borderTop: "3px solid #ec4899" }}>
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>ยอดจ่ายรางวัลสะสม</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#ec4899", margin: 0 }}>฿{fmt(report?.total_win ?? 0)}</p>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              borderTop: `3px solid ${(report?.profit ?? 0) >= 0 ? "#10b981" : "#ef4444"}`,
            }}
          >
            <h3 style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>กำไรเกม (Win/Loss)</h3>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: (report?.profit ?? 0) >= 0 ? "#10b981" : "#ef4444", margin: 0 }}>
              {(report?.profit ?? 0) >= 0 ? "+" : ""}฿{fmt(report?.profit ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* ตารางแยกรายวัน */}
      {!loading && report?.daily && report.daily.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>สรุปแยกรายวัน</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.2rem 0 0" }}>เวลาไทย (Asia/Bangkok) · เรียงวันล่าสุดก่อน</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse", textAlign: "right" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.7rem 1rem", textAlign: "left", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>วันที่</th>
                  <th style={{ padding: "0.7rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>สมาชิกใหม่</th>
                  <th style={{ padding: "0.7rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>ยอดฝาก</th>
                  <th style={{ padding: "0.7rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>ยอดถอน</th>
                  <th style={{ padding: "0.7rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>ฝาก-ถอน</th>
                  <th style={{ padding: "0.7rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>ยอดเดิมพัน</th>
                  <th style={{ padding: "0.7rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>จ่ายรางวัล</th>
                  <th style={{ padding: "0.7rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>กำไรเกม</th>
                </tr>
              </thead>
              <tbody>
                {report.daily.map((r) => (
                  <tr key={r.date} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.7rem 1rem", textAlign: "left", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{r.date_label}</td>
                    <td style={{ padding: "0.7rem 1rem", color: "#3b82f6", fontWeight: 600 }}>{r.new_users}</td>
                    <td style={{ padding: "0.7rem 1rem", color: "#10b981", fontWeight: 600 }}>
                      ฿{fmt(r.total_deposit)}
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 400 }}>{r.deposit_count} บิล</span>
                    </td>
                    <td style={{ padding: "0.7rem 1rem", color: "#f59e0b", fontWeight: 600 }}>
                      ฿{fmt(r.total_withdraw)}
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 400 }}>{r.withdraw_count} บิล</span>
                    </td>
                    <td style={{ padding: "0.7rem 1rem", fontWeight: 700, color: r.net_cash >= 0 ? "#10b981" : "#ef4444" }}>
                      {r.net_cash >= 0 ? "+" : ""}฿{fmt(r.net_cash)}
                    </td>
                    <td style={{ padding: "0.7rem 1rem", color: "#6366f1" }}>฿{fmt(r.total_bet)}</td>
                    <td style={{ padding: "0.7rem 1rem", color: "#ec4899" }}>฿{fmt(r.total_win)}</td>
                    <td style={{ padding: "0.7rem 1rem", fontWeight: 700, color: r.game_profit >= 0 ? "#10b981" : "#ef4444" }}>
                      {r.game_profit >= 0 ? "+" : ""}฿{fmt(r.game_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0", fontWeight: 700 }}>
                  <td style={{ padding: "0.8rem 1rem", textAlign: "left", color: "#0f172a" }}>รวมทั้งหมด</td>
                  <td style={{ padding: "0.8rem 1rem", color: "#3b82f6" }}>{report.daily.reduce((s, r) => s + r.new_users, 0)}</td>
                  <td style={{ padding: "0.8rem 1rem", color: "#10b981" }}>฿{fmt(report.daily.reduce((s, r) => s + r.total_deposit, 0))}</td>
                  <td style={{ padding: "0.8rem 1rem", color: "#f59e0b" }}>฿{fmt(report.daily.reduce((s, r) => s + r.total_withdraw, 0))}</td>
                  <td style={{ padding: "0.8rem 1rem", color: depositMinusWithdraw >= 0 ? "#10b981" : "#ef4444" }}>
                    {depositMinusWithdraw >= 0 ? "+" : ""}฿{fmt(depositMinusWithdraw)}
                  </td>
                  <td style={{ padding: "0.8rem 1rem", color: "#6366f1" }}>฿{fmt(report.total_bet ?? 0)}</td>
                  <td style={{ padding: "0.8rem 1rem", color: "#ec4899" }}>฿{fmt(report.total_win ?? 0)}</td>
                  <td style={{ padding: "0.8rem 1rem", color: (report.profit ?? 0) >= 0 ? "#10b981" : "#ef4444" }}>
                    {(report.profit ?? 0) >= 0 ? "+" : ""}฿{fmt(report.profit ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}