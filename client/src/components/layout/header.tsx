import { Button } from "@/components/ui/button";
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Đăng xuất thành công",
          description: "Bạn đã đăng xuất khỏi hệ thống",
        });
      }
    });
  };
  
  return (
    <header className="bg-primary text-white shadow-md z-40 fixed top-0 left-0 right-0">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="p-1 rounded hover:bg-primary-dark lg:hidden text-white"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-heading font-bold">Hệ thống Quản lý Bán hàng</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" className="p-1 rounded hover:bg-primary-dark text-white">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 rounded hover:bg-primary-dark text-white">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">{user?.fullName || user?.username}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
