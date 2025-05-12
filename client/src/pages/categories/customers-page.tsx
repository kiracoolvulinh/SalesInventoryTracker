import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const customerSchema = z.object({
  code: z.string().min(1, "Mã khách hàng là bắt buộc"),
  name: z.string().min(1, "Tên khách hàng là bắt buộc"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  address: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  customerType: z.string().default("regular"),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("");

  // Form for adding/editing customer
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      address: "",
      email: "",
      customerType: "regular",
      notes: ""
    },
  });

  // Fetch customers with search filter
  const { 
    data: customers = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/customers', searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, search] = queryKey;
      let url = '/api/customers';
      if (search) url += `?search=${search}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Không thể tải danh sách khách hàng');
      return res.json();
    }
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingCustomer(null);
      form.reset({
        code: "",
        name: "",
        phone: "",
        address: "",
        email: "",
        customerType: "regular",
        notes: ""
      });
    }
  }, [isDialogOpen, form]);

  // Set form values when editing a customer
  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        code: editingCustomer.code,
        name: editingCustomer.name,
        phone: editingCustomer.phone || "",
        address: editingCustomer.address || "",
        email: editingCustomer.email || "",
        customerType: editingCustomer.customerType || "regular",
        notes: editingCustomer.notes || ""
      });
    }
  }, [editingCustomer, form]);

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm khách hàng mới",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
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

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CustomerFormValues }) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật khách hàng",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
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

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa khách hàng",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
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
  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  // Handle search
  const handleSearch = () => {
    refetch();
  };

  // Filter customers based on customer type
  const filteredCustomers = customerTypeFilter
    ? customers.filter((customer: any) => customer.customerType === customerTypeFilter)
    : customers;

  // Auto-generate customer code for new customers
  const generateCustomerCode = () => {
    if (customers.length === 0) return "KH0001";
    
    // Find the highest customer code number
    const codes = customers.map((customer: any) => {
      const match = customer.code.match(/KH(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const highestCode = Math.max(...codes);
    const nextCode = highestCode + 1;
    
    // Format with leading zeros
    return `KH${nextCode.toString().padStart(4, '0')}`;
  };

  // Set auto-generated code when opening the dialog for a new customer
  useEffect(() => {
    if (isDialogOpen && !editingCustomer) {
      form.setValue("code", generateCustomerCode());
    }
  }, [isDialogOpen, editingCustomer, form, customers]);

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Danh mục khách hàng</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Thêm mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã khách hàng <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Mã khách hàng" 
                              {...field}
                              disabled={true} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên khách hàng <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập tên khách hàng" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Điện thoại <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập số điện thoại" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nhóm khách hàng</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn nhóm khách hàng" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="regular">Khách thường</SelectItem>
                              <SelectItem value="vip">Khách VIP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập email" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Địa chỉ</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập địa chỉ" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Ghi chú</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Nhập ghi chú" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                        editingCustomer ? "Cập nhật" : "Thêm mới"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between mb-4 space-y-3 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Select
                value={customerTypeFilter}
                onValueChange={setCustomerTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả nhóm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả nhóm</SelectItem>
                  <SelectItem value="regular">Khách thường</SelectItem>
                  <SelectItem value="vip">Khách VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <div className="relative sm:w-64">
              <Input 
                type="text" 
                placeholder="Tìm kiếm khách hàng..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={handleSearch}>Tìm kiếm</Button>
          </div>
        </div>
        
        {isLoading ? (
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
                      Mã khách hàng
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Tên khách hàng
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Điện thoại
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Nợ hiện tại
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Tổng đã bán
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-light">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                        Không có dữ liệu khách hàng
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-neutral-lightest">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-dark">
                          {customer.code}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {customer.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {customer.phone}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={customer.debt > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                            {new Intl.NumberFormat('vi-VN').format(customer.debt)} ₫
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {new Intl.NumberFormat('vi-VN').format(customer.totalPurchase)} ₫
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                            className="text-primary hover:text-primary-dark hover:bg-neutral-lightest"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog open={deleteTargetId === customer.id} onOpenChange={(open) => {
                            if (!open) setDeleteTargetId(null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(customer.id)}
                                className="text-destructive hover:text-destructive hover:bg-neutral-lightest"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa khách hàng "{customer.name}"? 
                                  Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(customer.id)}
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
            
            {/* Pagination would go here */}
            <div className="flex items-center justify-between mt-4 border-t border-neutral-light pt-4">
              <div className="text-sm text-neutral-medium">
                Hiển thị 1-{filteredCustomers.length} trên tổng số {filteredCustomers.length} khách hàng
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
