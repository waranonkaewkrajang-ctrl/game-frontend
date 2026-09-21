import Swal from "sweetalert2";
import api from "@/lib/api";

// ═══════════════════════════════════════════════════════════
//  ตัวแก้ภาพรางวัลวงล้อ — ลาก / ย่อขยาย / หมุน / ลบพื้นหลัง
// ═══════════════════════════════════════════════════════════

export type ImgTransform = { img_scale: number; img_x: number; img_y: number; img_rotate: number };
export const DEFAULT_TRANSFORM: ImgTransform = { img_scale: 100, img_x: 0, img_y: 0, img_rotate: 0 };

/** เรขาคณิตเดียวกับวงล้อหน้าลูกค้า — ถ้าแก้ตัวเลขตรงนี้ ต้องแก้หน้าลูกค้าด้วย */
export const WHEEL = { SIZE: 380, RIM: 44, IMG_BASE: 0.13, IMG_POS: 0.58, LABEL_RIM: 0.87 };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const darker = (hex: string) => {
  const h = (hex || "").replace("#", "").toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(h)) return hex || "#000000";
  const f = (i: number) => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.72);
  return `rgb(${f(0)},${f(2)},${f(4)})`;
};

const readableText = (hex: string) => {
  const h = (hex || "#000000").replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1a2e" : "#ffffff";
};

/** ย่อตัวอักษรจนพอดีความกว้าง ถ้ายังไม่พอตัดแล้วใส่ … */
export const fitText = (ctx: CanvasRenderingContext2D, text: string, maxW: number, maxPx: number, minPx: number) => {
  let px = maxPx;
  ctx.font = `bold ${px}px sans-serif`;
  while (px > minPx && ctx.measureText(text).width > maxW) {
    px -= 0.5;
    ctx.font = `bold ${px}px sans-serif`;
  }
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
};

