"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Prize {
  id: number;
  label: string;
  type: string;
  value: number;
  color: string;
  icon: string;
  sort_order: number;
}

export default function SpinWheelPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [enabled, setEnabled] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotRef = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) { router.push("/login"); return; }
    fetchWheel();
  }, []);

  const fetchWheel = () => {
    api.get("/spin-wheel").then((res) => {
      const d = res.data.data;
      setPrizes(d.prizes || []);
      setRemaining(d.remaining);
      setDailyLimit(d.daily_limit);
      setEnabled(d.enabled);
    }).catch(() => {});
  };

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = 320;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = displaySize + "px";
    canvas.style.height = displaySize + "px";
    ctx.scale(dpr, dpr);

    const center = displaySize / 2;
    const radius = center - 10;
    const count = prizes.length;
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // วาดเงาวงล้อ
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();
    ctx.restore();

    // วาดขอบนอก
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(124,58,237,0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rot * Math.PI) / 180);

    prizes.forEach((prize, i) => {
      const start = i * sliceAngle - Math.PI / 2;
      const end = start + sliceAngle;

      // วาดช่อง
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      // เส้นขอบช่อง
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ข้อความ
      ctx.save();
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "center";

      // ชื่อรางวัล
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px 'Kanit', sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 3;
      ctx.fillText(prize.label, radius * 0.62, 1);
      ctx.shadowBlur = 0;

      // Icon text (ถ้ามี)
      if (prize.icon) {
        ctx.font = "16px sans-serif";
        ctx.fillText(prize.icon, radius * 0.85, 5);
      }

      ctx.restore();
    });

    ctx.restore();

    // เข็มชี้ (สามเหลี่ยมด้านขวา)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(displaySize - 6, center - 14);
    ctx.lineTo(displaySize - 6, center + 14);
    ctx.lineTo(displaySize - 32, center);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // จุดกลาง
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(center, center, 0, center, center, 20);
    grad.addColorStop(0, "#2d1b69");
    grad.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }, [prizes]);

  useEffect(() => {
    drawWheel(rotation);
  }, [prizes, rotation, drawWheel]);

  const handleSpin = async () => {
    if (spinning || remaining <= 0 || !enabled || prizes.length === 0) return;

    setSpinning(true);
    try {
      const res = await api.post("/spin-wheel/spin");
      const data = res.data.data;
      const prize = data.prize;

      const prizeIndex = prizes.findIndex(p => p.id === prize.id);
      const sliceAngle = 360 / prizes.length;
      const targetAngle = -(prizeIndex * sliceAngle + sliceAngle / 2);
      const totalRotation = 360 * 10 + targetAngle;

      const startRot = rotRef.current % 360;
      const duration = 6000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const currentRot = startRot + totalRotation * eased;

        rotRef.current = currentRot;
        setRotation(currentRot);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          setRemaining(data.remaining);

          setTimeout(() => {
            if (prize.type === "nothing") {
              Swal.fire({
                title: "เสียใจด้วย",
                text: prize.label,
                icon: "info",
                background: "#1a1a2e",
                color: "#e2e8f0",
                confirmButtonColor: "#7c3aed",
                confirmButtonText: "ตกลง",
              });
            } else {
              Swal.fire({
                title: "ยินดีด้วย!",
                html: `
                  <div style="text-align:center">
                    <div style="width:64px;height:64px;border-radius:50%;background:${prize.color};display:flex;align-items:center;justify-content:center;margin:12px auto;font-size:28px">${prize.icon || "★"}</div>
                    <p style="font-size:22px;font-weight:bold;color:#a855f7;margin:12px 0">${prize.label}</p>
                    ${prize.type === "credit" ? '<p style="font-size:14px;color:#22c55e">เครดิตเข้ากระเป๋าแล้ว</p>' : ""}
                  </div>
                `,
                background: "#1a1a2e",
                color: "#e2e8f0",
                confirmButtonColor: "#7c3aed",
                confirmButtonText: "ตกลง",
              });
            }
          }, 400);
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      setSpinning(false);
      Swal.fire({
        icon: "error",
        title: "ไม่สำเร็จ",
        text: err.response?.data?.message || "เกิดข้อผิดพลาด",
        background: "#1a1a2e",
        color: "#e2e8f0",
        confirmButtonColor: "#7c3aed",
      });
    }
  };

  const canSpin = !spinning && remaining > 0 && enabled && prizes.length > 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "1rem",
      fontFamily: "'Kanit', sans-serif",
    }}>

      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <button onClick={() => router.push("/lobby")} style={{
            background: "#181C31", border: "1px solid #2B3259", borderRadius: "50%",
            width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#9ca3af",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 600, color: "white", margin: 0 }}>วงล้อนำโชค</h1>
        </div>

        {/* สิทธิ์คงเหลือ */}
        <div style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: "12px",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}>
          <span style={{ color: "#a78bfa", fontSize: "13px" }}>สิทธิ์หมุนวันนี้</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ color: "#a855f7", fontSize: "20px", fontWeight: 700 }}>{remaining}</span>
            <span style={{ color: "#6b7280", fontSize: "12px" }}>/ {dailyLimit}</span>
          </div>
        </div>

        {/* วงล้อ */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          {prizes.length > 0 ? (
            <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
          ) : (
            <div style={{
              width: "280px", height: "280px", borderRadius: "50%",
              background: "#181C31", border: "2px solid #2B3259",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#4b5563", fontSize: "14px",
            }}>
              ยังไม่มีรางวัลในวงล้อ
            </div>
          )}
        </div>

        {/* ปุ่มหมุน */}
        <button
          onClick={handleSpin}
          disabled={!canSpin}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            fontSize: "1rem",
            fontWeight: 600,
            color: "white",
            cursor: canSpin ? "pointer" : "not-allowed",
            opacity: canSpin ? 1 : 0.4,
            background: canSpin ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#374151",
            transition: "all 0.3s",
          }}
        >
          {spinning ? "กำลังหมุน..." : remaining <= 0 ? "หมดสิทธิ์วันนี้" : !enabled ? "ปิดให้บริการ" : "หมุนเลย"}
        </button>

        {/* ประวัติ */}
        <button
          onClick={() => router.push("/spin-wheel/history")}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #2B3259",
            background: "transparent",
            color: "#6b7280",
            fontSize: "13px",
            cursor: "pointer",
            marginTop: "8px",
          }}
        >
          ดูประวัติการหมุน
        </button>
      </div>
    </div>
  );
}