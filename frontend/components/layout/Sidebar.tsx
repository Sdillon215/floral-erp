"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";

interface NavItem {
  name: string;
  href: string;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", roles: [UserRole.SALES, UserRole.BUYER, UserRole.PICKER_PACKER] },
  { name: "Users", href: "/users", roles: [] }, // Admin only (empty array means admin only)
  { name: "Products", href: "/products", roles: [UserRole.SALES, UserRole.BUYER] },
  { name: "Customers", href: "/customers", roles: [UserRole.SALES] },
  { name: "Suppliers", href: "/suppliers", roles: [UserRole.BUYER] },
  { name: "Purchase Orders", href: "/purchase-orders", roles: [UserRole.BUYER] },
  { name: "Sales Orders", href: "/sales-orders", roles: [UserRole.SALES, UserRole.PICKER_PACKER] },
  { name: "Inventory", href: "/inventory", roles: [UserRole.SALES, UserRole.BUYER, UserRole.PICKER_PACKER] },
];

export function Sidebar() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Filter navigation items based on user role
  const filteredNav = navigation.filter((item) => {
    if (item.roles.length === 0) {
      // Empty array means admin only
      return isAdmin;
    }
    return isAdmin || item.roles.includes(user.role);
  });

  return (
    <aside className="w-64 bg-gray-900 min-h-screen">
      <nav className="mt-5 px-2 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

