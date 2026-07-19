"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

const PERMISSIONS_LIST = [
  { key: "dashboard", label: "ดูภาพรวม (Dashboard)" },
  { key: "users", label: "จัดการสมาชิกทั้งหมด" },
  { key: "deposits", label: "อนุมัติ/ปฏิเสธ รายการฝาก" },
  { key: "withdrawals", label: "อนุมัติ/ปฏิเสธ รายการถอน" },
  { key: "promotions", label: "จัดการโปรโมชัน" },
  { key: "games", label: "จัดการเปิด/ปิดเกม" },
  { key: "reports", label: "ดูรายงานผลประกอบการ" },
  { key: "settings", label: "ตั้งค่าระบบ" },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/admins");
      setAdmins(res.data.data || res.data || []);
    } catch {
      setAdmins([
        { id: 1, username: "superadmin", name: "ผู้ดูแลสูงสุด", role: "super_admin", permissions: [], is_active: true },
        { id: 2, username: "staff_01", name: "พนักงานกะเช้า", role: "staff", permissions: ["dashboard", "deposits"], is_active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const openAddEdit = async (admin: any = null) => {
    const isEdit = !!admin;
    const currentPerms = admin?.permissions || [];

    const permCheckboxes = PERMISSIONS_LIST.map((p) =>
      `<label style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;border:1px solid #e2e8f0;border-radius:0.5rem;cursor:pointer;font-size:0.85rem;color:#334155;">
        <input type="checkbox" name="perms" value="${p.key}" ${currentPerms.includes(p.key) ? "checked" : ""} style="width:16px;height:16px;accent-color:#4f46e5;" />
        ${p.label}
      </label>`
    ).join("");

    const { value: formValues } = await Swal.fire({
      title: isEdit ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่",
      width: 600,
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:1rem;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div>
              <label style="font-size:0.8rem;font-weight:600;color:#334155;display:block;margin-bottom:0.25rem;">Username</label>
              <input id="swal-username" class="swal2-input" value="${admin?.username || ""}" ${isEdit ? "disabled" : ""} placeholder="ชื่อผู้ใช้" style="margin:0;width:100%;font-size:0.85rem;" />
            </div>
            <div>
              <label style="font-size:0.8rem;font-weight:600;color:#334155;display:block;margin-bottom:0.25rem;">Password ${isEdit ? '<span style="color:#94a3b8;font-size:0.7rem;">(เว้นว่างถ้าไม่เปลี่ยน)</span>' : ""}</label>
              <input id="swal-password" type="password" class="swal2-input" placeholder="รหัสผ่าน" style="margin:0;width:100%;font-size:0.85rem;" />
            </div>
          </div>
          <div>
            <label style="font-size:0.8rem;font-weight:600;color:#334155;display:block;margin-bottom:0.25rem;">ชื่อ-นามสกุล</label>
            <input id="swal-name" class="swal2-input" value="${admin?.name || ""}" placeholder="ชื่อ-นามสกุล" style="margin:0;width:100%;font-size:0.85rem;" />
          </div>
          <div>
            <label style="font-size:0.8rem;font-weight:600;color:#334155;display:block;margin-bottom:0.25rem;">ระดับสิทธิ์ (Role)</label>
            <select id="swal-role" class="swal2-select" style="margin:0;width:100%;font-size:0.85rem;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0.5rem;">
              <option value="staff" ${admin?.role === "staff" ? "selected" : ""}>Staff (พนักงานทั่วไป)</option>
              <option value="admin" ${admin?.role === "admin" ? "selected" : ""}>Admin</option>
              <option value="super_admin" ${admin?.role === "super_admin" ? "selected" : ""}>Super Admin (เข้าถึงได้ทุกอย่าง)</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.8rem;font-weight:700;color:#0f172a;display:block;margin-bottom:0.5rem;padding-top:0.5rem;border-top:1px solid #f1f5f9;">สิทธิ์การเข้าถึงเมนู (สำหรับ Staff)</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
              ${permCheckboxes}
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: isEdit ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      preConfirm: () => {
        const username = (document.getElementById("swal-username") as HTMLInputElement).value;
        const password = (document.getElementById("swal-password") as HTMLInputElement).value;
        const name = (document.getElementById("swal-name") as HTMLInputElement).value;
        const role = (document.getElementById("swal-role") as HTMLSelectElement).value;
        const checkboxes = document.querySelectorAll('input[name="perms"]:checked');
        const permissions = Array.from(checkboxes).map((cb: any) => cb.value);

        if (!username || !name) {
          Swal.showValidationMessage("กรุณากรอก Username และชื่อ-นามสกุล");
          return false;
        }
        if (!isEdit && !password) {
          Swal.showValidationMessage("กรุณากรอกรหัสผ่าน");
          return false;
        }

        return { username, password, name, role, permissions };
      },
    });

    if (formValues) {
      try {
        if (isEdit) {
          await api.put(`/admin/admins/${admin.id}`, formValues);
          Swal.fire({ icon: "success", title: "อัปเดตสำเร็จ", text: "แก้ไขข้อมูลพนักงานเรียบร้อย", timer: 2000, showConfirmButton: false });
        } else {
          await api.post("/admin/admins", formValues);
          Swal.fire({ icon: "success", title: "เพิ่มสำเร็จ", text: "เพิ่มพนักงานใหม่เรียบร้อย", timer: 2000, showConfirmButton: false });
        }
        fetchAdmins();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
      }
    }
  };

  const handleDelete = async (admin: any) => {
    const confirm = await Swal.fire({
      title: "ลบพนักงาน?",
      html: `ยืนยันลบ <strong>${admin.name}</strong> (${admin.username}) ออกจากระบบ`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยันลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/admin/admins/${admin.id}`);
        Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1500, showConfirmButton: false });
        fetchAdmins();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
      }
    }
  };

  const thStyle = { textAlign: "left" as const, padding: "0.75rem 1rem", fontSize: "0.8rem", fontWeight: 600, color: "#64748b", borderBottom: "2px solid #e2e8f0" };
  const tdStyle = { padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#334155", borderBottom: "1px solid #f1f5f9" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>จัดการสิทธิ์และพนักงาน</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>เพิ่ม แก้ไข หรือลบผู้ดูแลระบบ พร้อมกำหนดสิทธิ์การเข้าถึง</p>
        </div>
        <button onClick={() => openAddEdit()} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem" }}>
          เพิ่มพนักงาน
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", borderLeft: "3px solid #8b5cf6" }}>
          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0, fontWeight: 500 }}>ผู้ดูแลทั้งหมด</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0.25rem 0 0 0" }}>{admins.length}</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", borderLeft: "3px solid #dc2626" }}>
          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0, fontWeight: 500 }}>Super Admin</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#dc2626", margin: "0.25rem 0 0 0" }}>{admins.filter((a) => a.role === "super_admin").length}</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", borderLeft: "3px solid #3b82f6" }}>
          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0, fontWeight: 500 }}>Staff</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3b82f6", margin: "0.25rem 0 0 0" }}>{admins.filter((a) => a.role !== "super_admin").length}</p>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden" }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>กำลังโหลด...</p>
        ) : admins.length === 0 ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>ไม่พบข้อมูลพนักงาน</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ ...thStyle, width: "50px" }}>No.</th>
                <th style={thStyle}>ชื่อผู้ใช้</th>
                <th style={thStyle}>ชื่อ-นามสกุล</th>
                <th style={{ ...thStyle, textAlign: "center" as const }}>ระดับ</th>
                <th style={thStyle}>สิทธิ์การเข้าถึง</th>
                <th style={{ ...thStyle, textAlign: "center" as const, width: "120px" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, i) => (
                <tr key={admin.id} style={{ transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                  <td style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#0f172a" }}>{admin.username}</td>
                  <td style={tdStyle}>{admin.name}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {admin.role === "super_admin" ? (
                      <span style={{ background: "#f3e8ff", color: "#7c3aed", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>Super Admin</span>
                    ) : admin.role === "admin" ? (
                      <span style={{ background: "#dbeafe", color: "#2563eb", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>Admin</span>
                    ) : (
                      <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>Staff</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {admin.role === "super_admin" ? (
                      <span style={{ color: "#10b981", fontSize: "0.8rem", fontWeight: 500 }}>เข้าถึงได้ทุกเมนู</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {(admin.permissions || []).length === 0 ? (
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>ไม่มีสิทธิ์</span>
                        ) : (
                          (admin.permissions || []).map((p: string) => (
                            <span key={p} style={{ background: "#eff6ff", color: "#2563eb", fontSize: "0.65rem", fontWeight: 500, padding: "0.15rem 0.4rem", borderRadius: "9999px" }}>
                              {PERMISSIONS_LIST.find((x) => x.key === p)?.label || p}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                      <button onClick={() => openAddEdit(admin)} style={{
                        background: "#eff6ff", border: "none", borderRadius: "0.35rem", padding: "0.35rem 0.65rem",
                        fontSize: "0.75rem", color: "#2563eb", cursor: "pointer", fontWeight: 600,
                      }}>แก้ไข</button>
                      {admin.role !== "super_admin" && (
                        <button onClick={() => handleDelete(admin)} style={{
                          background: "#fee2e2", border: "none", borderRadius: "0.35rem", padding: "0.35rem 0.65rem",
                          fontSize: "0.75rem", color: "#dc2626", cursor: "pointer", fontWeight: 600,
                        }}>ลบ</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}