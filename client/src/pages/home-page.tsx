import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Loader2, ShoppingCart, Package, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for demo visualization
const salesData = [
  { name: "T1", sales: 4000 },
  { name: "T2", sales: 3000 },
  { name: "T3", sales: 5000 },
  { name: "T4", sales: 2780 },
  { name: "T5", sales: 1890 },
  { name: "T6", sales: 2390 },
  { name: "T7", sales: 3490 },
  { name: "T8", sales: 4000 },
  { name: "T9", sales: 2500 },
  { name: "T10", sales: 6000 },
  { name: "T11", sales: 7000 },
  { name: "T12", sales: 9800 }
];

const categoryData = [
  { name: "Điện thoại", value: 400 },
  { name: "Laptop", value: 300 },
  { name: "Phụ kiện", value: 300 },
  { name: "Linh kiện", value: 200 }
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch summary data
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      try {
        // In a real app we would fetch from the API
        // Simulating API response delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        return {
          totalProducts: 246,
          totalCustomers: 48,
          totalSales: "168.500.000",
          recentOrders: 12
        };
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu tổng quan",
          variant: "destructive"
        });
        throw error;
      }
    }
  });

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">
          Xin chào, {user?.fullName || user?.username}
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng sản phẩm</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mt-2" />
                  ) : (
                    <h3 className="text-2xl font-bold mt-1">{summaryData?.totalProducts}</h3>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng khách hàng</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mt-2" />
                  ) : (
                    <h3 className="text-2xl font-bold mt-1">{summaryData?.totalCustomers}</h3>
                  )}
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Doanh số</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mt-2" />
                  ) : (
                    <h3 className="text-2xl font-bold mt-1">{summaryData?.totalSales} ₫</h3>
                  )}
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Đơn hàng gần đây</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mt-2" />
                  ) : (
                    <h3 className="text-2xl font-bold mt-1">{summaryData?.recentOrders}</h3>
                  )}
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Doanh số theo tháng</CardTitle>
              <CardDescription>Tổng doanh số bán hàng qua các tháng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                    <Bar dataKey="sales" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Doanh số theo danh mục</CardTitle>
              <CardDescription>Phân bổ doanh số theo danh mục sản phẩm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} ₫`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
