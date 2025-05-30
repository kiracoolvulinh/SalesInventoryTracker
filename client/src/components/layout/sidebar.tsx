import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { roles } from "@shared/schema";

type SidebarItem = {
  name: string;
  href: string;
  icon: string;
  moduleId: string;
};

type SidebarGroupProps = {
  title: string;
  items: SidebarItem[];
};

function SidebarGroup({ title, items }: SidebarGroupProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const filteredItems = items.filter(item => {
    if (!user?.role?.permissions) {
      return false;
    }
    
    const modulePermissions = user.role.permissions[item.moduleId];
    const hasPermission = modulePermissions?.view === true;
    return hasPermission;
  });

  if (filteredItems.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="px-3 py-2 text-neutral-medium text-sm font-medium">{title}</div>
      
      {filteredItems.map((item) => (
        <Link 
          href={item.href} 
          key={item.href}
          className={cn(
            "sidebar-link flex items-center px-3 py-2 text-neutral-dark rounded hover:bg-neutral-lightest",
            location === item.href && "active bg-primary/10 border-l-4 border-primary"
          )}
        >
          <span className={cn(
            "material-icons mr-3",
            location === item.href ? "text-primary" : "text-neutral-medium"
          )}>
            {item.icon}
          </span>
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function Sidebar({ isSidebarOpen, toggleSidebar }: { isSidebarOpen: boolean, toggleSidebar: () => void }) {  
  const sidebarGroups = [
    {
      title: "Cài đặt",
      items: [
        {
          name: "Danh mục tài khoản",
          href: "/settings/accounts",
          moduleId: "settings"
        },
        {
          name: "Phân quyền chức năng",
          href: "/settings/permissions",
          moduleId: "settings"
        }
      ]
    },
    {
      title: "Danh mục",
      items: [
        {
          name: "Danh mục Nhóm hàng",
          href: "/categories/product-categories",
          moduleId: "categories"
        },
        {
          name: "Danh mục hàng hóa",
          href: "/categories/products",
          moduleId: "products"
        },
        {
          name: "Danh mục nhà cung cấp",
          href: "/categories/suppliers",
          moduleId: "suppliers"
        },
        {
          name: "Danh mục khách hàng",
          href: "/categories/customers",
          moduleId: "customers"
        }
      ]
    },
    {
      title: "Giao dịch",
      items: [
        {
          name: "Quản lý nhập hàng",
          href: "/transactions/purchase-orders",
          moduleId: "purchases"
        },
        {
          name: "Quản lý bán hàng",
          href: "/transactions/sales-orders",
          moduleId: "sales"
        }
      ]
    },
    {
      title: "Tiện ích",
      items: [
        {
          name: "Quản lý tồn kho",
          href: "/utilities/inventory",
          moduleId: "inventory"
        },
        {
          name: "Điều chỉnh giá bán",
          href: "/utilities/price-adjustment",
          moduleId: "prices"
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    
      <aside 
        className={cn(
          "w-64 bg-white shadow-lg fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out pt-16 overflow-y-auto z-30",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="px-2 py-4">
          {sidebarGroups.map((group, index) => (
            <SidebarGroup 
              key={index}
              title={group.title}
              items={group.items}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
