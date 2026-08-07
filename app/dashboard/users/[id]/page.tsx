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

  // ฟังก์ชันจัดการเพิ่ม/ลด (API)
  const handleAdjust = async (type: "credit" | "point" | "spin", action: "add" | "sub") => {
    const labels = { credit: "เครดิต", point: "คะแนน", spin: "วงล้อ" };
    const label = labels[type];
    const act = action === "add" ? "เพิ่ม" : "ลด";
    const color = action === "add" ? "#22c55e" : "#ef4444";
    
    const { value: amt } = await Swal.fire({ 
      title: `${act}${label}`, 
      input: "number", 
      inputPlaceholder: "ใส่จำนวน", 
      showCancelButton: true, 
      confirmButtonText: "ยืนยัน", 
      cancelButtonText: "ยกเลิก", 
      confirmButtonColor: color 
    });

    if (!amt || isNaN(Number(amt))) return;

    let amount = Number(amt);
    if (action === "sub") amount = -amount;

    const endpoint = type === "spin" ? `/admin/users/${user.id}/adjust-tickets` 
                   : type === "point" ? `/admin/users/${user.id}/adjust-points` 
                   : `/admin/users/${user.id}/adjust`;

    api.post(endpoint, { amount, description: `Admin ${act}${label}` })
      .then(() => { 
        Swal.fire({ icon: "success", title: `${act}${label}สำเร็จ`, timer: 1500, showConfirmButton: false }); 
        window.location.reload(); 
      })
      .catch((e) => Swal.fire({ icon: "error", title: e.response?.data?.message || "เกิดข้อผิดพลาด" }));
  };

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>;
  if (!user) return <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>ไม่พบข้อมูลสมาชิก</div>;

  const deposits = user.deposits || [];
  const withdrawals = user.withdrawals || [];

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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>

        {/* Card: ข้อมูลส่วนตัว */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ข้อมูลส่วนตัว</h3>
          {[
            ["ชื่อ-นามสกุล", user.full_name || "-"],
            ["เบอร์โทร", user.phone || "-"],
            ["สถานะ", user.status === "active" ? "ใช้งาน" : "ระงับ"],
            ["รหัสแนะนำ", user.referral_code || "-"],
            ["Login ล่าสุด", user.last_login_at ? new Date(user.last_login_at).toLocaleString("th-TH") : "-"],
            ["IP ล่าสุด", user.last_login_ip || "-"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{label}</span>
              <span style={{ color: "#0f172a", fontSize: "0.85rem", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Card: การเงิน + ธนาคาร */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>การเงิน & ธนาคาร</h3>
          {[
            ["ยอดเงินคงเหลือ", `฿${fmt(user.wallet?.balance)}`],
            ["ฝากรวม", `฿${fmt(user.wallet?.total_deposit)}`],
            ["ถอนรวม", `฿${fmt(user.wallet?.total_withdraw)}`],
            ["ตั๋ววงล้อ", `${user.wallet?.ticket_balance ?? 0} ใบ`],
            ["คะแนน", `${user.wallet?.point_balance ?? 0} คะแนน`],
            ["ธนาคาร", user.bank_code || "-"],
            ["เลขบัญชี", user.bank_account || "-"],
            ["ชื่อบัญชี", user.bank_name || "-"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{label}</span>
              <span style={{ color: label.includes("ยอด") ? "#10b981" : "#0f172a", fontSize: "0.85rem", fontWeight: label.includes("ยอด") ? 700 : 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 🌟 Card: ปรับเครดิต / คะแนน / วงล้อ (ดีไซน์ Tailwind เต็มรูปแบบ) */}
        <div className="flex flex-col divide-y divide-gray-200 rounded-lg bg-white shadow p-4 border border-gray-200">
          
          {/* เครดิต */}
          <dl className="grid grid-cols-12 gap-2 mb-3 pt-2">
            <dd className="col-span-3 text-right"><span className="inline-block pt-1.5 text-gray-700 text-sm font-medium">เครดิต :</span></dd>
            <dd className="col-span-9 flex items-center justify-start gap-2">
              <button title="เพิ่ม" onClick={() => handleAdjust("credit", "add")} className="rounded-lg bg-green-500 h-8 px-4 text-white transition-colors duration-150 hover:bg-gray-500 flex items-center justify-center font-bold text-lg leading-none cursor-pointer border-none shadow-sm">
                +
              </button>
              <input type="text" value={fmt(user.wallet?.balance)} readOnly className="text-center w-3/6 rounded-md border border-gray-300 py-1.5 px-3 text-emerald-500 font-bold focus:outline-none md:text-md sm:text-sm bg-gray-50 shadow-inner" />
              <button title="ลบ" onClick={() => handleAdjust("credit", "sub")} className="rounded-lg bg-red-500 h-8 px-4 text-white transition-colors duration-150 hover:bg-gray-500 flex items-center justify-center font-bold text-lg leading-none cursor-pointer border-none shadow-sm">
                −
              </button>
            </dd>
          </dl>

          {/* คะแนน */}
          <dl className="grid grid-cols-12 gap-2 mb-3 pt-4">
            <dd className="col-span-3 text-right"><span className="inline-block pt-1.5 text-gray-700 text-sm font-medium">คะแนน :</span></dd>
            <dd className="col-span-9 flex items-center justify-start gap-2">
              <button title="เพิ่ม" onClick={() => handleAdjust("point", "add")} className="rounded-lg bg-green-500 h-8 px-4 text-white transition-colors duration-150 hover:bg-gray-500 flex items-center justify-center font-bold text-lg leading-none cursor-pointer border-none shadow-sm">
                +
              </button>
              <input type="text" value={fmt(user.wallet?.point_balance ?? 0)} readOnly className="text-center w-3/6 rounded-md border border-gray-300 py-1.5 px-3 text-amber-500 font-bold focus:outline-none md:text-md sm:text-sm bg-gray-50 shadow-inner" />
              <button title="ลบ" onClick={() => handleAdjust("point", "sub")} className="rounded-lg bg-red-500 h-8 px-4 text-white transition-colors duration-150 hover:bg-gray-500 flex items-center justify-center font-bold text-lg leading-none cursor-pointer border-none shadow-sm">
                −
              </button>
            </dd>
          </dl>

          {/* วงล้อ */}
          <dl className="grid grid-cols-12 gap-2 mb-3 pt-4">
            <dd className="col-span-3 text-right"><span className="inline-block pt-1.5 text-gray-700 text-sm font-medium">วงล้อ :</span></dd>
            <dd className="col-span-9 flex items-center justify-start gap-2">
              <button title="เพิ่ม" onClick={() => handleAdjust("spin", "add")} className="rounded-lg bg-green-500 h-8 px-4 text-white transition-colors duration-150 hover:bg-gray-500 flex items-center justify-center font-bold text-lg leading-none cursor-pointer border-none shadow-sm">
                +
              </button>
              <input type="text" value={`${user.wallet?.ticket_balance ?? 0} ใบ`} readOnly className="text-center w-3/6 rounded-md border border-gray-300 py-1.5 px-3 text-purple-600 font-bold focus:outline-none md:text-md sm:text-sm bg-gray-50 shadow-inner" />
              <button title="ลบ" onClick={() => handleAdjust("spin", "sub")} className="rounded-lg bg-red-500 h-8 px-4 text-white transition-colors duration-150 hover:bg-gray-500 flex items-center justify-center font-bold text-lg leading-none cursor-pointer border-none shadow-sm">
                −
              </button>
            </dd>
          </dl>

          {/* สูตร */}
          <dl className="grid grid-cols-12 gap-2 mb-1 pt-4">
            <dd className="col-span-3 text-right"><span className="inline-block pt-1.5 text-gray-700 text-sm font-medium">สูตร :</span></dd>
            <dd className="col-span-9 flex items-center justify-start gap-2">
              <input type="text" value="0" readOnly className="text-center w-3/6 rounded-md border border-gray-300 py-1.5 px-3 text-gray-500 font-bold focus:outline-none md:text-md sm:text-sm bg-gray-100 shadow-inner" />
            </dd>
          </dl>

        </div>
      </div>

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
    </div>
  );
}