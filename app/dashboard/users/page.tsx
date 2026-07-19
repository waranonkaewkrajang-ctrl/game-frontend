"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface User {
  id: number;
  username: string;
  phone: string;
  full_name: string | null;
  status: string;
  created_at: string;
  wallet: { balance: string; total_deposit: string; total_withdraw: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");

  const fetchUsers = (s?: string) => {
    setLoading(true);
    api.get("/admin/users", { params: { search: s } }).then((res) => {
      setUsers(res.data.data.data || res.data.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdjust = async () => {
    if (!selected || !adjustAmount || !adjustDesc) return;
    try {
      await api.post(`/admin/users/${selected.id}/adjust`, { 
        amount: parseFloat(adjustAmount), 
        description: adjustDesc 
      });
      alert("ปรับยอดสำเร็จ");
      setSelected(null); 
      setAdjustAmount(""); 
      setAdjustDesc("");
      fetchUsers();
    } catch (err: any) { 
      alert(err.response?.data?.message || "ปรับยอดไม่สำเร็จ"); 
    }
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  // สไตล์สำหรับ Input เพื่อความเรียบหรูและเป็นทางการ
  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#334155",
    outline: "none",
    width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>จัดการสมาชิก</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>ดูข้อมูลและปรับยอดสมาชิกในระบบ</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(search); }} style={{ display: "flex", gap: "0.5rem" }}>
          <input 
            style={{ ...inputStyle, width: "260px" }} 
            placeholder="ค้นหา Username หรือ เบอร์โทรศัพท์..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <button 
            type="submit" 
            style={{
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Table Section */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748b", fontSize: "0.875rem" }}>
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["ID", "Username", "เบอร์โทรศัพท์", "ยอดเงินคงเหลือ", "สถานะ", "วันที่สมัคร", "การจัดการ"].map((h) => (
                    <th key={h} style={{ padding: "1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1rem", color: "#64748b" }}>{u.id}</td>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#0f172a" }}>{u.username}</td>
                    <td style={{ padding: "1rem", color: "#475569" }}>{u.phone}</td>
                    <td style={{ padding: "1rem", color: "#10b981", fontWeight: 600 }}>฿{u.wallet ? fmt(u.wallet.balance) : "0.00"}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: u.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: u.status === "active" ? "#166534" : "#991b1b",
                        textTransform: "uppercase"
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>
                      {new Date(u.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button 
                        onClick={() => setSelected(u)} 
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          borderRadius: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        ปรับยอด
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบข้อมูลสมาชิก</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ปรับยอดเงิน */}
      {selected && (
        <div 
          onClick={() => setSelected(null)} 
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" }}
        >
          <div 
            style={{ background: "white", width: "100%", maxWidth: "420px", borderRadius: "0.75rem", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }} 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem 0" }}>ปรับยอดเงินสมาชิก</h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Username: <strong style={{ color: "#0f172a" }}>{selected.username}</strong>
            </p>
            
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>ยอดเงินปัจจุบัน</span>
              <span style={{ fontSize: "1.25rem", color: "#10b981", fontWeight: 700 }}>฿{selected.wallet ? fmt(selected.wallet.balance) : "0.00"}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>จำนวนเงิน (ใส่เครื่องหมาย - เพื่อลดยอด)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="เช่น 500 หรือ -500" 
                  value={adjustAmount} 
                  onChange={(e) => setAdjustAmount(e.target.value)} 
                  style={inputStyle}
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>เหตุผลการปรับยอด</label>
                <input 
                  placeholder="เช่น กิจกรรมแจกเครดิต, หักเงินคืนระบบ" 
                  value={adjustDesc} 
                  onChange={(e) => setAdjustDesc(e.target.value)} 
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button 
                  onClick={handleAdjust} 
                  style={{ flex: 1, background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
                >
                  ยืนยันการปรับยอด
                </button>
                <button 
                  onClick={() => setSelected(null)} 
                  style={{ flex: 1, background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}