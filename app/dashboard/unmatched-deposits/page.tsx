"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";
import { AlertCircle, CheckCircle, Trash2, RefreshCw } from "lucide-react";

export default function UnmatchedDepositsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/unmatched-deposits", { params: { status: filter || undefined } });
      setItems(res.data.data.data || res.data.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleApprove = async (item: any) => {
    const { value: input } = await Swal.fire({
      title: "อนุมัติยอดค้าง",
      html: `
        <div style="text-align:left;font-size:14px;color:#334155">
          <p><b>ยอดเงิน:</b> ฿${parseFloat(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
          <p><b>ธนาคาร:</b> ${item.bank}</p>
          <p><b>จาก:</b> ${item.from_account || "N/A"}</p>
          <p><b>เวลา:</b> ${item.tx_time || "-"}</p>
          <hr style="margin:12px 0"/>
          <p>กรอก <b>Username</b> หรือ <b>เบอร์โทร</b> ลูกค้าเพื่อเติมเงินเข้า:</p>
        </div>
      `,
      input: "text",
      inputPlaceholder: "เช่น artvaranon หรือ 0812345678",
      showCancelButton: true,
      confirmButtonText: "เติมเงิน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#10b981",
      inputValidator: (value) => { if (!value) return "กรุณากรอก Username หรือเบอร์โทร"; },
    });

    if (input) {
      try {
        const res = await api.post(`/admin/unmatched-deposits/${item.id}/approve`, { username_or_phone: input });
        Swal.fire({ icon: "success", title: "สำเร็จ", text: res.data.message, confirmButtonColor: "#0f172a" });
        fetchData();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
      }
    }
  };

  const handleReject = async (item: any) => {
    const result = await Swal.fire({
      title: "ลบรายการนี้?",
      text: `ยอด ฿${parseFloat(item.amount).toLocaleString()} | ${item.bank} | ${item.from_account || "N/A"}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่ ลบเลย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/unmatched-deposits/${item.id}/reject`);
        Swal.fire({ icon: "success", title: "ลบสำเร็จ", confirmButtonColor: "#0f172a" });
        fetchData();
      } catch { Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ" }); }
    }
  };

  const statusLabel = (s: string) => s === "pending" ? { text: "รอดำเนินการ", bg: "#fef9c3", color: "#854d0e" } : s === "approved" ? { text: "เติมแล้ว", bg: "#dcfce7", color: "#166534" } : { text: "ลบแล้ว", bg: "#fee2e2", color: "#991b1b" };

  return (
    <div style={{ padding: "1.5rem", color: "#0f172a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <AlertCircle color="#f59e0b" /> ยอดค้าง (เงินเข้าไม่มีคนแจ้งฝาก)
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>รายการเงินเข้าที่ยังไม่มีผู้แจ้งฝากในระบบ</p>
        </div>
        <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, color: "#475569" }}>
          <RefreshCw size={16} /> รีเฟรช
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {[
          { key: "pending", label: "รอดำเนินการ" },
          { key: "approved", label: "เติมแล้ว" },
          { key: "rejected", label: "ลบแล้ว" },
          { key: "", label: "ทั้งหมด" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: "0.4rem 1rem", borderRadius: "0.375rem", border: "1px solid", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
            background: filter === f.key ? "#0f172a" : "white",
            color: filter === f.key ? "white" : "#475569",
            borderColor: filter === f.key ? "#0f172a" : "#e2e8f0",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "0.5rem", border: "1px solid #e2e8f0", color: "#64748b" }}>ไม่พบรายการ</div>
      ) : (
        <div style={{ background: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["#", "ยอดเงิน", "ธนาคาร", "จาก", "เวลาโอน", "สถานะ", "เติมให้", "จัดการ"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: 600, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const sl = statusLabel(item.status);
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{item.id}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#10b981", fontWeight: 700 }}>฿{parseFloat(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{item.bank}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{item.from_account || "-"}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.8rem" }}>{item.tx_time || "-"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 600, background: sl.bg, color: sl.color }}>{sl.text}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#334155", fontSize: "0.8rem" }}>{item.user?.username || "-"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {item.status === "pending" && (
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={() => handleApprove(item)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.75rem", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500 }}>
                            <CheckCircle size={14} /> เติมเงิน
                          </button>
                          <button onClick={() => handleReject(item)} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.75rem", border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500 }}>
                            <Trash2 size={14} /> ลบ
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}