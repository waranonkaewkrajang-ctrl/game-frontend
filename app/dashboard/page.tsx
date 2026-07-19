"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { 
  Users, 
  UserPlus,
  Activity,
  Star,
  Receipt,
  CreditCard,
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Wallet, 
  CircleDollarSign, 
  Gamepad2, 
  Trophy,
  AlertCircle,
  Calendar
} from "lucide-react";

interface DashboardData {
  today: { 
    new_users: number; 
    total_deposit: number; 
    total_withdraw: number; 
    total_bet: number; 
    total_win: number;
    // สิ่งที่ต้องส่งเพิ่มมาจาก Backend
    deposit_count: number; 
    withdraw_count: number; 
    first_deposit_count: number; 
  };
  this_month: { new_users: number; total_deposit: number; total_withdraw: number; total_bet: number; total_win: number };
  overall: { total_users: number; active_users: number; total_balance: number };
  pending: { deposits: number; withdrawals: number };
  chart_data: { name: string; deposit: number; withdraw: number; bet: number; win: number }[]; 
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchDashboardData = () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (startDate) params.append("from", startDate);
    if (endDate) params.append("to", endDate);

    api
      .get(`/admin/dashboard?${params.toString()}`)
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b", fontSize: "1rem", fontWeight: 500 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "20px", height: "20px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          กำลังโหลดข้อมูลบอร์ด...
        </div>
      </div>
    );
    
  if (!data)
    return <p style={{ color: "#dc2626", padding: "2rem", background: "#fee2e2", borderRadius: "0.5rem", margin: "1rem" }}>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>;

  // แยก format เป็น 2 แบบ: จำนวนเงิน (มีทศนิยม) และ จำนวนนับ (ไม่มีทศนิยม)
  const fmtAmt = (n: number) => (n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCount = (n: number) => (n || 0).toLocaleString("th-TH");

  const profitToday = data.today.total_bet - data.today.total_win;
  const netToday = data.today.total_deposit - data.today.total_withdraw;

  // ฟังก์ชันช่วยสร้างการ์ดสถิติให้สวยงาม
  const StatCard = ({ title, value, subtext, color, Icon }: { title: string, value: string | number, subtext: string, color: string, Icon: any }) => (
    <div style={{
      background: "white",
      border: "1px solid #f1f5f9",
      borderRadius: "1rem",
      padding: "1.25rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.05)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.02)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>{title}</p>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, color: color, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
        </div>
        <div style={{ background: `${color}15`, padding: "0.6rem", borderRadius: "0.75rem", color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.75rem 0 0 0", fontWeight: 500 }}>{subtext}</p>
    </div>
  );

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    color: "#334155",
    outline: "none",
    background: "white",
    fontFamily: "inherit"
  };

  const gridRowStyle = {
    display: "grid", 
    gridTemplateColumns: "repeat(4, 1fr)", // ฟิกซ์แถวละ 4 กล่อง
    gap: "1.25rem",
    marginBottom: "1.5rem"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0.5rem" }}>
      
      {/* ===== Header & Filters ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", background: "white", padding: "1.25rem 1.5rem", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ภาพรวมระบบ</h1>
          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>ดูสถิติและผลประกอบการทั้งหมด</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f8fafc", padding: "0.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <Calendar size={18} color="#64748b" style={{ marginLeft: "0.5rem" }} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, border: "none", background: "transparent" }} />
            <span style={{ color: "#cbd5e1" }}>-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, border: "none", background: "transparent" }} />
          </div>
          
          <button onClick={fetchDashboardData} style={{ background: "#0f172a", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.25rem", fontSize: "0.875rem", color: "white", cursor: "pointer", fontWeight: 600, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#1e293b"} onMouseLeave={(e) => e.currentTarget.style.background = "#0f172a"}>
            กรองข้อมูล
          </button>
        </div>
      </div>

      {/* ===== แจ้งเตือนรอดำเนินการ ===== */}
      {(data.pending.deposits > 0 || data.pending.withdrawals > 0) && (
        <div style={{ background: "linear-gradient(to right, #fffbeb, #fef3c7)", border: "1px solid #fde68a", borderRadius: "1rem", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px -1px rgba(251, 191, 36, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "#f59e0b", padding: "0.5rem", borderRadius: "50%", color: "white", display: "flex" }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#92400e" }}>มีรายการรอดำเนินการ</h3>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#b45309" }}>กรุณาตรวจสอบและอนุมัติรายการ</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ background: "white", border: "1px solid #fcd34d", color: "#d97706", padding: "0.4rem 1rem", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              รอฝาก <span style={{ background: "#f59e0b", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", marginLeft: "0.25rem" }}>{fmtCount(data.pending.deposits)}</span>
            </div>
            <div style={{ background: "white", border: "1px solid #fcd34d", color: "#d97706", padding: "0.4rem 1rem", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              รอถอน <span style={{ background: "#ef4444", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", marginLeft: "0.25rem" }}>{fmtCount(data.pending.withdrawals)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== แถวที่ 1: ข้อมูลผู้ใช้งาน ===== */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "4px", height: "16px", background: "#3b82f6", borderRadius: "2px" }}></div>
          ข้อมูลสมาชิก
        </h2>
        <div style={gridRowStyle}>
          <StatCard title="สมาชิกทั้งหมด" value={fmtCount(data.overall.total_users)} subtext="บัญชีทั้งหมดในระบบ" color="#0ea5e9" Icon={Users} />
          <StatCard title="สมาชิกใหม่" value={fmtCount(data.today.new_users)} subtext="สมัครใหม่ช่วงเวลานี้" color="#3b82f6" Icon={UserPlus} />
          <StatCard title="ลูกค้าเข้าใช้งาน" value={fmtCount(data.overall.active_users)} subtext="ออนไลน์ในระบบ" color="#14b8a6" Icon={Activity} />
          <StatCard title="ยอดฝากแรก (First Deposit)" value={fmtCount(data.today.first_deposit_count)} subtext="จำนวนบิลฝากครั้งแรก" color="#eab308" Icon={Star} />
        </div>
      </div>

      {/* ===== แถวที่ 2: ข้อมูลธุรกรรม ===== */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "4px", height: "16px", background: "#10b981", borderRadius: "2px" }}></div>
          ข้อมูลธุรกรรม
        </h2>
        <div style={gridRowStyle}>
          <StatCard title="จำนวนฝาก" value={`${fmtCount(data.today.deposit_count)} บิล`} subtext="รายการฝากที่สำเร็จ" color="#8b5cf6" Icon={Receipt} />
          <StatCard title="ยอดฝาก" value={`฿${fmtAmt(data.today.total_deposit)}`} subtext="ยอดเงินฝากรวม" color="#10b981" Icon={ArrowDownToLine} />
          <StatCard title="จำนวนถอน" value={`${fmtCount(data.today.withdraw_count)} บิล`} subtext="รายการถอนที่สำเร็จ" color="#f43f5e" Icon={CreditCard} />
          <StatCard title="ยอดถอน" value={`฿${fmtAmt(data.today.total_withdraw)}`} subtext="ยอดเงินถอนรวม" color="#f59e0b" Icon={ArrowUpFromLine} />
        </div>
      </div>

      {/* ===== แถวที่ 3: สรุปผลประกอบการและการเล่น ===== */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "4px", height: "16px", background: "#f59e0b", borderRadius: "2px" }}></div>
          สรุปผลประกอบการและการเล่น
        </h2>
        <div style={gridRowStyle}>
          <StatCard title="ฝาก - ถอน" value={`฿${fmtAmt(netToday)}`} subtext={netToday >= 0 ? "เงินเข้ามากกว่าเงินออก" : "เงินออกมากกว่าเงินเข้า"} color={netToday >= 0 ? "#8b5cf6" : "#ef4444"} Icon={Wallet} />
          <StatCard title="กำไรสุทธิ" value={`฿${fmtAmt(profitToday)}`} subtext="เดิมพันรวม - ชนะรวม" color={profitToday >= 0 ? "#10b981" : "#ef4444"} Icon={CircleDollarSign} />
          <StatCard title="ยอดเดิมพันสะสม" value={`฿${fmtAmt(data.today.total_bet)}`} subtext="ยอดแทงรวมของสมาชิก" color="#6366f1" Icon={Gamepad2} />
          <StatCard title="ยอดชนะสะสม" value={`฿${fmtAmt(data.today.total_win)}`} subtext="ยอดที่สมาชิกเล่นชนะ" color="#ec4899" Icon={Trophy} />
        </div>
      </div>

      {/* ===== กราฟสถิติ ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginTop: "0.5rem" }}>
        
        {/* กราฟฝาก-ถอน */}
        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)" }}>
          <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1.5rem 0" }}>
            สถิติการฝาก-ถอนย้อนหลัง
          </h3>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} tickFormatter={(value) => `฿${value}`} />
                <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: 500, color: "#0f172a" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "13px", paddingTop: "20px", fontWeight: 500, color: "#475569" }} />
                <Bar dataKey="deposit" name="ยอดฝาก" fill="#10b981" radius={[6, 6, 0, 0]} barSize={16} />
                <Bar dataKey="withdraw" name="ยอดถอน" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* กราฟเดิมพัน-ชนะ */}
        <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)" }}>
          <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem", margin: "0 0 1.5rem 0" }}>
            สถิติการเดิมพัน-ชนะย้อนหลัง
          </h3>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} tickFormatter={(value) => `฿${value}`} />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: 500, color: "#0f172a" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "13px", paddingTop: "20px", fontWeight: 500, color: "#475569" }} />
                <Line type="monotone" dataKey="bet" name="ยอดเดิมพัน" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="win" name="ยอดชนะ" stroke="#ec4899" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}