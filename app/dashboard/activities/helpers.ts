import api from "@/lib/api";

export type Activity = {
  id: number;
  type: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  image_thumb: string | null;
  canvas_data: any | null;
  slots: string[];
  pages: string[] | null;
  link_url: string | null;
  sort_order: number;
  badge: string | null;
  badge_color: string | null;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  audience: string;
  show_once: boolean;
  config: any | null;
  view_count: number;
  click_count: number;
};

export const TYPES: { key: string; label: string; hint: string; icon: string }[] = [
  { key: "link",     label: "ภาพกดได้",        hint: "กดแล้วไปหน้าที่กำหนด",       icon: "🖼️" },
  { key: "football", label: "ทายบอล",          hint: "ทายผลแล้วรับรางวัล",         icon: "⚽" },
  { key: "lotto2",   label: "ทายหวย 2 ตัวล่าง", hint: "ทายเลขท้าย 2 ตัว",           icon: "🎰" },
  { key: "popup",    label: "ป๊อปอัป",          hint: "เด้งตอนลูกค้าเข้าเว็บ",       icon: "💬" },
];

export const SLOTS: { key: string; label: string; hint: string }[] = [
  { key: "home_banner",  label: "แบนเนอร์บนสุด", hint: "ใต้แถบเมนู" },
  { key: "icon_grid",    label: "กริดไอคอน",     hint: "แถวปุ่มกลมหน้าแรก" },
  { key: "home_card",    label: "การ์ดใหญ่",      hint: "กลางหน้าแรก" },
  { key: "float_button", label: "ปุ่มลอย",        hint: "มุมจอ ตามติดทุกหน้า" },
  { key: "popup",        label: "ป๊อปอัป",        hint: "เด้งตอนเข้าเว็บ" },
  { key: "bottom_menu",  label: "เมนูล่าง",       hint: "แถบล่างสุด" },
];

export const PAGES: { key: string; label: string }[] = [
  { key: "home",       label: "หน้าแรก" },
  { key: "lobby",      label: "ล็อบบี้เกม" },
  { key: "wallet",     label: "กระเป๋าเงิน" },
  { key: "promotions", label: "โปรโมชัน" },
  { key: "rewards",    label: "รับรางวัล" },
  { key: "spin-wheel", label: "วงล้อ" },
  { key: "history",    label: "ประวัติ" },
  { key: "profile",    label: "โปรไฟล์" },
];

export const AUDIENCES: { key: string; label: string }[] = [
  { key: "all",    label: "ทุกคน" },
  { key: "member", label: "เฉพาะสมาชิกที่ล็อกอิน" },
  { key: "guest",  label: "เฉพาะคนยังไม่ล็อกอิน" },
];

export const emptyActivity = (): Partial<Activity> => ({
  type: "link",
  title: "",
  subtitle: "",
  image_url: null,
  image_thumb: null,
  slots: ["icon_grid"],
  pages: [],
  link_url: "",
  badge: "",
  badge_color: "#ef4444",
  is_active: false,
  start_at: null,
  end_at: null,
  audience: "all",
  show_once: false,
  config: {},
});

/** อัปโหลดภาพ → backend แปลงเป็น WebP ให้อัตโนมัติ */
export const uploadImage = async (file: File, thumb = false) => {
  const fd = new FormData();
  fd.append("image", file);
  if (thumb) fd.append("thumb", "1");
  const res = await api.post("/admin/activities/upload-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as { url: string; size: number };
};

export const kb = (bytes: number) => (bytes > 0 ? `${Math.round(bytes / 1024)} KB` : "");

/** แปลงเวลาสำหรับช่อง datetime-local */
export const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromLocalInput = (v: string | null | undefined) => {
  const s = (v || "").trim();
  if (!s || !s.includes("T")) return null;
  return s.replace("T", " ") + ":00";
};