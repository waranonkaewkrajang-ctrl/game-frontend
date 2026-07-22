"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  WalletCards, 
  Gift, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Settings,
  CircleDot,
  LogOut,
  Shield,
  ImageIcon
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    href: "/dashboard",
    permissionKey: "dashboard" 
  },
  {
    title: "จัดการสมาชิก",
    icon: <Users size={20} />,
    id: "users",
    subItems: [
      { title: "ข้อมูลสมาชิกทั้งหมด", href: "/dashboard/users", permissionKey: "users" },
      { title: "ประวัติเดิมพัน", href: "/dashboard/bets", permissionKey: "users" },   
      { title: "ตรวจสอบ IP", href: "/dashboard/ip-check", permissionKey: "users" },
    ],
  },
  {
    title: "ระบบการเงิน",
    icon: <WalletCards size={20} />,
    id: "finance",
    subItems: [
      { title: "รายการฝากเงิน", href: "/dashboard/deposits", permissionKey: "deposits" },
      { title: "รายการถอนเงิน", href: "/dashboard/withdrawals", permissionKey: "withdrawals" },
      { title: "ประวัติธุรกรรม", href: "/dashboard/transactions", permissionKey: "deposits" }, 
    ],
  },
  {
    title: "โปรโมชัน & การตลาด",
    icon: <Gift size={20} />,
    id: "marketing",
    subItems: [
      { title: "จัดการโปรโมชัน", href: "/dashboard/promotions", permissionKey: "promotions" },
      { title: "ระบบแนะนำเพื่อน", href: "/dashboard/referrals", permissionKey: "promotions" },
    ],
  },
  {
    title: "รายงาน (Reports)",
    icon: <FileText size={20} />,
    id: "reports",
    subItems: [
      { title: "สรุปผลประกอบการ", href: "/dashboard/reports", permissionKey: "reports" },
    ],
  },
  {
    title: "จัดการเกม",
    icon: <LayoutDashboard size={20} />,
    href: "/dashboard/games",
    permissionKey: "games"
  },
  {
    title: "จัดการแบนเนอร์",
    icon: <ImageIcon size={20} />,
    href: "/dashboard/banners",
    permissionKey: "settings" // ให้ใช้สิทธิ์ระดับตั้งค่า หรือจะเปลี่ยนเป็น "promotions" ก็ได้ครับ
  },
  // --- เพิ่มเมนูจัดการสิทธิ์ตรงนี้ ---
  {
    title: "จัดการพนักงาน",
    icon: <Shield size={20} />,
    href: "/dashboard/admins",
    permissionKey: "settings"
  },
  // ------------------------------
  {
    title: "ตั้งค่าระบบ",
    icon: <Settings size={20} />,
    id: "settings",
    subItems: [
      { title: "ตั้งค่าทั่วไป", href: "/dashboard/settings", permissionKey: "settings" },
      { title: "ตั้งค่าการเงิน", href: "/dashboard/settings/finance", permissionKey: "settings" },
      { title: "ตั้งค่าเกม & โปรโมชัน", href: "/dashboard/settings/game", permissionKey: "settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // State สำหรับเปิด/ปิดเมนูย่อย
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    users: true,
    finance: true,
  });

  // State เก็บข้อมูล Admin ที่ Login อยู่
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // ดึงข้อมูล Admin จาก LocalStorage ตอนโหลดหน้าต่าง
  useEffect(() => {
    const adminData = localStorage.getItem("admin_user");
    if (adminData) {
      setCurrentAdmin(JSON.parse(adminData));
    } else {
      // ถ้าไม่มีข้อมูล ให้พากลับไปหน้า Login
      router.push("/login");
    }
  }, [router]);

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/login");
  };

  const canView = (permissionKey?: string) => {
    if (!currentAdmin) return false;
    if (currentAdmin.role === "super_admin") return true; 
    if (!permissionKey) return true; 
    return currentAdmin.permissions?.includes(permissionKey);
  };

  return (
    <aside style={{ 
      width: "260px", 
      background: "white", 
      borderRight: "1px solid #e2e8f0", 
      display: "flex", 
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0
    }}>
      {/* Header โลโก้ */}
      <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid #f1f5f9", marginBottom: "1rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
          Game Platform
        </h2>
        <p style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500, marginTop: "0.25rem", margin: "0.25rem 0 0 0" }}>
          {currentAdmin ? `Welcome, ${currentAdmin.username}` : "Admin Management"}
        </p>
      </div>

      {/* รายการเมนู */}
      <div style={{ padding: "0 0.75rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {menuItems.map((menu, index) => {
          
          // กรณีเมนูเดี่ยว (ไม่มีลูก)
          if (menu.href) {
            // เช็คสิทธิ์ก่อน render
            if (!canView(menu.permissionKey)) return null;

            const isActive = pathname === menu.href;
            return (
              <Link key={index} href={menu.href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem",
                  borderRadius: "0.5rem", transition: "all 0.15s",
                  background: isActive ? "#f1f5f9" : "transparent",
                  color: isActive ? "#4f46e5" : "#334155",
                  fontWeight: isActive ? 600 : 500,
                  borderLeft: isActive ? "3px solid #4f46e5" : "3px solid transparent",
                }}>
                  {menu.icon}
                  <span style={{ fontSize: "0.875rem" }}>{menu.title}</span>
                </div>
              </Link>
            );
          }

          // กรณีเป็นหมวดหมู่ (มีเมนูย่อย)
          if (menu.subItems && menu.id) {
            // กรองเมนูย่อยตามสิทธิ์ก่อน
            const visibleSubItems = menu.subItems.filter(subItem => canView(subItem.permissionKey));
            
            // ถ้าไม่มีเมนูย่อยไหนผ่านสิทธิ์เลย ให้ซ่อนหมวดหมู่นี้ไปเลย
            if (visibleSubItems.length === 0) return null;

            const isOpen = openMenus[menu.id];
            const isChildActive = visibleSubItems.some(sub => pathname === sub.href);

            return (
              <div key={index} style={{ marginBottom: "0.25rem" }}>
                {/* ปุ่มแม่ */}
                <div 
                  onClick={() => toggleMenu(menu.id as string)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    padding: "0.65rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", transition: "all 0.15s",
                    color: isChildActive ? "#4f46e5" : "#334155",
                    background: isChildActive && !isOpen ? "#f8fafc" : "transparent",
                    fontWeight: isChildActive ? 600 : 500,
                    borderLeft: isChildActive && !isOpen ? "3px solid #4f46e5" : "3px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {menu.icon}
                    <span style={{ fontSize: "0.875rem" }}>{menu.title}</span>
                  </div>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* เมนูย่อย */}
                {isOpen && (
                  <div style={{ paddingLeft: "1.25rem", marginTop: "0.15rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    {visibleSubItems.map((subItem, subIndex) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link key={subIndex} href={subItem.href} style={{ textDecoration: "none" }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.5rem 0.75rem", borderRadius: "0.5rem", transition: "all 0.15s",
                            color: isSubActive ? "#4f46e5" : "#64748b",
                            background: isSubActive ? "#f1f5f9" : "transparent",
                            fontWeight: isSubActive ? 600 : 500,
                            fontSize: "0.85rem"
                          }}>
                            <CircleDot size={10} style={{ opacity: isSubActive ? 1 : 0.4 }} />
                            {subItem.title}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      {/* ปุ่มออกจากระบบ */}
      <div style={{ borderTop: "1px solid #e2e8f0", padding: "1rem", marginTop: "auto" }}>
        <button onClick={handleLogout}
          style={{ 
            display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", 
            padding: "0.65rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem", 
            fontWeight: 500, color: "#ef4444", background: "none", border: "none", 
            cursor: "pointer", transition: "background 0.15s" 
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
        >
          <LogOut size={20} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}