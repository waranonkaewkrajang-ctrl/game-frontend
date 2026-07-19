"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/admin/login", { username, password });

      if (res.data.status === "two_factor_setup_required") {
        setTwoFactorToken(res.data.two_factor_token);
        const encodedUrl = encodeURIComponent(res.data.qr_code_url);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`);
        setStep("2fa");
      } 
      else if (res.data.status === "two_factor_required") {
        setTwoFactorToken(res.data.two_factor_token);
        setQrCodeUrl(""); 
        setStep("2fa");
      } 
      else {
        localStorage.setItem("admin_token", res.data.data.token);
        localStorage.setItem("admin_user", JSON.stringify(res.data.data.admin));
        document.cookie = `admin_token=${res.data.data.token}; path=/; max-age=86400`;
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/admin/verify-2fa", { two_factor_token: twoFactorToken, otp });

      const token = res.data.data.token;
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_user", JSON.stringify(res.data.data.admin));
      document.cookie = `admin_token=${token}; path=/; max-age=86400`;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      router.refresh();
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.response?.data?.message || "รหัส OTP ไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        
        

        <div style={{ background: "white", borderRadius: "1rem", padding: "2.5rem 2rem", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}>
         

         <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img 
  src="/logo.png" 
  alt="Logo" 
  style={{ 
    width: "180px",  // ปรับความกว้างตรงนี้ได้ตามชอบครับ (เช่น 200px - 300px)
    height: "auto",  // ใช้ auto เพื่อให้ความสูงปรับตามอัตราส่วนของรูปภาพ
    margin: "0 auto 1.5rem auto", 
    display: "block" 
  }} 
/>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>เข้าสู่ระบบ</h2>
        </div>

          {step === "login" ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem", display: "block" }}>ชื่อผู้ใช้</label>
                <input className="input" placeholder="กรอกชื่อผู้ใช้" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem", display: "block" }}>รหัสผ่าน</label>
                <input className="input" type="password" placeholder="กรอกรหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.75rem", color: "#dc2626", fontSize: "0.85rem", textAlign: "center" }}>{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontWeight: 600, color: "#0f172a", fontSize: "1.25rem" }}>
                  {qrCodeUrl ? "ตั้งค่า 2FA (ครั้งแรก)" : "ยืนยันตัวตน 2FA"}
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: "1.5" }}>
                  {qrCodeUrl 
                    ? "สแกน QR Code ด้วยแอป Google Authenticator แล้วนำรหัส 6 หลักมากรอกด้านล่าง" 
                    : "กรอกรหัส 6 หลักจาก Google Authenticator"}
                </p>

                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    style={{ margin: "1.5rem auto", display: "block", maxWidth: "160px", borderRadius: "0.5rem", padding: "0.5rem", background: "#f8fafc", border: "1px solid #e2e8f0" }} 
                  />
                )}
              </div>

              <input className="input" style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5em", fontWeight: 700, padding: "1rem" }} placeholder="000000" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
              
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.75rem", color: "#dc2626", fontSize: "0.85rem", textAlign: "center" }}>{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}>
                {loading ? "กำลังยืนยัน..." : "ยืนยัน OTP"}
              </button>
              <button type="button" onClick={() => { setStep("login"); setError(""); }} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, marginTop: "0.5rem" }}>
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}