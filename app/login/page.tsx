"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="lg-page">
      <div className="lg-glow lg-glow-1" />
      <div className="lg-glow lg-glow-2" />
      <div className="lg-grid" />

      <div className="lg-wrap">
        <div className="lg-card">
          <div className="lg-head">
            <img
              src="/admin-logo.png"
              alt="NEXA Admin"
              className="lg-logo"
              onError={(e) => { e.currentTarget.src = "/logo.png"; }}
            />
            <div className="lg-divider"><span /></div>
            <h1 className="lg-title">{step === "login" ? "เข้าสู่ระบบ" : qrCodeUrl ? "ตั้งค่า 2FA (ครั้งแรก)" : "ยืนยันตัวตน 2FA"}</h1>
            <p className="lg-sub">
              {step === "login"
                ? "ระบบจัดการหลังบ้าน สำหรับเจ้าหน้าที่เท่านั้น"
                : qrCodeUrl
                  ? "สแกน QR Code ด้วยแอป Google Authenticator แล้วนำรหัส 6 หลักมากรอกด้านล่าง"
                  : "กรอกรหัส 6 หลักจาก Google Authenticator"}
            </p>
          </div>

          {step === "login" ? (
            <form onSubmit={handleLogin} className="lg-form">
              <label className="lg-field">
                <span className="lg-label">ชื่อผู้ใช้</span>
                <span className="lg-input-wrap">
                  <User size={17} className="lg-icon" />
                  <input className="lg-input" placeholder="กรอกชื่อผู้ใช้" autoComplete="username"
                    value={username} onChange={(e) => setUsername(e.target.value)} required />
                </span>
              </label>

              <label className="lg-field">
                <span className="lg-label">รหัสผ่าน</span>
                <span className="lg-input-wrap">
                  <Lock size={17} className="lg-icon" />
                  <input className="lg-input" type={showPassword ? "text" : "password"} placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="lg-eye" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              {error && <div className="lg-error">{error}</div>}

              <button type="submit" className="lg-btn" disabled={loading}>
                {loading ? <><Loader2 size={18} className="lg-spin" /> กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="lg-form">
              {qrCodeUrl && (
                <div className="lg-qr"><img src={qrCodeUrl} alt="QR Code" /></div>
              )}

              <span className="lg-input-wrap">
                <ShieldCheck size={18} className="lg-icon" />
                <input className="lg-input lg-otp" placeholder="000000" inputMode="numeric" autoComplete="one-time-code"
                  autoFocus maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
              </span>

              {error && <div className="lg-error">{error}</div>}

              <button type="submit" className="lg-btn" disabled={loading}>
                {loading ? <><Loader2 size={18} className="lg-spin" /> กำลังยืนยัน...</> : "ยืนยัน OTP"}
              </button>

              <button type="button" className="lg-back" onClick={() => { setStep("login"); setError(""); setOtp(""); }}>
                <ArrowLeft size={15} /> กลับไปหน้าเข้าสู่ระบบ
              </button>
            </form>
          )}
        </div>

        <p className="lg-foot">© {new Date().getFullYear()} NEXA Admin · การเข้าใช้งานทุกครั้งถูกบันทึก</p>
      </div>

      <style>{`
        .lg-page { position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:1.25rem; overflow:hidden;
          background: radial-gradient(1200px 600px at 10% -10%, #1d3fd6 0%, transparent 60%),
                      radial-gradient(900px 500px at 110% 110%, #0e1aa3 0%, transparent 55%),
                      linear-gradient(160deg, #081033 0%, #0b1a5c 55%, #081033 100%); }
        .lg-glow { position:absolute; border-radius:50%; filter:blur(80px); opacity:.55; pointer-events:none; }
        .lg-glow-1 { width:420px; height:420px; background:#2563eb; top:-120px; left:-100px; animation:lgFloat 12s ease-in-out infinite; }
        .lg-glow-2 { width:360px; height:360px; background:#f5b301; bottom:-140px; right:-80px; opacity:.28; animation:lgFloat 14s ease-in-out infinite reverse; }
        .lg-grid { position:absolute; inset:0; pointer-events:none; opacity:.07;
          background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
          background-size: 44px 44px; mask-image: radial-gradient(circle at 50% 45%, black 20%, transparent 70%); -webkit-mask-image: radial-gradient(circle at 50% 45%, black 20%, transparent 70%); }
        .lg-wrap { position:relative; z-index:1; width:100%; max-width:420px; animation:lgIn .45s ease-out; }
        .lg-card { background:rgba(255,255,255,.97); border-radius:20px; padding:2.25rem 2rem 2rem;
          box-shadow: 0 30px 60px -20px rgba(2,6,23,.6), 0 0 0 1px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.9);
          border-top:3px solid #f5b301; }
        .lg-head { text-align:center; margin-bottom:1.6rem; }
        .lg-logo { width:250px; max-width:80%; height:auto; display:block; margin:0 auto; filter:drop-shadow(0 6px 12px rgba(17,32,190,.18)); }
        .lg-divider { display:flex; justify-content:center; margin:1.1rem 0 .9rem; }
        .lg-divider span { width:48px; height:3px; border-radius:3px; background:linear-gradient(90deg,#1120be,#f5b301); }
        .lg-title { font-size:1.4rem; font-weight:800; color:#0f172a; margin:0; letter-spacing:-.01em; }
        .lg-sub { font-size:.84rem; color:#64748b; margin:.4rem 0 0; line-height:1.55; }
        .lg-form { display:flex; flex-direction:column; gap:1.05rem; }
        .lg-field { display:flex; flex-direction:column; gap:.45rem; }
        .lg-label { font-size:.82rem; font-weight:600; color:#334155; }
        .lg-input-wrap { position:relative; display:flex; align-items:center; }
        .lg-icon { position:absolute; left:14px; color:#94a3b8; pointer-events:none; transition:color .15s; }
        .lg-input { width:100%; height:48px; padding:0 44px 0 42px; border:1.5px solid #e2e8f0; border-radius:12px; background:#f8fafc;
          font-size:.95rem; color:#0f172a; outline:none; transition:border-color .15s, box-shadow .15s, background .15s; font-family:inherit; }
        .lg-input::placeholder { color:#94a3b8; }
        .lg-input:focus { border-color:#1120be; background:white; box-shadow:0 0 0 4px rgba(17,32,190,.12); }
        .lg-input-wrap:focus-within .lg-icon { color:#1120be; }
        .lg-eye { position:absolute; right:10px; background:none; border:none; color:#94a3b8; cursor:pointer; padding:6px; display:flex; border-radius:8px; }
        .lg-eye:hover { color:#334155; background:#f1f5f9; }
        .lg-otp { height:58px; text-align:center; font-size:1.6rem; font-weight:800; letter-spacing:.55em; padding-left:48px; padding-right:12px; }
        .lg-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; border-radius:10px; padding:.7rem .85rem; font-size:.84rem; text-align:center; animation:lgShake .35s; }
        .lg-btn { height:50px; margin-top:.35rem; border:none; border-radius:12px; cursor:pointer; color:white; font-size:.98rem; font-weight:700;
          display:flex; align-items:center; justify-content:center; gap:.5rem; font-family:inherit;
          background:linear-gradient(135deg,#1d3fd6 0%,#1120be 55%,#0b1680 100%);
          box-shadow:0 10px 20px -8px rgba(17,32,190,.6), inset 0 1px 0 rgba(255,255,255,.25); transition:transform .12s, box-shadow .15s, filter .15s; }
        .lg-btn:hover:not(:disabled) { filter:brightness(1.08); box-shadow:0 14px 26px -8px rgba(17,32,190,.7), inset 0 -2px 0 #f5b301; }
        .lg-btn:active:not(:disabled) { transform:translateY(1px); }
        .lg-btn:disabled { opacity:.75; cursor:not-allowed; }
        .lg-spin { animation:lgSpin .8s linear infinite; }
        .lg-qr { display:flex; justify-content:center; }
        .lg-qr img { width:170px; height:170px; padding:10px; background:white; border:1.5px solid #e2e8f0; border-radius:14px; box-shadow:0 8px 20px -10px rgba(15,23,42,.25); }
        .lg-back { display:flex; align-items:center; justify-content:center; gap:.35rem; background:none; border:none; color:#1120be; font-weight:600; font-size:.84rem; cursor:pointer; padding:.4rem; font-family:inherit; }
        .lg-back:hover { text-decoration:underline; }
        .lg-foot { text-align:center; color:rgba(226,232,240,.6); font-size:.75rem; margin:1.25rem 0 0; }
        @keyframes lgIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes lgFloat { 0%,100% { transform:translate(0,0) } 50% { transform:translate(30px,20px) } }
        @keyframes lgSpin { to { transform:rotate(360deg) } }
        @keyframes lgShake { 0%,100% { transform:translateX(0) } 25% { transform:translateX(-5px) } 75% { transform:translateX(5px) } }
        @media (max-width:480px) {
          .lg-card { padding:1.75rem 1.25rem 1.5rem; border-radius:16px; }
          .lg-logo { width:210px; }
          .lg-title { font-size:1.25rem; }
        }
      `}</style>
    </div>
  );
}