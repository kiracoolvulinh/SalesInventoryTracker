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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const supplierSchema = z.object({
  code: z.string().min(1, "Mã nhà cung cấp là bắt buộc"),
  name: z.string().min(1, "Tên nhà cung cấp là bắt buộc"),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form for adding/editing supplier
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      address: "",
      contactPerson: "",
      notes: ""
    },
  });

  // Fetch suppliers with search filter
  const { 
    data: suppliers = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/suppliers', searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, search] = queryKey;
      let url = '/api/suppliers';
      if (search) url += `?search=${search}`;
      
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Không thể tải danh sách nhà cung cấp');
      return res.json();
    }
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingSupplier(null);
      form.reset({
        code: "",
        name: "",
        phone: "",
        address: "",
        contactPerson: "",
        notes: ""
      });
    }
  }, [isDialogOpen, form]);

  // Set form values when editing a supplier
  useEffect(() => {
    if (editingSupplier) {
      form.reset({
        code: editingSupplier.code,
        name: editingSupplier.name,
        phone: editingSupplier.phone || "",
        address: editingSupplier.address || "",
        contactPerson: editingSupplier.contactPerson || "",
        notes: editingSupplier.notes || ""
      });
    }
  }, [editingSupplier, form]);

  // Create supplier mutation
  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm nhà cung cấp mới",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
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

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SupplierFormValues }) => {
      const res = await apiRequest("PUT", `/api/suppliers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật nhà cung cấp",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
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

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa nhà cung cấp",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
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
  const onSubmit = (data: SupplierFormValues) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
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

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Danh mục nhà cung cấp</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Thêm mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSupplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã nhà cung cấp <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nhập mã nhà cung cấp" 
                            {...field}
                            disabled={!!editingSupplier} 
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
                        <FormLabel>Tên nhà cung cấp <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên nhà cung cấp" {...field} />
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
                        <FormLabel>Điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập số điện thoại" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
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
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Người đại diện</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên người đại diện" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
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
                        editingSupplier ? "Cập nhật" : "Thêm mới"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="relative sm:w-64">
            <Input 
              type="text" 
              placeholder="Tìm kiếm nhà cung cấp..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button onClick={handleSearch}>Tìm kiếm</Button>
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
                      Mã nhà cung cấp
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Tên nhà cung cấp
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Điện thoại
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Địa chỉ
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Người đại diện
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-light">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                        Không có dữ liệu nhà cung cấp
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier: any) => (
                      <tr key={supplier.id} className="hover:bg-neutral-lightest">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-dark">
                          {supplier.code}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {supplier.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {supplier.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-dark">
                          {supplier.address || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-dark">
                          {supplier.contactPerson || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="text-primary hover:text-primary-dark hover:bg-neutral-lightest"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog open={deleteTargetId === supplier.id} onOpenChange={(open) => {
                            if (!open) setDeleteTargetId(null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(supplier.id)}
                                className="text-destructive hover:text-destructive hover:bg-neutral-lightest"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa nhà cung cấp "{supplier.name}"? 
                                  Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(supplier.id)}
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
