"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  phone: string;
  full_name: string | null;
  status: string;
  bank_code: string | null;
  bank_account: string | null;
  bank_name: string | null;
  referral_code: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
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
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", bank_code: "", bank_account: "", bank_name: "" });
  const router = useRouter();

  const fetchUsers = (s?: string) => {
    setLoading(true);
    api.get("/admin/users", { params: { search: s } }).then((res) => {
      setUsers(res.data.data.data || res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdjust = async () => {
    if (!selected || !adjustAmount || !adjustDesc) return;
    try {
      await api.post(`/admin/users/${selected.id}/adjust`, { amount: parseFloat(adjustAmount), description: adjustDesc });
      Swal.fire({ icon: "success", title: "ปรับยอดสำเร็จ", timer: 1500, showConfirmButton: false });
      setSelected(null); setAdjustAmount(""); setAdjustDesc("");
      fetchUsers();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ปรับยอดไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    const label = newStatus === "active" ? "เปิดใช้งาน" : "ระงับบัญชี";
    const result = await Swal.fire({
      title: `${label}?`,
      text: `ต้องการ${label} ${user.username} ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `ใช่, ${label}`,
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: newStatus === "active" ? "#10b981" : "#ef4444",
    });
    if (!result.isConfirmed) return;
    try {
      await api.put(`/admin/users/${user.id}`, { status: newStatus });
      Swal.fire({ icon: "success", title: `${label}สำเร็จ`, timer: 1500, showConfirmButton: false });
      fetchUsers();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const handleViewProfile = async (user: User) => {
    try {
      const res = await api.get(`/admin/users/${user.id}`);
      setProfileUser(res.data.data);
    } catch {
      setProfileUser(user);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      bank_code: user.bank_code || "",
      bank_account: user.bank_account || "",
      bank_name: user.bank_name || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      await api.put(`/admin/users/${editUser.id}`, editForm);
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#334155",
    outline: "none",
    width: "100%",
  };

  const btnStyle = (bg: string, color: string, border: string) => ({
    background: bg, color, border: `1px solid ${border}`, borderRadius: "0.375rem",
    padding: "0.3rem 0.6rem", fontSize: "0.7rem", fontWeight: 600 as const, cursor: "pointer", transition: "all 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>จัดการสมาชิก</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>ดูข้อมูล แก้ไข เปิด/ปิดบัญชี และปรับยอดสมาชิก</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(search); }} style={{ display: "flex", gap: "0.5rem" }}>
          <input style={{ ...inputStyle, width: "260px" }} placeholder="ค้นหา Username / เบอร์โทร..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" style={{ background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0 1.25rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}>ค้นหา</button>
        </form>
      </div>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["ID", "Username", "ชื่อ", "เบอร์โทร", "ยอดเงิน", "สถานะ", "สมัครเมื่อ", "การจัดการ"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{u.id}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#0f172a" }}>{u.username}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>{u.full_name || "-"}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>{u.phone}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#10b981", fontWeight: 600 }}>฿{u.wallet ? fmt(u.wallet.balance) : "0.00"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{
                        padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600,
                        background: u.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: u.status === "active" ? "#166534" : "#991b1b",
                      }}>{u.status === "active" ? "ใช้งาน" : "ระงับ"}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.78rem" }}>
                      {new Date(u.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <button onClick={() => router.push(`/dashboard/users/${u.id}`)} style={btnStyle("#f0fdf4", "#166534", "#bbf7d0")}>โปรไฟล์</button>
                        <button onClick={() => handleOpenEdit(u)} style={btnStyle("#eff6ff", "#1d4ed8", "#bfdbfe")}>แก้ไข</button>
                        <button onClick={() => setSelected(u)} style={btnStyle("#fefce8", "#854d0e", "#fde68a")}>ปรับยอด</button>
                        <button onClick={() => handleToggleStatus(u)} style={btnStyle(u.status === "active" ? "#fef2f2" : "#f0fdf4", u.status === "active" ? "#dc2626" : "#16a34a", u.status === "active" ? "#fecaca" : "#bbf7d0")}>
                          {u.status === "active" ? "ระงับ" : "เปิดใช้"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบข้อมูลสมาชิก</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ดูโปรไฟล์ */}
      {profileUser && (
        <div onClick={() => setProfileUser(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "480px", borderRadius: "0.75rem", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem" }}>โปรไฟล์สมาชิก</h3>
            {[
              ["Username", profileUser.username],
              ["ชื่อ-นามสกุล", profileUser.full_name || "-"],
              ["เบอร์โทร", profileUser.phone || "-"],
              ["ธนาคาร", profileUser.bank_code || "-"],
              ["เลขบัญชี", profileUser.bank_account || "-"],
              ["ชื่อบัญชี", profileUser.bank_name || "-"],
              ["สถานะ", profileUser.status === "active" ? "ใช้งาน" : "ระงับ"],
              ["ยอดเงิน", `฿${profileUser.wallet ? fmt(profileUser.wallet.balance) : "0.00"}`],
              ["ฝากรวม", `฿${profileUser.wallet ? fmt(profileUser.wallet.total_deposit) : "0.00"}`],
              ["ถอนรวม", `฿${profileUser.wallet ? fmt(profileUser.wallet.total_withdraw) : "0.00"}`],
              ["รหัสแนะนำ", profileUser.referral_code || "-"],
              ["Login ล่าสุด", profileUser.last_login_at ? new Date(profileUser.last_login_at).toLocaleString("th-TH") : "-"],
              ["IP ล่าสุด", profileUser.last_login_ip || "-"],
              ["สมัครเมื่อ", new Date(profileUser.created_at).toLocaleString("th-TH")],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{label}</span>
                <span style={{ color: "#0f172a", fontSize: "0.85rem", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            <button onClick={() => setProfileUser(null)} style={{ marginTop: "1.25rem", width: "100%", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>ปิด</button>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูล */}
      {editUser && (
        <div onClick={() => setEditUser(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "420px", borderRadius: "0.75rem", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>แก้ไขข้อมูลสมาชิก</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>Username: <strong>{editUser.username}</strong></p>
            {[
              { label: "ชื่อ-นามสกุล", key: "full_name", placeholder: "ชื่อ นามสกุล" },
              { label: "เบอร์โทร", key: "phone", placeholder: "0812345678" },
              { label: "รหัสธนาคาร", key: "bank_code", placeholder: "KBANK, SCB, BBL..." },
              { label: "เลขบัญชี", key: "bank_account", placeholder: "1234567890" },
              { label: "ชื่อบัญชี", key: "bank_name", placeholder: "ชื่อเจ้าของบัญชี" },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>{field.label}</label>
                <input
                  style={inputStyle}
                  placeholder={field.placeholder}
                  value={(editForm as any)[field.key]}
                  onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button onClick={handleSaveEdit} style={{ flex: 1, background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>บันทึก</button>
              <button onClick={() => setEditUser(null)} style={{ flex: 1, background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ปรับยอดเงิน */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "420px", borderRadius: "0.75rem", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>ปรับยอดเงินสมาชิก</h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>Username: <strong style={{ color: "#0f172a" }}>{selected.username}</strong></p>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>ยอดเงินปัจจุบัน</span>
              <span style={{ fontSize: "1.25rem", color: "#10b981", fontWeight: 700 }}>฿{selected.wallet ? fmt(selected.wallet.balance) : "0.00"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>จำนวนเงิน (ใส่ - เพื่อลดยอด)</label>
                <input type="number" step="0.01" placeholder="เช่น 500 หรือ -500" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>เหตุผลการปรับยอด</label>
                <input placeholder="เช่น กิจกรรมแจกเครดิต" value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button onClick={handleAdjust} style={{ flex: 1, background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>ยืนยันปรับยอด</button>
                <button onClick={() => setSelected(null)} style={{ flex: 1, background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.625rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}