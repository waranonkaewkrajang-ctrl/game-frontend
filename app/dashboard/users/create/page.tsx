"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Bank {
  bank_code: string;
  bank_account: string;
  bank_name: string;
  is_active: boolean;
}

// รายชื่อธนาคารที่มี logo (ตรงกับไฟล์ใน /public/logos/)
const AVAILABLE_LOGOS = [
  "BAAC", "BAY", "BBL", "CIMBT", "EXIM", "GHB", "GSB", "KBANK",
  "KKP", "KTB", "LHFG", "SCB", "TCD", "TISCO", "TRUEWALLET", "TTB", "UOBT"
];

const BANK_NAMES: Record<string, string> = {
  BAAC: "ธ.ก.ส.", BAY: "กรุงศรีอยุธยา", BBL: "กรุงเทพ", CIMBT: "ซีไอเอ็มบี",
  EXIM: "เอ็กซิม", GHB: "อาคารสงเคราะห์", GSB: "ออมสิน", KBANK: "กสิกรไทย",
  KKP: "เกียรตินาคินภัทร", KTB: "กรุงไทย", LHFG: "แลนด์แอนด์เฮ้าส์",
  SCB: "ไทยพาณิชย์", TCD: "ไทยเครดิต", TISCO: "ทิสโก้",
  TRUEWALLET: "ทรูวอลเล็ท", TTB: "ทีทีบี", UOBT: "ยูโอบี"
};

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // ดึงรายการธนาคารจาก settings (ถ้ามี) — ถ้าไม่มีใช้ AVAILABLE_LOGOS
  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      try {
        const data = res.data.data;
        const parsed = JSON.parse(data.deposit_banks || "[]");
        const active = parsed.filter((b: Bank) => b.is_active);
        setBanks(active);
      } catch {}
    }).catch(() => {});
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // สุ่ม password 8 ตัว
  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pw = "";
    for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, password: pw, password_confirmation: pw }));
    setShowPassword(true);
  };

  const bankOptions = banks.length > 0
    ? banks.map(b => ({ code: b.bank_code, name: b.bank_name || BANK_NAMES[b.bank_code] || b.bank_code }))
    : AVAILABLE_LOGOS.map(code => ({ code, name: BANK_NAMES[code] || code }));

  const selectedBank = bankOptions.find(b => b.code === form.bank_code);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      Swal.fire({ icon: "warning", title: "รหัสผ่านไม่ตรงกัน" });
      return;
    }
    if (!form.bank_code) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกธนาคาร" });
      return;
    }

    setLoading(true);
    try {
      const { password_confirmation, ...payload } = form;
      await api.post("/admin/users", payload);

      Swal.fire({
        icon: "success",
        title: "สมัครสมาชิกสำเร็จ",
        html: `
          <div style="text-align:left;background:#f8fafc;padding:14px;border-radius:8px;margin-top:10px;border:1px solid #e2e8f0;">
            <div style="margin-bottom:6px;color:#334155;"><strong>Username:</strong> ${form.username}</div>
            <div style="margin-bottom:6px;color:#334155;"><strong>Password:</strong> ${form.password}</div>
            <div style="color:#334155;"><strong>เบอร์โทร:</strong> ${form.phone}</div>
          </div>
          <div style="color:#64748b;font-size:0.75rem;margin-top:12px;">อย่าลืม copy ข้อมูลส่งให้ลูกค้า</div>
        `,
        showCancelButton: true,
        confirmButtonText: "Copy ข้อมูล",
        cancelButtonText: "กลับไปรายชื่อ",
        confirmButtonColor: "#16a34a",
      }).then((result) => {
        if (result.isConfirmed) {
          const text = `Username: ${form.username}\nPassword: ${form.password}\nเบอร์: ${form.phone}`;
          navigator.clipboard.writeText(text);
          Swal.fire({ icon: "success", title: "Copy แล้ว", timer: 1200, showConfirmButton: false });
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
          สมัครสมาชิกให้ลูกค้า
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
          กรอกข้อมูลลูกค้า ระบบจะสร้างบัญชีให้อัตโนมัติ
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ข้อมูลผู้ใช้ */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginTop: 0, marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
            ข้อมูลผู้ใช้
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Username" required value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="อย่างน้อย 4 ตัว" />
            <Field label="เบอร์โทร" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "") })} placeholder="0812345678" maxLength={10} />
          </div>

          <div style={{ marginTop: "14px" }}>
            <Field label="ชื่อ-นามสกุล" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="ไม่บังคับ" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "14px", alignItems: "end", marginTop: "14px" }}>
            <Field label="Password" required value={form.password} onChange={(v) => setForm({ ...form, password: v })} type={showPassword ? "text" : "password"} placeholder="อย่างน้อย 6 ตัว" />
            <Field label="ยืนยันรหัส" required value={form.password_confirmation} onChange={(v) => setForm({ ...form, password_confirmation: v })} type={showPassword ? "text" : "password"} />
            <button
              type="button"
              onClick={generatePassword}
              style={{
                padding: "10px 18px", borderRadius: "8px", border: "none",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                boxShadow: "0 2px 6px rgba(124,58,237,0.4)",
              }}
            >
              สุ่มรหัส
            </button>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "0.8rem", color: "#64748b", cursor: "pointer" }}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            แสดงรหัสผ่าน
          </label>
        </div>

        {/* บัญชีธนาคาร */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginTop: 0, marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
            บัญชีธนาคาร
          </h3>

          {/* Custom Dropdown */}
          <div style={{ marginBottom: "14px", position: "relative" }} ref={dropdownRef}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              ธนาคาร <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => setBankDropdownOpen(o => !o)}
              style={{
                width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1",
                borderRadius: "8px", background: "white", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "10px",
                fontSize: "0.9rem", color: "#1e293b", textAlign: "left",
              }}
            >
              {selectedBank ? (
                <>
                  <img
                    src={`/logos/${selectedBank.code}.webp`}
                    alt={selectedBank.code}
                    style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "4px" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span style={{ flex: 1 }}>{selectedBank.code} — {selectedBank.name}</span>
                </>
              ) : (
                <span style={{ flex: 1, color: "#94a3b8" }}>-- เลือกธนาคาร --</span>
              )}
              <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>▼</span>
            </button>

            {bankDropdownOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px",
                background: "white", border: "1px solid #cbd5e1", borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: "320px", overflowY: "auto",
                zIndex: 100,
              }}>
                {bankOptions.map((b) => (
                  <div
                    key={b.code}
                    onClick={() => {
                      setForm({ ...form, bank_code: b.code });
                      setBankDropdownOpen(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9",
                      background: form.bank_code === b.code ? "#f0fdf4" : "white",
                    }}
                    onMouseEnter={(e) => { if (form.bank_code !== b.code) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { if (form.bank_code !== b.code) e.currentTarget.style.background = "white"; }}
                  >
                    <img
                      src={`/logos/${b.code}.webp`}
                      alt={b.code}
                      style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "4px" }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span style={{ flex: 1, fontSize: "0.88rem", color: "#334155" }}>
                      <strong>{b.code}</strong> — {b.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="ชื่อบัญชี" required value={form.bank_name} onChange={(v) => setForm({ ...form, bank_name: v })} placeholder="ชื่อ-สกุลตามบัญชี" />
            <Field label="เลขบัญชี" required value={form.bank_account} onChange={(v) => setForm({ ...form, bank_account: v.replace(/\D/g, "") })} placeholder="1234567890" />
          </div>
        </div>

        {/* Referral */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
          <Field label="รหัสอ้างอิง" value={form.referral_code} onChange={(v) => setForm({ ...form, referral_code: v.toUpperCase() })} placeholder="ไม่บังคับ" />
        </div>

        {/* ปุ่ม */}
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
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", maxLength, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; maxLength?: number; required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
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