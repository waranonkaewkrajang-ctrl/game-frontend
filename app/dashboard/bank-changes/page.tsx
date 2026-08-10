"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function BankChangesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchRequests = () => {
    setLoading(true);
    api.get("/admin/bank-changes", { params: { status: filter } })
      .then((res) => setRequests(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleApprove = async (id: number) => {
    const confirm = await Swal.fire({
      title: "ยืนยันอนุมัติ?",
      text: "ระบบจะเปลี่ยนเลขบัญชีของลูกค้าทันที",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "อนุมัติ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#64748b",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.post(`/admin/bank-changes/${id}/approve`);
      Swal.fire({ icon: "success", title: "อนุมัติสำเร็จ", timer: 1500, showConfirmButton: false });
      fetchRequests();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message });
    }
  };

  const handleReject = async (id: number) => {
    const { value: note } = await Swal.fire({
      title: "ปฏิเสธคำขอ",
      input: "text",
      inputPlaceholder: "เหตุผล (เช่น ชื่อไม่ตรง)",
      showCancelButton: true,
      confirmButtonText: "ปฏิเสธ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    });
    if (note === undefined) return;
    try {
      await api.post(`/admin/bank-changes/${id}/reject`, { note });
      Swal.fire({ icon: "success", title: "ปฏิเสธแล้ว", timer: 1500, showConfirmButton: false });
      fetchRequests();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message });
    }
  };

  // เทียบชื่อเก่า vs ใหม่
  const nameMatch = (req: any) => {
    const clean = (s: string) => (s || "").replace(/\s+/g, "").toLowerCase();
    return clean(req.old_bank_name) === clean(req.new_bank_name);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>คำขอเปลี่ยนบัญชีธนาคาร</h1>
      <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>ตรวจสอบชื่อบัญชีให้ตรงกับที่สมัครก่อนอนุมัติ</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
        {[["pending", "รอตรวจสอบ"], ["approved", "อนุมัติแล้ว"], ["rejected", "ปฏิเสธ"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer",
              background: filter === val ? "#4f46e5" : "white", color: filter === val ? "white" : "#334155", fontWeight: 600, fontSize: "0.85rem" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>กำลังโหลด...</p>
      ) : requests.length === 0 ? (
        <div style={{ background: "white", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b" }}>ไม่มีคำขอ</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requests.map((req) => {
            const match = nameMatch(req);
            return (
              <div key={req.id} style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{req.user?.username}</span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "10px" }}>{req.user?.phone}</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{new Date(req.created_at).toLocaleString("th-TH")}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "12px" }}>
                    <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase" }}>บัญชีเดิม</p>
                    <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#334155" }}>{req.old_bank_code} - {req.old_bank_account}</p>
                    <p style={{ margin: "2px 0", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{req.old_bank_name || "-"}</p>
                  </div>
                  <div style={{ background: "#eff6ff", borderRadius: "8px", padding: "12px", border: "1px solid #bfdbfe" }}>
                    <p style={{ fontSize: "0.7rem", color: "#3b82f6", margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase" }}>บัญชีใหม่</p>
                    <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#334155" }}>{req.new_bank_code} - {req.new_bank_account}</p>
                    <p style={{ margin: "2px 0", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{req.new_bank_name}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700,
                    background: match ? "#dcfce7" : "#fee2e2", color: match ? "#16a34a" : "#dc2626" }}>
                    {match ? "✓ ชื่อตรงกับที่สมัคร" : "✗ ชื่อไม่ตรง! ตรวจสอบก่อน"}
                  </div>

                  {req.status === "pending" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleReject(req.id)}
                        style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #fecaca", background: "white", color: "#dc2626", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>
                        ปฏิเสธ
                      </button>
                      <button onClick={() => handleApprove(req.id)}
                        style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#16a34a", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>
                        อนุมัติ
                      </button>
                    </div>
                  )}
                  {req.status !== "pending" && (
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: req.status === "approved" ? "#16a34a" : "#dc2626" }}>
                      {req.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"}
                      {req.admin_note && ` (${req.admin_note})`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}