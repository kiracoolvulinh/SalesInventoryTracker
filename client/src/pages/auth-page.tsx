import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Register schema
const registerSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterValues) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate({
      ...userData,
      roleId: 2, // Default to regular user role
      isActive: true,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold">
              {activeTab === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Đăng nhập vào hệ thống quản lý bán hàng" 
                : "Tạo tài khoản mới để sử dụng hệ thống"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên đăng nhập</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập tên đăng nhập" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Đăng nhập"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên đăng nhập</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập tên đăng nhập" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập họ và tên" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Xác nhận mật khẩu</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Nhập lại mật khẩu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Đăng ký"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="hidden md:block">
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-bold text-primary">Hệ thống Quản lý Bán hàng</h1>
            <p className="text-gray-600">
              Giải pháp toàn diện giúp quản lý hàng hóa, khách hàng, nhà cung cấp và giao dịch mua bán hiệu quả.
            </p>
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Quản lý hàng hóa</h3>
                  <p className="text-sm text-gray-600">Theo dõi tồn kho và quản lý danh mục sản phẩm</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Quản lý bán hàng</h3>
                  <p className="text-sm text-gray-600">Tạo hóa đơn và quản lý đơn hàng nhanh chóng</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Quản lý nhập hàng</h3>
                  <p className="text-sm text-gray-600">Theo dõi nhà cung cấp và nhập hàng dễ dàng</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold">Báo cáo thống kê</h3>
                  <p className="text-sm text-gray-600">Phân tích dữ liệu và tạo báo cáo tùy chỉnh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
