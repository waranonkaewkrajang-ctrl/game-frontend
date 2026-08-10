"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Bank {
  bank_code: string;
  bank_account: string;
  bank_name: string;
  is_active: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    password_confirmation: "",
    full_name: "",
    bank_code: "",
    bank_account: "",
    bank_name: "",
    referral_code: "",
  });

  // ดึงรายการธนาคารจาก finance settings
  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      try {
        const data = res.data.data;
        const parsed = JSON.parse(data.deposit_banks || "[]");
        setBanks(parsed.filter((b: Bank) => b.is_active));
      } catch {
        setBanks([]);
      }
    }).catch(() => {});
  }, []);

  // 🎲 สุ่ม password 8 ตัว
  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pw = "";
    for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, password: pw, password_confirmation: pw }));
    setShowPassword(true);
    Swal.fire({ icon: "success", title: "สุ่มรหัสผ่านแล้ว", text: pw, timer: 2500, showConfirmButton: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      Swal.fire({ icon: "warning", title: "รหัสผ่านไม่ตรงกัน" });
      return;
    }

    setLoading(true);
    try {
      const { password_confirmation, ...payload } = form;
      const res = await api.post("/admin/users", payload);

      Swal.fire({
        icon: "success",
        title: "สมัครสมาชิกสำเร็จ 🎉",
        html: `
          <div style="text-align:left;background:#f8fafc;padding:14px;border-radius:8px;margin-top:10px;">
            <div style="margin-bottom:6px;"><strong>Username:</strong> ${form.username}</div>
            <div style="margin-bottom:6px;"><strong>Password:</strong> ${form.password}</div>
            <div><strong>เบอร์โทร:</strong> ${form.phone}</div>
          </div>
          <div style="color:#64748b;font-size:0.75rem;margin-top:12px;">📋 อย่าลืม copy ข้อมูลส่งให้ลูกค้า</div>
        `,
        showCancelButton: true,
        confirmButtonText: "📋 Copy ข้อมูล",
        cancelButtonText: "กลับไปรายชื่อ",
        confirmButtonColor: "#16a34a",
      }).then((result) => {
        if (result.isConfirmed) {
          const text = `Username: ${form.username}\nPassword: ${form.password}\nเบอร์: ${form.phone}`;
          navigator.clipboard.writeText(text);
          Swal.fire({ icon: "success", title: "Copy แล้ว!", timer: 1200, showConfirmButton: false });
          setTimeout(() => router.push("/dashboard/users"), 1300);
        } else {
          router.push("/dashboard/users");
        }
      });
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0] as string[] : null;
      Swal.fire({
        icon: "error",
        title: "สมัครไม่สำเร็จ",
        text: firstError?.[0] || err.response?.data?.message || "เกิดข้อผิดพลาด",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
          ➕ สมัครสมาชิกให้ลูกค้า
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
          กรอกข้อมูลลูกค้า ระบบจะสร้างบัญชีให้อัตโนมัติ
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ─────── ข้อมูลผู้ใช้ ─────── */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginTop: 0, marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
            👤 ข้อมูลผู้ใช้
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Username *" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="อย่างน้อย 4 ตัว" />
            <Field label="เบอร์โทร *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "") })} placeholder="0812345678" maxLength={10} />
          </div>

          <div style={{ marginTop: "14px" }}>
            <Field label="ชื่อ-นามสกุล (ไม่บังคับ)" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "14px", alignItems: "end", marginTop: "14px" }}>
            <Field label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type={showPassword ? "text" : "password"} placeholder="อย่างน้อย 6 ตัว" />
            <Field label="ยืนยันรหัส *" value={form.password_confirmation} onChange={(v) => setForm({ ...form, password_confirmation: v })} type={showPassword ? "text" : "password"} />
            <button
              type="button"
              onClick={generatePassword}
              style={{
                padding: "9px 14px", borderRadius: "8px", border: "none",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                boxShadow: "0 2px 6px rgba(124,58,237,0.4)",
              }}
            >
              🎲 Auto
            </button>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "0.8rem", color: "#64748b", cursor: "pointer" }}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            แสดงรหัสผ่าน
          </label>
        </div>

        {/* ─────── บัญชีธนาคาร ─────── */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginTop: 0, marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
            🏦 บัญชีธนาคาร
          </h3>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>ธนาคาร *</label>
            <select
              value={form.bank_code}
              onChange={(e) => setForm({ ...form, bank_code: e.target.value })}
              required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", background: "white" }}
            >
              <option value="">-- เลือกธนาคาร --</option>
              {banks.length > 0 ? (
                banks.map((b) => (
                  <option key={b.bank_code} value={b.bank_code}>{b.bank_code} - {b.bank_name}</option>
                ))
              ) : (
                // Fallback ถ้าโหลด API ไม่ได้
                ["SCB", "KBANK", "BAY", "KTB", "TTB", "BBL", "GSB", "KKB"].map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="ชื่อบัญชี *" value={form.bank_name} onChange={(v) => setForm({ ...form, bank_name: v })} placeholder="ชื่อ-สกุลตามบัญชี" />
            <Field label="เลขบัญชี *" value={form.bank_account} onChange={(v) => setForm({ ...form, bank_account: v.replace(/\D/g, "") })} placeholder="1234567890" />
          </div>
        </div>

        {/* ─────── Referral ─────── */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
          <Field label="รหัสอ้างอิง (ไม่บังคับ)" value={form.referral_code} onChange={(v) => setForm({ ...form, referral_code: v.toUpperCase() })} placeholder="ROG12345" />
        </div>

        {/* ─────── ปุ่ม ─────── */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => router.push("/dashboard/users")}
            style={{ padding: "10px 24px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#475569", fontWeight: 600, cursor: "pointer" }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 28px",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #16a34a, #15803d)",
              border: "none", borderRadius: "8px", color: "white", fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 2px 6px rgba(22,163,74,0.4)",
            }}
          >
            {loading ? "กำลังสมัคร..." : "➕ สมัครสมาชิก"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────── Input Field Component ───────────────────
function Field({ label, value, onChange, type = "text", placeholder = "", maxLength }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; maxLength?: number;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box" }}
      />
    </div>
  );
}