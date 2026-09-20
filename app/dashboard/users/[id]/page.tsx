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
  const [turnover, setTurnover] = useState<any>(null);
  const [topGames, setTopGames] = useState<any>(null);
  const [gameSort, setGameSort] = useState<"rounds" | "bet">("rounds");
  const [turnoverOpen, setTurnoverOpen] = useState(false);

  const bankIcons: Record<string, string> = {
    KBANK: "/logos/KBANK.webp", SCB: "/logos/SCB.webp", KTB: "/logos/KTB.webp",
    BBL: "/logos/BBL.webp", BAY: "/logos/BAY.webp", GSB: "/logos/GSB.webp",
    BAAC: "/logos/BAAC.webp", CIMBT: "/logos/CIMBT.webp", GHB: "/logos/GHB.webp",
    KKP: "/logos/KKP.webp", LHFG: "/logos/LHFG.webp", TISCO: "/logos/TISCO.webp",
    TTB: "/logos/TTB.webp", TCD: "/logos/TCD.webp", EXIM: "/logos/EXIM.webp",
    UOBT: "/logos/UOBT.webp", TRUEWALLET: "/logos/TRUEWALLET.webp",
  };

  const bankNames: Record<string, string> = {
    KBANK: "กสิกรไทย", SCB: "ไทยพาณิชย์", KTB: "กรุงไทย", BBL: "กรุงเทพ",
    BAY: "กรุงศรี", GSB: "ออมสิน", BAAC: "ธ.ก.ส.", CIMBT: "ซีไอเอ็มบี",
    GHB: "อาคารสงเคราะห์", KKP: "เกียรตินาคินภัทร", LHFG: "แลนด์แอนด์เฮ้าส์",
    TISCO: "ทิสโก้", TTB: "ทีทีบี", TCD: "ไทยเครดิต", EXIM: "เอ็กซิมแบงก์",
    UOBT: "ยูโอบี", TRUEWALLET: "TrueMoney Wallet",
  };
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const handleEdit = (field: string, currentValue: string) => {
    setEditing(field);
    setEditValue(currentValue || "");
  };

  const handleResetPassword = async () => {
    const { value: newPass } = await Swal.fire({
      title: "รีเซ็ตรหัสผ่าน",
      html: `<p style="font-size:14px;color:#64748b;margin:0 0 12px">ตั้งรหัสผ่านใหม่ให้ <b>${user.username}</b></p>`,
      input: "text",
      inputPlaceholder: "รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)",
      inputValue: Math.random().toString(36).slice(-8),
      showCancelButton: true,
      confirmButtonText: "รีเซ็ต",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f59e0b",
      inputValidator: (v) => (!v || v.length < 6 ? "รหัสผ่านอย่างน้อย 6 ตัว" : null),
    });
    if (!newPass) return;
    try {
      await api.post(`/admin/users/${user.id}/reset-password`, { password: newPass });
      await Swal.fire({
        title: "รีเซ็ตสำเร็จ!",
        html: `<div style="text-align:left;background:#f8fafc;border-radius:8px;padding:16px;font-size:14px">
          <p style="margin:0 0 8px"><b>Username:</b> <span style="color:#0f172a">${user.username}</span></p>
          <p style="margin:0"><b>รหัสผ่านใหม่:</b> <span style="color:#dc2626;font-weight:700">${newPass}</span></p>
        </div>
        <p style="font-size:12px;color:#94a3b8;margin:12px 0 0">คัดลอกส่งให้ลูกค้าได้เลย</p>`,
        icon: "success",
        confirmButtonText: "คัดลอกข้อมูล",
        confirmButtonColor: "#22c55e",
        showCancelButton: true,
        cancelButtonText: "ปิด",
      }).then((r) => {
        if (r.isConfirmed) {
          navigator.clipboard.writeText(`Username: ${user.username}\nรหัสผ่าน: ${newPass}`);
          Swal.fire({ text: "คัดลอกแล้ว", toast: true, position: "top", timer: 1500, showConfirmButton: false });
        }
      });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "ลองใหม่" });
    }
  };

  const randomPassword = () => setPasswordValue(Math.random().toString(36).slice(-8));

  const openPasswordEdit = () => {
    setPasswordValue(Math.random().toString(36).slice(-8));
    setShowPasswordInput(true);
  };

  const savePassword = async () => {
    if (!passwordValue || passwordValue.length < 6) {
      Swal.fire({ icon: "warning", title: "รหัสสั้นไป", text: "อย่างน้อย 6 ตัว" });
      return;
    }
    try {
      await api.post(`/admin/users/${user.id}/reset-password`, { password: passwordValue });
      setShowPasswordInput(false);
      Swal.fire({
        title: "รีเซ็ตสำเร็จ!",
        html: `<div style="text-align:left;background:#f8fafc;border-radius:8px;padding:16px;font-size:14px">
          <p style="margin:0 0 8px"><b>Username:</b> ${user.username}</p>
          <p style="margin:0"><b>รหัสผ่าน:</b> <span style="color:#dc2626;font-weight:700">${passwordValue}</span></p></div>`,
        icon: "success",
        confirmButtonText: "คัดลอกส่งลูกค้า",
        confirmButtonColor: "#22c55e",
        showCancelButton: true,
        cancelButtonText: "ปิด",
      }).then((r) => {
        if (r.isConfirmed) {
          navigator.clipboard.writeText(`Username: ${user.username}\nรหัสผ่าน: ${passwordValue}`);
          Swal.fire({ text: "คัดลอกแล้ว", toast: true, position: "top", timer: 1500, showConfirmButton: false });
        }
      });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "ลองใหม่" });
    }
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
    api.get(`/admin/users/${userId}/turnover`).then((res) => setTurnover(res.data.data)).catch(() => {});
    api.get(`/admin/users/${userId}/top-games`, { params: { sort: gameSort, limit: 10 } })
      .then((res) => setTopGames(res.data.data)).catch(() => {});
    api.get(`/admin/users/${userId}`).then((res) => {
      setUser(res.data.data);
      setLoading(false);
    }).catch(() => {
      Swal.fire({ icon: "error", title: "ไม่พบข้อมูลสมาชิก" });
      setLoading(false);
    });
  }, [userId, gameSort]);

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
            <span style={{ color: "#64748b", fontSize: "0.85rem" }}>แก้ไขพาสเวิร์ด</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {!showPasswordInput ? (
                <button onClick={openPasswordEdit} title="แก้ไขพาสเวิร์ด" style={{ background: "#dcfce7", color: "#16a34a", border: "none", borderRadius: "0.375rem", padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                  </button>
              ) : (
                <>
                  <input value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)} style={{ padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem", fontSize: "0.85rem", width: "130px" }} autoFocus />
                  <button onClick={randomPassword} title="สุ่มรหัสใหม่" style={{ background: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "0.25rem", padding: "0.35rem", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>
                  <button onClick={savePassword} title="บันทึก" style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.35rem", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                  <button onClick={() => setShowPasswordInput(false)} title="ยกเลิก" style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.35rem", cursor: "pointer", display: "flex", alignItems: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </>
              )}
            </div>
          </div>
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
                    {item.field === "bank_code" ? (
                      <div style={{ position: "relative", width: "200px" }}>
                        <div onClick={() => setBankDropdownOpen(!bankDropdownOpen)} style={{ padding: "0.3rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem", fontSize: "0.85rem", background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {editValue && bankIcons[editValue] && <img src={bankIcons[editValue]} alt="" width={18} height={18} style={{ borderRadius: "3px" }} />}
                          {editValue ? `${editValue} - ${bankNames[editValue] || ""}` : "-- เลือกธนาคาร --"}
                        </div>
                        {bankDropdownOpen && (
                          <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", background: "white", border: "1px solid #d1d5db", borderRadius: "0.25rem", maxHeight: "200px", overflowY: "auto", zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                            {Object.entries(bankIcons).map(([code, icon]) => (
                              <div key={code} onClick={() => { setEditValue(code); setBankDropdownOpen(false); }}
                                style={{ padding: "0.4rem 0.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", borderBottom: "1px solid #f1f5f9" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                                <img src={icon} alt="" width={20} height={20} style={{ borderRadius: "3px" }} />
                                <span style={{ fontWeight: 600 }}>{code}</span>
                                <span style={{ color: "#64748b" }}>{bankNames[code]}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem", fontSize: "0.85rem", width: "150px" }} autoFocus />
                    )}
                    <button onClick={() => handleSave(item.field)} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>✓</button>
                    <button onClick={() => setEditing(null)} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "0.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: item.label.includes("ยอด") ? "#10b981" : "#0f172a", fontSize: "0.85rem", fontWeight: item.label.includes("ยอด") ? 700 : 500 }}>
                      {item.field === "bank_code" && bankIcons[item.value] && <img src={bankIcons[item.value]} alt="" width={18} height={18} style={{ borderRadius: "3px" }} />}
                      {item.value}
                    </span>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" }}>

            {/* Card: เกมที่เล่นบ่อย */}
      {topGames?.games?.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                เกมที่เล่นบ่อย ({topGames.games.length} อันดับ)
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>
                รวม {topGames.total_rounds.toLocaleString("th-TH")} รอบ · ฿{fmt(topGames.total_bet)}
              </p>
            </div>
            <select
              className="input"
              style={{ width: "165px", flex: "0 0 auto", fontSize: "0.8rem" }}
              value={gameSort}
              onChange={(e) => setGameSort(e.target.value as "rounds" | "bet")}
            >
              <option value="rounds">จำนวนครั้งที่เล่น</option>
              <option value="bet">ยอดเดิมพัน</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {topGames.games.map((g: any, i: number) => (
              <div key={`${g.provider}-${g.game_id}`} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 0",
                borderBottom: i === topGames.games.length - 1 ? "none" : "1px solid #f8fafc",
              }}>
                <span style={{
                  width: 24, textAlign: "center", flexShrink: 0,
                  fontSize: "0.82rem", fontWeight: 700,
                  color: i < 3 ? "#0f172a" : "#94a3b8",
                }}>{i + 1}</span>

                <div style={{
                  width: 38, height: 38, borderRadius: "0.4rem", flexShrink: 0,
                  background: "#f1f5f9", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {g.image_url ? (
                    <img src={g.image_url} alt="" width={38} height={38} style={{ objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600 }}>
                      {g.provider.slice(0, 3)}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.85rem", fontWeight: 600, color: "#0f172a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{g.game_name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{g.provider}</div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2563eb" }}>
                    {gameSort === "rounds" ? g.rounds.toLocaleString("th-TH") : `฿${fmt(g.total_bet)}`}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    {gameSort === "rounds" ? "ครั้ง" : `${g.rounds} ครั้ง`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

            {/* Card: เทิร์นโอเวอร์ */}
      {turnover && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

          {/* Header */}
          <div
            onClick={() => setTurnoverOpen(!turnoverOpen)}
            style={{
              background: turnover.can_withdraw
                ? "linear-gradient(135deg, #0284c7, #38bdf8)"
                : "linear-gradient(135deg, #b45309, #f59e0b)",
              padding: "0.9rem 1.1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "white", margin: 0 }}>
                เทิร์นโอเวอร์ &amp; โบนัส
              </h3>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.85)", margin: "0.15rem 0 0" }}>
                {turnover.can_withdraw
                  ? "ไม่ติดเงื่อนไข ถอนได้ปกติ"
                  : `ต้องทำอีก ฿${fmt(turnover.total_remaining)}`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
              <span style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "0.3rem 0.7rem",
                borderRadius: "0.4rem",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}>
                {turnover.can_withdraw ? "ถอนได้" : "ติดเทิร์น"}
              </span>
              <span style={{
                color: "white",
                fontSize: "0.9rem",
                transform: turnoverOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>▾</span>
            </div>
          </div>

          {turnoverOpen && (
          <div style={{ padding: "1.25rem" }}>

            {/* สรุปตัวเลข */}
            {turnover.claims.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "โบนัสที่ได้รับ", value: `฿${fmt(turnover.claims.reduce((s: number, c: any) => s + (c.status === "active" ? c.bonus_amount : 0), 0))}`, color: "#0f172a" },
                  { label: "เดิมพันสะสม", value: `฿${fmt(turnover.bet_total)}`, color: "#2563eb" },
                  { label: "คงเหลือต้องทำ", value: `฿${fmt(turnover.total_remaining)}`, color: turnover.total_remaining > 0 ? "#dc2626" : "#16a34a" },
                  { label: "รายการทั้งหมด", value: `${turnover.claims.length}`, color: "#7c3aed" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.85rem 1rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.35rem", fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* รายการเทิร์น */}
            {turnover.claims.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                ยังไม่มีประวัติโบนัสหรือเทิร์นโอเวอร์
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {turnover.claims.map((c: any) => {
                  const sMap: Record<string, { bg: string; color: string; label: string }> = {
                    active:    { bg: "#fef9c3", color: "#854d0e", label: "กำลังทำเทิร์น" },
                    completed: { bg: "#dcfce7", color: "#166534", label: "ทำครบแล้ว" },
                    cancelled: { bg: "#e0e7ff", color: "#3730a3", label: "ยกเลิกโดยแอดมิน" },
                    expired:   { bg: "#f1f5f9", color: "#64748b", label: "หมดอายุ" },
                  };
                  const st = sMap[c.status] || { bg: "#f1f5f9", color: "#64748b", label: c.status };
                  const isActive = c.status === "active";

                  return (
                    <div key={c.id} style={{
                      border: isActive ? "1px solid #fcd34d" : "1px solid #e2e8f0",
                      background: isActive ? "#fffbeb" : "#ffffff",
                      borderRadius: "0.625rem",
                      padding: "1rem 1.25rem",
                    }}>
                      {/* บรรทัดบน */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>฿{fmt(c.bonus_amount)}</span>
                            <span style={{ padding: "0.2rem 0.6rem", borderRadius: "0.3rem", fontSize: "0.72rem", fontWeight: 600, background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                              {c.source_name || c.type}
                            </span>
                          <span style={{ padding: "0.25rem 0.7rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700, background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                          {c.is_expired && isActive && (
                            <span style={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 600 }}>เลยกำหนดแล้ว</span>
                          )}
                          </div>
                          {c.source_detail && c.source_detail !== c.source_name && (
                            <span style={{ fontSize: "0.73rem", color: "#94a3b8" }}>{c.source_detail}</span>
                          )}
                        </div>

                        {isActive && (
                          <button
                            onClick={async () => {
                              const r = await Swal.fire({
                                title: "ยืนยันยกเลิกเทิร์น",
                                html: `<div style="text-align:left;background:#f8fafc;border-radius:8px;padding:14px;font-size:13.5px;line-height:1.7">
                                  <div style="display:flex;justify-content:space-between"><span style="color:#64748b">โบนัส</span><b>฿${fmt(c.bonus_amount)}</b></div>
                                  <div style="display:flex;justify-content:space-between"><span style="color:#64748b">เทิร์นที่ต้องทำ</span><b>฿${fmt(c.turnover_required)}</b></div>
                                  <div style="display:flex;justify-content:space-between"><span style="color:#64748b">ทำไปแล้ว</span><b style="color:#2563eb">฿${fmt(c.turnover_current)}</b></div>
                                  <div style="display:flex;justify-content:space-between"><span style="color:#64748b">คงเหลือ</span><b style="color:#dc2626">฿${fmt(c.remaining)}</b></div>
                                </div>
                                <p style="font-size:12.5px;color:#059669;margin:12px 0 0">ลูกค้าจะถอนได้ทันที และเก็บโบนัสไว้ (ไม่หักเครดิต)</p>`,
                                input: "text",
                                inputPlaceholder: "เหตุผล (ไม่บังคับ)",
                                showCancelButton: true,
                                confirmButtonText: "ยืนยันยกเลิก",
                                cancelButtonText: "ปิด",
                                confirmButtonColor: "#dc2626",
                                cancelButtonColor: "#94a3b8",
                              });
                              if (!r.isConfirmed) return;
                              try {
                                await api.post(`/admin/users/${userId}/turnover/${c.id}/cancel`, { reason: r.value });
                                Swal.fire({ icon: "success", title: "ยกเลิกเทิร์นสำเร็จ", timer: 1600, showConfirmButton: false });
                                api.get(`/admin/users/${userId}/turnover`).then((res) => setTurnover(res.data.data));
                              } catch (e: any) {
                                Swal.fire({ icon: "error", title: e.response?.data?.message || "ไม่สำเร็จ" });
                              }
                            }}
                            style={{
                              background: "white",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "0.4rem",
                              padding: "0.45rem 0.9rem",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "white"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#dc2626"; }}
                          >
                            ยกเลิกเทิร์น
                          </button>
                        )}
                      </div>

                      {/* Progress */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.35rem" }}>
                          <span style={{ color: "#64748b" }}>
                            <b style={{ color: "#2563eb" }}>฿{fmt(c.turnover_current)}</b> / ฿{fmt(c.turnover_required)}
                            <span style={{ color: "#94a3b8" }}> · {c.turnover_multiplier}x</span>
                          </span>
                          <span style={{ fontWeight: 700, color: c.progress_percent >= 100 ? "#16a34a" : "#2563eb" }}>{c.progress_percent}%</span>
                        </div>
                        <div style={{ background: "#e2e8f0", borderRadius: "9999px", height: "8px", overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min(100, c.progress_percent)}%`,
                            height: "100%",
                            borderRadius: "9999px",
                            background: c.progress_percent >= 100
                              ? "linear-gradient(90deg, #16a34a, #22c55e)"
                              : "linear-gradient(90deg, #2563eb, #60a5fa)",
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                      </div>

                      {/* บรรทัดล่าง */}
                      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.73rem", color: "#94a3b8" }}>
                        <span>ได้รับ {new Date(c.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span>
                        {c.expired_at && <span>หมดอายุ {new Date(c.expired_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span>}
                        {c.remaining > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>เหลือ ฿{fmt(c.remaining)}</span>}
                        {c.note && <span style={{ fontStyle: "italic" }}>{c.note}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* เกมที่เล่น */}
            {turnover.by_provider?.length > 0 && (
              <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>เกมที่เล่นตั้งแต่ได้โบนัส</h4>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    รวม <b style={{ color: "#2563eb" }}>฿{fmt(turnover.bet_total)}</b>
                    {turnover.claims.some((c: any) => c.status === "active") && (
                      <> / ต้องทำ <b style={{ color: "#0f172a" }}>฿{fmt(turnover.claims.filter((c: any) => c.status === "active").reduce((s: number, c: any) => s + c.turnover_required, 0))}</b></>
                    )}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.65rem", marginBottom: "0.85rem" }}>
                  {turnover.by_provider.map((p: any) => {
                    const pct = turnover.bet_total > 0 ? (p.total_bet / turnover.bet_total) * 100 : 0;
                    return (
                      <div key={p.provider} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.8rem 0.9rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.82rem" }}>{p.provider}</span>
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.35rem" }}>฿{fmt(p.total_bet)}</div>
                        <div style={{ background: "#e2e8f0", borderRadius: "9999px", height: "4px", overflow: "hidden", marginBottom: "0.4rem" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "#3b82f6", borderRadius: "9999px" }} />
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{p.rounds} รอบ · {p.game_count} เกม</div>
                      </div>
                    );
                  })}
                </div>

                <details>
                  <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#2563eb", userSelect: "none", fontWeight: 500, padding: "0.4rem 0" }}>
                    ดูรายละเอียดรายเกม ({turnover.games.length} เกม)
                  </summary>
                  <div style={{ overflowX: "auto", marginTop: "0.6rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }}>
                    <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          {["ค่าย", "เกม", "รอบ", "ยอดเดิมพัน", "เล่นล่าสุด"].map((h) => (
                            <th key={h} style={{ padding: "0.6rem 0.8rem", color: "#475569", fontWeight: 600, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {turnover.games.map((g: any, i: number) => (
                          <tr key={i} style={{ borderBottom: i === turnover.games.length - 1 ? "none" : "1px solid #f8fafc" }}>
                            <td style={{ padding: "0.55rem 0.8rem", color: "#0f172a", fontWeight: 600 }}>{g.provider}</td>
                            <td style={{ padding: "0.55rem 0.8rem", color: "#64748b" }}>{g.game_id}</td>
                            <td style={{ padding: "0.55rem 0.8rem", color: "#64748b" }}>{g.rounds}</td>
                            <td style={{ padding: "0.55rem 0.8rem", color: "#2563eb", fontWeight: 600 }}>฿{fmt(g.total_bet)}</td>
                            <td style={{ padding: "0.55rem 0.8rem", color: "#94a3b8", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                              {new Date(g.last_played).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            )}
          </div>
          )}
        </div>
      )}

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