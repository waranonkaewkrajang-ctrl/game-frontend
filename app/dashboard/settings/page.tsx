"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    site_name: "",
    site_url: "",
    min_deposit: "",
    max_deposit: "",
    min_withdraw: "",
    max_withdraw: "",
    auto_approve_deposit: "false",
    auto_approve_withdraw: "false",
    maintenance_mode: "false",
    line_notify_token: "",
    contact_line: "",
    contact_tel: "",
    cashback_percent: "5",     // ← เพิ่ม
    referral_percent: "1",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [twoFactor, setTwoFactor] = useState({ enabled: false, qr_code: null, secret: "" });
  const [otpConfirm, setOtpConfirm] = useState("");

  useEffect(() => {
    api.get("/admin/settings")
      .then((res) => { setSettings((prev) => ({ ...prev, ...res.data })); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/settings", settings);
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", text: "การตั้งค่าถูกบันทึกแล้ว", timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const res = await api.post("/admin/2fa/enable");
      setTwoFactor(prev => ({ ...prev, qr_code: res.data.data.qr_code_url }));
    } catch (err: any) {
      Swal.fire("ผิดพลาด", "ไม่สามารถเปิดระบบ 2FA ได้", "error");
    }
  };

  // --- จุดที่ 1: แก้ไขให้ส่งเป็น FormData ---
  const handleConfirm2FA = async () => {
    if (!otpConfirm || otpConfirm.length < 6) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกรหัส OTP ให้ครบ 6 หลัก", "warning");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("otp", otpConfirm);

      await api.post("/admin/2fa/confirm", formData);
      Swal.fire("สำเร็จ", "เปิดใช้งาน 2FA เรียบร้อยแล้ว", "success");
      setTwoFactor({ enabled: true, qr_code: null, secret: "" }); 
      setOtpConfirm(""); 
    } catch (err: any) {
      Swal.fire("ผิดพลาด", err.response?.data?.message || "รหัส OTP ไม่ถูกต้อง", "error");
    }
  };
  
  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>;

  const sectionStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1rem" };
  const sectionTitle = (title: string, desc: string) => (
    <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
      <h3 style={{ fontWeight: 600, fontSize: "0.95rem", color: "#0f172a", margin: 0 }}>{title}</h3>
      <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem", margin: "0.25rem 0 0 0" }}>{desc}</p>
    </div>
  );
  const fieldStyle = { marginBottom: "1rem" };
  const labelStyle = { fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" as const };
  const helpStyle = { fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ตั้งค่าระบบ</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>จัดการการตั้งค่าเว็บไซต์ทั้งหมด</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {settings.maintenance_mode === "true" && (
            <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: "0.75rem", fontWeight: 600, padding: "0.3rem 0.75rem", borderRadius: "9999px", border: "1px solid #fecaca" }}>
              ปิดปรับปรุง
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" }}>

          {/* คอลัมน์ซ้าย */}
          <div>
            {/* ข้อมูลเว็บไซต์ */}
            <div style={sectionStyle}>
              {sectionTitle("ข้อมูลเว็บไซต์", "ตั้งค่าชื่อและ URL ของเว็บไซต์")}
              <div style={fieldStyle}>
                <label style={labelStyle}>ชื่อเว็บไซต์</label>
                <input className="input" value={settings.site_name} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} placeholder="เช่น Game Platform" />
                <p style={helpStyle}>ชื่อที่จะแสดงบนหัวเว็บไซต์</p>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>URL เว็บไซต์</label>
                <input className="input" value={settings.site_url} onChange={(e) => setSettings({ ...settings, site_url: e.target.value })} placeholder="https://yourdomain.com" />
              </div>
            </div>

            {/* การฝากเงิน */}
            <div style={sectionStyle}>
              {sectionTitle("การฝากเงิน", "กำหนดยอดฝากขั้นต่ำและสูงสุด")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>ฝากขั้นต่ำ (บาท)</label>
                  <input className="input" type="number" value={settings.min_deposit} onChange={(e) => setSettings({ ...settings, min_deposit: e.target.value })} placeholder="100" />
                </div>
                <div>
                  <label style={labelStyle}>ฝากสูงสุด (บาท)</label>
                  <input className="input" type="number" value={settings.max_deposit} onChange={(e) => setSettings({ ...settings, max_deposit: e.target.value })} placeholder="50000" />
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <label style={labelStyle}>อนุมัติฝากอัตโนมัติ</label>
                <select className="input" value={settings.auto_approve_deposit} onChange={(e) => setSettings({ ...settings, auto_approve_deposit: e.target.value })}>
                  <option value="false">ปิด (ต้อง Admin อนุมัติ)</option>
                  <option value="true">เปิด (อนุมัติอัตโนมัติ)</option>
                </select>
                <p style={helpStyle}>เมื่อเปิด ระบบจะอนุมัติรายการฝากโดยอัตโนมัติ</p>
              </div>
            </div>

            {/* การถอนเงิน */}
            <div style={sectionStyle}>
              {sectionTitle("การถอนเงิน", "กำหนดยอดถอนขั้นต่ำและสูงสุด")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>ถอนขั้นต่ำ (บาท)</label>
                  <input className="input" type="number" value={settings.min_withdraw} onChange={(e) => setSettings({ ...settings, min_withdraw: e.target.value })} placeholder="300" />
                </div>
                <div>
                  <label style={labelStyle}>ถอนสูงสุด (บาท)</label>
                  <input className="input" type="number" value={settings.max_withdraw} onChange={(e) => setSettings({ ...settings, max_withdraw: e.target.value })} placeholder="100000" />
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <label style={labelStyle}>อนุมัติถอนอัตโนมัติ</label>
                <select className="input" value={settings.auto_approve_withdraw} onChange={(e) => setSettings({ ...settings, auto_approve_withdraw: e.target.value })}>
                  <option value="false">ปิด (ต้อง Admin อนุมัติ)</option>
                  <option value="true">เปิด (อนุมัติอัตโนมัติ)</option>
                </select>
                <p style={helpStyle}>เมื่อเปิด ระบบจะอนุมัติรายการถอนโดยอัตโนมัติ</p>
              </div>
            </div>
          </div>

          {/* คอลัมน์ขวา */}
          <div>
            <div style={sectionStyle}>
              {sectionTitle("ความปลอดภัย (2FA)", "ตั้งค่า Google Authenticator")}
              {!twoFactor.qr_code ? (
                <button type="button" className="btn-primary" onClick={handleEnable2FA} style={{ width: "100%" }}>เปิดใช้งาน 2FA</button>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.8rem", marginBottom: "0.5rem", color: "#ef4444" }}>สแกน QR Code แล้วกรอกรหัส 6 หลักเพื่อยืนยัน</p>
                  <img 
  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactor.qr_code)}`} 
  alt="QR Code" 
  style={{ margin: "0 auto 1rem auto", display: "block", maxWidth: "200px" }} 
/>
                  
                  {/* --- จุดที่ 2: ปรับช่องกรอก Input ให้ผูกค่าแน่นหนา และบังคับพิมพ์ได้แค่ตัวเลข --- */}
                  <input 
                    type="text"
                    className="input" 
                    placeholder="000000" 
                    maxLength={6} 
                    value={otpConfirm} 
                    onChange={(e) => setOtpConfirm(e.target.value.replace(/\D/g, ''))} 
                    style={{ marginBottom: "10px", textAlign: "center", letterSpacing: "5px", fontSize: "1.2rem", fontWeight: "bold" }}
                  />
                  {/* ------------------------------------------------------------------- */}

                  <button type="button" className="btn-primary" onClick={handleConfirm2FA} style={{ width: "100%" }}>ยืนยันเปิดใช้งาน</button>
                </div>
              )}
            </div>
            
            {/* การแจ้งเตือน */}
            <div style={sectionStyle}>
              {sectionTitle("การแจ้งเตือน", "ตั้งค่าช่องทางการแจ้งเตือน")}
              <div style={fieldStyle}>
                <label style={labelStyle}>Line Notify Token</label>
                <input className="input" value={settings.line_notify_token} onChange={(e) => setSettings({ ...settings, line_notify_token: e.target.value })} placeholder="กรอก Token จาก Line Notify" />
                <p style={helpStyle}>ใช้สำหรับแจ้งเตือนรายการฝาก-ถอนผ่าน Line</p>
              </div>
            </div>

            {/* ข้อมูลติดต่อ */}
            <div style={sectionStyle}>
              {sectionTitle("ข้อมูลติดต่อ", "ช่องทางติดต่อสำหรับลูกค้า")}
              <div style={fieldStyle}>
                <label style={labelStyle}>Line ID</label>
                <input className="input" value={settings.contact_line} onChange={(e) => setSettings({ ...settings, contact_line: e.target.value })} placeholder="@yourline" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>เบอร์โทรศัพท์</label>
                <input className="input" value={settings.contact_tel} onChange={(e) => setSettings({ ...settings, contact_tel: e.target.value })} placeholder="0812345678" />
              </div>
            </div>

            {/* ตั้งค่ายอดเสีย & แนะนำเพื่อน — เพิ่มตรงนี้ */}
            <div style={sectionStyle}>
              {sectionTitle("ยอดเสีย & แนะนำเพื่อน", "ตั้งค่า % คืนยอดเสียรายวัน และ % ค่าคอมแนะนำเพื่อน")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>% คืนยอดเสีย (Cashback)</label>
                  <input className="input" type="number" step="0.1" value={settings.cashback_percent} onChange={(e) => setSettings({ ...settings, cashback_percent: e.target.value })} placeholder="เช่น 5" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>% ค่าคอมแนะนำเพื่อน (Referral)</label>
                  <input className="input" type="number" step="0.1" value={settings.referral_percent} onChange={(e) => setSettings({ ...settings, referral_percent: e.target.value })} placeholder="เช่น 1" />
                </div>
              </div>
            </div>

            {/* โหมดปิดปรับปรุง */}
            <div style={{ ...sectionStyle, border: settings.maintenance_mode === "true" ? "2px solid #fca5a5" : "1px solid #e2e8f0" }}>
              {sectionTitle("โหมดปิดปรับปรุง", "เมื่อเปิดใช้งาน ลูกค้าจะไม่สามารถเข้าใช้งานเว็บได้")}
              <select className="input" value={settings.maintenance_mode} onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value })}
                style={{ borderColor: settings.maintenance_mode === "true" ? "#fca5a5" : undefined, color: settings.maintenance_mode === "true" ? "#dc2626" : undefined }}>
                <option value="false">ปิด — เว็บใช้งานปกติ</option>
                <option value="true">เปิด — ปิดปรับปรุงระบบ</option>
              </select>
              {settings.maintenance_mode === "true" && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.75rem", marginTop: "0.75rem" }}>
                  <p style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 500, margin: 0 }}>ลูกค้าจะไม่สามารถเข้าใช้งานเว็บไซต์ได้จนกว่าจะปิดโหมดนี้</p>
                </div>
              )}
            </div>

            {/* ปุ่มบันทึก */}
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>กดบันทึกเพื่อใช้งานการตั้งค่าใหม่</p>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: "0.7rem 2.5rem" }}>
                {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}