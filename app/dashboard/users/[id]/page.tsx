"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"deposits" | "withdrawals" | "transactions">("transactions");

  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (field: string, currentValue: string) => {
    setEditing(field);
    setEditValue(currentValue || "");
  };

  const handleSave = async (field: string) => {
    try {
      await api.put(`/admin/users/${user.id}`, { [field]: editValue });
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
      api.get(`/admin/users/${userId}`).then((res) => setUser(res.data.data));
      setEditing(null);
    } catch (e: any) {
      Swal.fire({ icon: "error", title: e.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
  };

  useEffect(() => {
    api.get(`/admin/users/${userId}`).then((res) => {
      setUser(res.data.data);
      setLoading(false);
    }).catch(() => {
      Swal.fire({ icon: "error", title: "ไม่พบข้อมูลสมาชิก" });
      setLoading(false);
    });
  }, [userId]);

  const fmt = (n: any) => parseFloat(n || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const statusColor = (s: string) => s === "approved" || s === "active" || s === "completed"
    ? { bg: "#dcfce7", color: "#166534" }
    : s === "pending" || s === "processing"
    ? { bg: "#fef9c3", color: "#854d0e" }
    : { bg: "#fee2e2", color: "#991b1b" };

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>;
  if (!user) return <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>ไม่พบข้อมูลสมาชิก</div>;

  const deposits = user.deposits || [];
  const withdrawals = user.withdrawals || [];
  const transactions = user.wallet?.transactions || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header + ปุ่มกลับ */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => router.push("/dashboard/users")} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "0.375rem", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
          ← กลับ
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>โปรไฟล์: {user.username}</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.2rem" }}>ID: {user.id} | สมัครเมื่อ {new Date(user.created_at).toLocaleString("th-TH")}</p>
        </div>
      </div>

      {/* ข้อมูลส่วนตัว + การเงิน */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Card: ข้อมูลส่วนตัว */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ข้อมูลส่วนตัว</h3>
          {[
            { label: "ชื่อ-นามสกุล", value: user.full_name || "-", field: "full_name" },
            { label: "เบอร์โทร", value: user.phone || "-", field: "phone" },
            { label: "สถานะ", value: user.status === "active" ? "ใช้งาน" : "ระงับ", field: "" },
            { label: "รหัสแนะนำ", value: user.referral_code || "-", field: "" },
            { label: "Login ล่าสุด", value: user.last_login_at ? new Date(user.last_login_at).toLocaleString("th-TH") : "-", field: "" },
            { label: "IP ล่าสุด", value: user.last_login_ip || "-", field: "" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{item.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {editing === item.field ? (
                  <>
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem", fontSize: "0.85rem", width: "150px" }} autoFocus />
                    <button onClick={() => handleSave(item.field)} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>✓</button>
                    <button onClick={() => setEditing(null)} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ color: "#0f172a", fontSize: "0.85rem", fontWeight: 500 }}>{item.value}</span>
                    {item.field && (
                      <button onClick={() => handleEdit(item.field, item.field === "full_name" ? user.full_name : user.phone)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d97706", fontSize: "0.85rem", padding: "0" }} title="แก้ไข">✏️</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Card: การเงิน + ธนาคาร */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>การเงิน & ธนาคาร</h3>
          {[
            { label: "ยอดเงินคงเหลือ", value: `฿${fmt(user.wallet?.balance)}`, field: "" },
            { label: "ฝากรวม", value: `฿${fmt(user.wallet?.total_deposit)}`, field: "" },
            { label: "ถอนรวม", value: `฿${fmt(user.wallet?.total_withdraw)}`, field: "" },
            { label: "ตั๋ววงล้อ", value: `${user.wallet?.ticket_balance ?? 0} ใบ`, field: "" },
            { label: "คะแนน", value: `${user.wallet?.point_balance ?? 0} คะแนน`, field: "" },
            { label: "ธนาคาร", value: user.bank_code || "-", field: "bank_code" },
            { label: "เลขบัญชี", value: user.bank_account || "-", field: "bank_account" },
            { label: "ชื่อบัญชี", value: user.bank_name || "-", field: "bank_name" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{item.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {editing === item.field ? (
                  <>
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem", fontSize: "0.85rem", width: "150px" }} autoFocus />
                    <button onClick={() => handleSave(item.field)} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>✓</button>
                    <button onClick={() => setEditing(null)} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ color: item.label.includes("ยอด") ? "#10b981" : "#0f172a", fontSize: "0.85rem", fontWeight: item.label.includes("ยอด") ? 700 : 500 }}>{item.value}</span>
                    {item.field && (
                      <button onClick={() => handleEdit(item.field, item.field === "bank_code" ? user.bank_code : item.field === "bank_account" ? user.bank_account : user.bank_name)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d97706", fontSize: "0.85rem", padding: "0" }} title="แก้ไข">✏️</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      {/* Tab: รายการฝาก / ถอน */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
          {[
            { key: "deposits" as const, label: `รายการฝาก (${deposits.length})` },
            { key: "withdrawals" as const, label: `รายการถอน (${withdrawals.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "0.75rem", border: "none", cursor: "pointer",
                fontSize: "0.85rem", fontWeight: 600,
                background: tab === t.key ? "#2563eb" : "#f8fafc",
                color: tab === t.key ? "white" : "#64748b",
              }}>{t.label}</button>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          {tab === "deposits" ? (
            deposits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>ยังไม่มีรายการฝาก</div>
            ) : (
              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#dbeafe", borderBottom: "1px solid #93c5fd" }}>
                    {["ID", "จำนวน", "ช่องทาง", "สถานะ", "ทำรายการโดย", "วันที่"].map((h) => (
                      <th key={h} style={{ padding: "0.5rem 0.75rem", color: "#1e40af", fontWeight: 700, textAlign: "left", fontSize: "0.8rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d: any) => {
                    const sc = statusColor(d.status);
                    return (
                      <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{d.id}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#10b981", fontWeight: 600 }}>+฿{fmt(d.amount)}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.8rem" }}>{d.channel || "-"}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: sc.bg, color: sc.color }}>{d.status}</span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", color: "#6366f1", fontSize: "0.8rem", fontWeight: 500 }}>{d.approved_method === "auto" ? "🤖 AUTO" : d.approved_by ? (d.approved_by?.username || `Admin #${d.approved_by}`) : "-"}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.8rem" }}>{new Date(d.created_at).toLocaleString("th-TH")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            withdrawals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>ยังไม่มีรายการถอน</div>
            ) : (
              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#dbeafe", borderBottom: "1px solid #93c5fd" }}>
                    {["ID", "จำนวน", "สถานะ", "ทำรายการโดย", "วันที่"].map((h) => (
                      <th key={h} style={{ padding: "0.5rem 0.75rem", color: "#1e40af", fontWeight: 700, textAlign: "left", fontSize: "0.8rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w: any) => {
                    const sc = statusColor(w.status);
                    return (
                      <tr key={w.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{w.id}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#ef4444", fontWeight: 600 }}>-฿{fmt(w.amount)}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: sc.bg, color: sc.color }}>{w.status}</span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", color: "#6366f1", fontSize: "0.8rem", fontWeight: 500 }}>{w.approver ? w.approver.username : w.approved_by ? `Admin #${w.approved_by}` : "-"}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.8rem" }}>{new Date(w.created_at).toLocaleString("th-TH")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Card: ปรับเครดิต / คะแนน / วงล้อ */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.25rem", alignSelf: "start", maxWidth: "320px" }}>
        {[
          { label: "เครดิต", key: "credit", value: user.wallet?.balance, color: "#10b981" },
          { label: "คะแนน", key: "point", value: user.wallet?.point_balance ?? 0, color: "#f59e0b" },
          { label: "วงล้อ", key: "spin", value: user.wallet?.ticket_balance ?? 0, color: "#7c3aed", unit: "ใบ" },
        ].map((item) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "none" }}>
            <span style={{ width: "60px", fontSize: "0.9rem", color: "#374151", fontWeight: 500, textAlign: "right" }}>{item.label} :</span>
            <button onClick={async () => {
              const { value: amt } = await Swal.fire({ title: `เพิ่ม${item.label}`, input: "number", inputPlaceholder: "ใส่จำนวน", showCancelButton: true, confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก", confirmButtonColor: "#22c55e" });
              if (!amt || isNaN(Number(amt))) return;
              const endpoint = item.key === "spin" ? `/admin/users/${user.id}/adjust-tickets` : item.key === "point" ? `/admin/users/${user.id}/adjust-points` : `/admin/users/${user.id}/adjust`;
              api.post(endpoint, { amount: Number(amt), description: `Admin เพิ่ม${item.label}` })
                .then(() => { Swal.fire({ icon: "success", title: `เพิ่ม${item.label}สำเร็จ`, timer: 1500, showConfirmButton: false }); api.get(`/admin/users/${userId}`).then((res) => setUser(res.data.data)); })
                .catch((e) => Swal.fire({ icon: "error", title: e.response?.data?.message || "เกิดข้อผิดพลาด" }));
            }} style={{ padding: "0.5rem 0.75rem", background: "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>+</button>
            <input readOnly value={item.key === "credit" ? fmt(item.value) : `${item.value}${item.unit ? ` ${item.unit}` : ""}`} style={{ textAlign: "center", width: "30%", borderRadius: "0.375rem", border: "1px solid #d1d5db", padding: "0.25rem 0.4rem", fontSize: "0.8rem", fontWeight: 600, color: "#0f172a", background: "white" }} />
            <button onClick={async () => {
              const { value: amt } = await Swal.fire({ title: `ลด${item.label}`, input: "number", inputPlaceholder: "ใส่จำนวน", showCancelButton: true, confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก", confirmButtonColor: "#ef4444" });
              if (!amt || isNaN(Number(amt))) return;
              const endpoint = item.key === "spin" ? `/admin/users/${user.id}/adjust-tickets` : item.key === "point" ? `/admin/users/${user.id}/adjust-points` : `/admin/users/${user.id}/adjust`;
              api.post(endpoint, { amount: -Number(amt), description: `Admin ลด${item.label}` })
                .then(() => { Swal.fire({ icon: "success", title: `ลด${item.label}สำเร็จ`, timer: 1500, showConfirmButton: false }); api.get(`/admin/users/${userId}`).then((res) => setUser(res.data.data)); })
                .catch((e) => Swal.fire({ icon: "error", title: e.response?.data?.message || "เกิดข้อผิดพลาด" }));
            }} style={{ padding: "0.5rem 0.75rem", background: "#ef4444", color: "white", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>−</button>
          </div>
        ))}
      </div>

      </div>
    </div>
  );
}