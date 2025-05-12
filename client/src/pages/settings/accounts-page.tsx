import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Search, Shield, UserX, User, UserCheck } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Define form schema for user account
const userSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional(),
  confirmPassword: z.string().optional(),
  roleId: z.string().min(1, "Vai trò là bắt buộc"),
  isActive: z.boolean().default(true),
}).refine(data => 
  !data.password || !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AccountsPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form for adding/editing user
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      roleId: "",
      isActive: true,
    },
  });

  // Fetch roles for the dropdown
  const { 
    data: roles = [],
    isLoading: isRolesLoading 
  } = useQuery({
    queryKey: ['/api/roles'],
  });

  // Fetch users
  const { 
    data: users = [], 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/users'],
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingUser(null);
      form.reset({
        username: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        roleId: "",
        isActive: true,
      });
    }
  }, [isDialogOpen, form]);

  // Set form values when editing a user
  useEffect(() => {
    if (editingUser) {
      form.reset({
        username: editingUser.username,
        fullName: editingUser.fullName,
        password: "",
        confirmPassword: "",
        roleId: editingUser.roleId.toString(),
        isActive: editingUser.isActive,
      });
    }
  }, [editingUser, form]);

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/users", {
        ...userData,
        roleId: parseInt(userData.roleId)
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm tài khoản mới",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<UserFormValues> }) => {
      const { confirmPassword, ...userData } = data;
      const payload: any = {
        ...userData,
      };
      
      if (userData.roleId) {
        payload.roleId = parseInt(userData.roleId);
      }
      
      // Only include password if it was changed
      if (!userData.password) {
        delete payload.password;
      }
      
      const res = await apiRequest("PUT", `/api/users/${id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật tài khoản",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa tài khoản",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeleteTargetId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? users.filter((user: any) => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  // Get role name by id
  const getRoleName = (roleId: number) => {
    const role = roles.find((r: any) => r.id === roleId);
    return role ? role.name : "Không rõ";
  };

  // Check if a user is admin
  const isAdmin = (roleId: number) => {
    const role = roles.find((r: any) => r.id === roleId);
    return role?.name === "Admin";
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Danh mục tài khoản</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Thêm mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên đăng nhập <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nhập tên đăng nhập" 
                            {...field}
                            disabled={!!editingUser} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ tên <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập họ tên" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {editingUser ? "Mật khẩu mới" : "Mật khẩu"} 
                          {!editingUser && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={editingUser ? "Để trống nếu không thay đổi" : "Nhập mật khẩu"} 
                            {...field}
                          />
                        </FormControl>
                        {editingUser && (
                          <FormDescription>
                            Để trống nếu không muốn thay đổi mật khẩu
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Xác nhận mật khẩu
                          {!editingUser && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Nhập lại mật khẩu" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vai trò <span className="text-red-500">*</span></FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role: any) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Trạng thái hoạt động</FormLabel>
                          <FormDescription>
                            Tài khoản sẽ {field.value ? "có" : "không có"} quyền đăng nhập vào hệ thống
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Hủy</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        editingUser ? "Cập nhật" : "Thêm mới"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between mb-4 space-y-3 md:space-y-0">
          <div></div>
          <div className="relative sm:w-64">
            <Input 
              type="text" 
              placeholder="Tìm kiếm tài khoản..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {isLoading || isRolesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-700">Lỗi khi tải dữ liệu: {(error as Error).message}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-light">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Tên đăng nhập
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-light">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                        Không có dữ liệu tài khoản
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user: any) => (
                      <tr key={user.id} className="hover:bg-neutral-lightest">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-dark">
                          {user.username}
                          {currentUser?.id === user.id && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              Bạn
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {user.fullName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          <div className="flex items-center">
                            {isAdmin(user.roleId) ? (
                              <Shield className="h-4 w-4 text-blue-500 mr-1" />
                            ) : (
                              <User className="h-4 w-4 text-gray-500 mr-1" />
                            )}
                            {getRoleName(user.roleId)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Kích hoạt
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center">
                              <UserX className="h-3 w-3 mr-1" />
                              Đã khóa
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="text-primary hover:text-primary-dark hover:bg-neutral-lightest"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog open={deleteTargetId === user.id} onOpenChange={(open) => {
                            if (!open) setDeleteTargetId(null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                disabled={currentUser?.id === user.id}
                                className="text-destructive hover:text-destructive hover:bg-neutral-lightest"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa tài khoản "{user.username}" ({user.fullName})? 
                                  Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Đang xóa...
                                    </>
                                  ) : (
                                    "Xóa"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