/** วาดภาพ + ชื่อของ 1 ช่อง (ctx ต้องหมุนให้แกน x ชี้ออกกลางช่องแล้ว) */
export const drawSliceContent = (
  ctx: CanvasRenderingContext2D,
  o: { size: number; wheelR: number; sliceAngle: number; label: string; textColor: string; img: HTMLImageElement | null; t: ImgTransform }
) => {
  const { size, wheelR, sliceAngle, label, textColor, img, t } = o;
  const hasImg = !!img && img.naturalWidth > 0;

  if (hasImg && img) {
    const base = size * WHEEL.IMG_BASE * (t.img_scale / 100);
    const ratio = img.naturalWidth / img.naturalHeight;
    const w = ratio >= 1 ? base : base * ratio;
    const h = ratio >= 1 ? base / ratio : base;
    ctx.save();
    ctx.translate(wheelR * (WHEEL.IMG_POS + t.img_x / 100), wheelR * (t.img_y / 100));
    ctx.rotate(Math.PI / 2 + (t.img_rotate * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 3;
  if (hasImg) {
    // มีภาพ → ชื่อวางขวางช่องใกล้ขอบนอก
    const r = wheelR * WHEEL.LABEL_RIM;
    const maxW = 2 * r * Math.sin(Math.min(sliceAngle / 2, Math.PI / 2)) * 0.8;
    ctx.translate(r, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(fitText(ctx, label, maxW, size * 0.03, size * 0.017), 0, 0);
  } else {
    // ไม่มีภาพ → แนวรัศมีแบบเดิม
    ctx.fillText(fitText(ctx, label, wheelR * 0.6, size * 0.024, size * 0.016), wheelR * 0.55, 0);
  }
  ctx.restore();
};

// ── ธีมวงล้อ (โหลดครั้งเดียว) ──
let themeCache: Record<string, any> | null = null;
const loadTheme = async () => {
  if (themeCache) return themeCache;
  try {
    const r = await api.get("/admin/theme");
    themeCache = { ...(r.data?.defaults || {}), ...(r.data?.data || {}) };
  } catch {
    themeCache = {};
  }
  return themeCache;
};

// ── ลบพื้นหลังสีเรียบ (flood fill จากขอบภาพ) ──
const removeBackground = (src: HTMLImageElement, tol: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const MAX = 800;
    const s = Math.min(1, MAX / Math.max(src.naturalWidth, src.naturalHeight));
    const w = Math.max(1, Math.round(src.naturalWidth * s));
    const h = Math.max(1, Math.round(src.naturalHeight * s));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    if (!x) return reject(new Error("no ctx"));
    x.drawImage(src, 0, 0, w, h);

    let data: ImageData;
    try {
      data = x.getImageData(0, 0, w, h);
    } catch (e) {
      return reject(e);
    }
    const d = data.data;

    // สีพื้นอ้างอิง = เฉลี่ยมุมที่ยังไม่โปร่งใส (ไม่มีเลย = ขาว)
    const corners = [0, w - 1, (h - 1) * w, h * w - 1].filter((i) => d[i * 4 + 3] >= 10);
    const ref = corners.length
      ? [0, 1, 2].map((ch) => corners.reduce((sum, i) => sum + d[i * 4 + ch], 0) / corners.length)
      : [255, 255, 255];

    const isBg = (i: number) => {
      const p = i * 4;
      if (d[p + 3] < 10) return true;
      return Math.abs(d[p] - ref[0]) <= tol && Math.abs(d[p + 1] - ref[1]) <= tol && Math.abs(d[p + 2] - ref[2]) <= tol;
    };

    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    for (let X = 0; X < w; X++) stack.push(X, (h - 1) * w + X);
    for (let Y = 0; Y < h; Y++) stack.push(Y * w, Y * w + w - 1);

    while (stack.length) {
      const i = stack.pop() as number;
      if (seen[i]) continue;
      seen[i] = 1;
      if (!isBg(i)) continue;
      d[i * 4 + 3] = 0;
      const X = i % w;
      if (X > 0) stack.push(i - 1);
      if (X < w - 1) stack.push(i + 1);
      if (i >= w) stack.push(i - w);
      if (i < w * (h - 1)) stack.push(i + w);
    }

    x.putImageData(data, 0, 0);
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png");
  });

// ── HTML ของช่องภาพ (ใส่ในฟอร์ม Swal) ──
export const imageFieldHtml = (current: string | null, tIn: Partial<ImgTransform> = {}) => {
  const url = current ? escAttr(current) : "";
  const t: ImgTransform = { ...DEFAULT_TRANSFORM };
  (Object.keys(DEFAULT_TRANSFORM) as (keyof ImgTransform)[]).forEach((k) => {
    if (typeof tIn[k] === "number") t[k] = tIn[k] as number;
  });
  const external = !!current && !current.includes("/uploads/");
  const btn = "padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer";
  const small = "padding:5px 10px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid #cbd5e1;background:white;color:#334155";
  const row = "display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:8px;font-size:12px;color:#334155";

  return `
    <div>
      <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">รูปรางวัล (ถ้ามี)</label>
      <div style="padding:10px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:56px;height:56px;border-radius:10px;background:#1e1b4b;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
            <img id="swal-img-preview" src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;${url ? "" : "display:none"}">
            <span id="swal-img-empty" style="font-size:10px;color:#a5b4fc;${url ? "display:none" : ""}">ไม่มีภาพ</span>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" id="swal-img-pick" style="${btn};border:none;background:#4f46e5;color:white">อัปโหลดภาพ</button>
              <button type="button" id="swal-img-remove" style="${btn};border:1px solid #fecaca;background:white;color:#dc2626;${url ? "" : "display:none"}">ลบภาพ</button>
            </div>
            <div id="swal-img-status" style="font-size:11px;margin-top:6px;color:${external ? "#d97706" : "#64748b"}">
              ${external ? "ภาพนี้มาจากเว็บภายนอก อาจไม่ขึ้นบนวงล้อ แนะนำอัปโหลดใหม่" : "PNG / JPG / WebP ไม่เกิน 2MB"}
            </div>
          </div>
        </div>

        <div id="swal-img-editor" style="margin-top:10px;${url ? "" : "display:none"}">
          <canvas id="swal-img-canvas" style="width:100%;height:210px;display:block;border-radius:10px;background:radial-gradient(circle at 50% 100%,#2a1b5c,#0b0820 70%);cursor:grab;touch-action:none"></canvas>
          <div style="font-size:11px;color:#64748b;text-align:center;margin:4px 0 8px">ลากภาพเพื่อขยับ · หมุนลูกกลิ้งเมาส์เพื่อย่อ/ขยาย</div>
          <div style="${row}">
            <span>ขนาด</span>
            <input id="swal-img-scale" type="range" min="30" max="300" value="${t.img_scale}">
            <span id="swal-img-scale-val" style="text-align:right">${t.img_scale}%</span>
          </div>
          <div style="${row};margin-top:4px">
            <span>หมุน</span>
            <input id="swal-img-rotate" type="range" min="-180" max="180" value="${t.img_rotate}">
            <span id="swal-img-rotate-val" style="text-align:right">${t.img_rotate}°</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
            <button type="button" id="swal-bg-remove" style="${small}">ลบพื้นหลัง</button>
            <span style="font-size:11px;color:#64748b">ความแรง</span>
            <input id="swal-bg-tol" type="range" min="5" max="90" value="30" style="flex:1;min-width:80px">
            <button type="button" id="swal-img-reset" style="${small}">รีเซ็ตตำแหน่ง</button>
          </div>
        </div>
      </div>
      <input id="swal-img-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none">
      <input id="swal-image" type="hidden" value="${url}">
      <input id="swal-img-x" type="hidden" value="${t.img_x}">
      <input id="swal-img-y" type="hidden" value="${t.img_y}">
    </div>`;
};

// ── อ่านค่าตำแหน่งภาพจากฟอร์ม (ใช้ใน preConfirm) ──
export const readImgTransform = (): ImgTransform => {
  const v = (id: string, def: number) => {
    const n = parseInt((document.getElementById(id) as HTMLInputElement | null)?.value ?? "", 10);
    return isNaN(n) ? def : n;
  };
  return {
    img_scale: clamp(v("swal-img-scale", 100), 30, 300),
    img_x: clamp(v("swal-img-x", 0), -60, 60),
    img_y: clamp(v("swal-img-y", 0), -60, 60),
    img_rotate: clamp(v("swal-img-rotate", 0), -180, 180),
  };
};

// ── ผูกการทำงานทั้งหมด (ใช้ใน didOpen) ──
export const bindImageField = async ({ index, total }: { index: number; total: number }) => {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
  const file = $<HTMLInputElement>("swal-img-file");
  const hidden = $<HTMLInputElement>("swal-image");
  const preview = $<HTMLImageElement>("swal-img-preview");
  const empty = $("swal-img-empty");
  const removeBtn = $("swal-img-remove");
  const status = $("swal-img-status");
  const editor = $("swal-img-editor");
  const canvas = $<HTMLCanvasElement>("swal-img-canvas");
  const scaleIn = $<HTMLInputElement>("swal-img-scale");
  const rotIn = $<HTMLInputElement>("swal-img-rotate");
  const xIn = $<HTMLInputElement>("swal-img-x");
  const yIn = $<HTMLInputElement>("swal-img-y");
  const tolIn = $<HTMLInputElement>("swal-bg-tol");
  const scaleVal = $("swal-img-scale-val");
  const rotVal = $("swal-img-rotate-val");
  if (!file || !hidden || !preview || !empty || !removeBtn || !status || !editor || !canvas || !scaleIn || !rotIn || !xIn || !yIn || !tolIn) return;

  const theme: Record<string, any> = (await loadTheme()) || {};
  const t: ImgTransform = { img_scale: +scaleIn.value, img_x: +xIn.value, img_y: +yIn.value, img_rotate: +rotIn.value };
  let img: HTMLImageElement | null = null;
  let tainted = false;
  let k = 1;

  const setStatus = (text: string, color = "#64748b") => { status.textContent = text; status.style.color = color; };
  const sync = () => {
    scaleIn.value = String(t.img_scale);
    rotIn.value = String(t.img_rotate);
    xIn.value = String(t.img_x);
    yIn.value = String(t.img_y);
    if (scaleVal) scaleVal.textContent = `${t.img_scale}%`;
    if (rotVal) rotVal.textContent = `${t.img_rotate}°`;
  };

  const draw = () => {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 300;
    const H = canvas.clientHeight || 210;
    if (canvas.width !== Math.round(W * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const size = WHEEL.SIZE;
    const wheelR = size / 2 - WHEEL.RIM;
    const sliceAngle = (2 * Math.PI) / Math.max(total, 1);
    const half = Math.min(sliceAngle / 2, Math.PI / 2);
    k = Math.min((H - 14) / (wheelR + 12), (W / 2 - 10) / ((wheelR + 12) * Math.sin(half)));

    const prizeMode = theme.wheel_slice_mode === "prize";
    const colorIn = document.getElementById("swal-color") as HTMLInputElement | null;
    const labelIn = document.getElementById("swal-label") as HTMLInputElement | null;
    const base = prizeMode
      ? colorIn?.value || "#7c3aed"
      : String((index % 2 === 0 ? theme.wheel_slice_a : theme.wheel_slice_b) || "#7c3aed");

    ctx.save();
    ctx.translate(W / 2, H - 6);
    ctx.scale(k, k);
    ctx.rotate(-Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, wheelR, -sliceAngle / 2, sliceAngle / 2);
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, size * 0.06, 0, 0, wheelR);
    g.addColorStop(0, darker(base));
    g.addColorStop(1, base);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, wheelR + 5, -sliceAngle / 2, sliceAngle / 2);
    ctx.strokeStyle = String(theme.wheel_inner_ring || "#38bdf8");
    ctx.lineWidth = 4;
    ctx.stroke();

    drawSliceContent(ctx, {
      size, wheelR, sliceAngle,
      label: labelIn?.value || "ชื่อรางวัล",
      textColor: prizeMode ? readableText(base) : String(theme.wheel_text || "#e9d5ff"),
      img, t,
    });

    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, 2 * Math.PI);
    ctx.fillStyle = String(theme.wheel_center || "#4c1d95");
    ctx.fill();
    ctx.restore();
  };

  const loadImg = (url: string) => {
    img = null;
    tainted = false;
    if (!url) { draw(); return; }
    const a = new Image();
    a.crossOrigin = "anonymous";
    a.onload = () => { img = a; draw(); };
    a.onerror = () => {
      const b = new Image();
      b.onload = () => { img = b; tainted = true; draw(); };
      b.src = url;
    };
    a.src = url;
  };

  const show = (url: string) => {
    hidden.value = url;
    preview.style.display = url ? "" : "none";
    empty.style.display = url ? "none" : "";
    removeBtn.style.display = url ? "" : "none";
    editor.style.display = url ? "" : "none";
    if (url) preview.src = url; else preview.removeAttribute("src");
    loadImg(url);
  };

  const upload = async (blob: Blob, name: string) => {
    const fd = new FormData();
    fd.append("image", blob, name);
    const res = await api.post("/admin/spin-wheel/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return String(res.data.url);
  };

  // อัปโหลด
  ($("swal-img-pick") as HTMLElement).onclick = () => file.click();
  file.onchange = async () => {
    const f = file.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setStatus("ไฟล์ใหญ่เกิน 2MB", "#dc2626"); file.value = ""; return; }
    setStatus("กำลังอัปโหลด...");
    Swal.disableButtons();
    try {
      show(await upload(f, f.name));
      setStatus("อัปโหลดสำเร็จ ✓ ลากภาพเพื่อจัดตำแหน่งได้เลย", "#16a34a");
    } catch (e: any) {
      setStatus(e.response?.data?.message || "อัปโหลดไม่สำเร็จ", "#dc2626");
    } finally {
      Swal.enableButtons();
      file.value = "";
    }
  };

  // ลบภาพ
  removeBtn.onclick = () => {
    show("");
    Object.assign(t, DEFAULT_TRANSFORM);
    sync();
    setStatus("ลบภาพแล้ว — กดบันทึกเพื่อยืนยัน", "#d97706");
  };

  // ขนาด / หมุน / รีเซ็ต
  scaleIn.oninput = () => { t.img_scale = +scaleIn.value; sync(); draw(); };
  rotIn.oninput = () => { t.img_rotate = +rotIn.value; sync(); draw(); };
  ($("swal-img-reset") as HTMLElement).onclick = () => { Object.assign(t, DEFAULT_TRANSFORM); sync(); draw(); };

  // ลบพื้นหลัง
  ($("swal-bg-remove") as HTMLElement).onclick = async () => {
    if (!img) return;
    if (tainted) { setStatus("ภาพจากเว็บภายนอก ลบพื้นไม่ได้ — อัปโหลดภาพใหม่ก่อน", "#dc2626"); return; }
    setStatus("กำลังลบพื้นหลัง...");
    Swal.disableButtons();
    try {
      const blob = await removeBackground(img, +tolIn.value);
      show(await upload(blob, "nobg.png"));
      setStatus("ลบพื้นหลังแล้ว ✓ ถ้ายังไม่เกลี้ยง เพิ่มความแรงแล้วกดอีกครั้ง", "#16a34a");
    } catch {
      setStatus("ลบพื้นหลังไม่สำเร็จ", "#dc2626");
    } finally {
      Swal.enableButtons();
    }
  };

  // ลากภาพ
  let drag: { x: number; y: number; ix: number; iy: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (!img) return;
    drag = { x: e.clientX, y: e.clientY, ix: t.img_x, iy: t.img_y };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const wheelR = WHEEL.SIZE / 2 - WHEEL.RIM;
    const dx = (e.clientX - drag.x) / k;
    const dy = (e.clientY - drag.y) / k;
    t.img_y = clamp(Math.round(drag.iy + (dx / wheelR) * 100), -60, 60);
    t.img_x = clamp(Math.round(drag.ix - (dy / wheelR) * 100), -60, 60);
    sync();
    draw();
  });
  const endDrag = () => { drag = null; canvas.style.cursor = "grab"; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // ลูกกลิ้งเมาส์ = ย่อ/ขยาย
  canvas.addEventListener("wheel", (e) => {
    if (!img) return;
    e.preventDefault();
    t.img_scale = clamp(t.img_scale + (e.deltaY < 0 ? 5 : -5), 30, 300);
    sync();
    draw();
  }, { passive: false });

  // เปลี่ยนชื่อ / สีช่อง → วาดใหม่
  document.getElementById("swal-label")?.addEventListener("input", draw);
  document.getElementById("swal-color")?.addEventListener("input", draw);

  sync();
  loadImg(hidden.value);
  requestAnimationFrame(draw);
};