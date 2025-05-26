import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { apiRequest2 } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Eye, Search, CalendarIcon, Trash2 } from "lucide-react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { vi } from "date-fns/locale";
import { Link } from "wouter";
import type { Product, Supplier, PurchaseOrder } from "@shared/schema";

// Define form schema
const purchaseOrderSchema = z.object({
  code: z.string().min(1, "Mã phiếu nhập là bắt buộc"),
  date: z.date(),
  supplierId: z.string().min(1, "Nhà cung cấp là bắt buộc"),
  documents: z.string().optional(),
  totalAmount: z.number().min(0),
  paidAmount: z.number().min(0),
  debt: z.number(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Sản phẩm là bắt buộc"),
      quantity: z.coerce.number().min(1, "Số lượng phải lớn hơn 0"),
      purchasePrice: z.coerce.number().min(0, "Giá nhập không được âm"),
      sellingPrice: z.coerce.number().min(0, "Giá bán không được âm"),
      amount: z.number(),
    })
  ).min(1, "Phải có ít nhất một sản phẩm"),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Form for adding purchase order
  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      code: "",
      date: new Date(),
      supplierId: "",
      documents: "",
      totalAmount: 0,
      paidAmount: 0,
      debt: 0,
      notes: "",
      items: [
        {
          productId: "",
          quantity: 1,
          purchasePrice: 0,
          sellingPrice: 0,
          amount: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch form values to calculate totals
  const items = form.watch("items");
  const paidAmount = form.watch("paidAmount");

  // Calculate the total amount and debt whenever items or paid amount changes
  useEffect(() => {
    const totalAmount = items.reduce((sum, item) => {
      const amount = item.quantity * item.purchasePrice;
      form.setValue(`items.${items.indexOf(item)}.amount`, amount);
      return sum + amount;
    }, 0);

    form.setValue("totalAmount", totalAmount);
    form.setValue("debt", totalAmount - (paidAmount || 0));
  }, [items, paidAmount, form]);

  // Fetch suppliers for the dropdown
  const { 
    data: suppliers = [] as Supplier[], 
    isLoading: isSuppliersLoading 
  } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  // Fetch products for the dropdown
  const { 
    data: products = [] as Product[], 
    isLoading: isProductsLoading 
  } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch purchase orders
  const { 
    data: purchaseOrders = [] as PurchaseOrder[], 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/purchase-orders'],
  });

  // Auto-generate order code
  const generateOrderCode = () => {
    if (!purchaseOrders || purchaseOrders.length === 0) return "PN0001";
    
    // Find the highest order code number
    const codes = purchaseOrders.map((order: any) => {
      const match = order.code.match(/PN(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const highestCode = Math.max(...codes);
    const nextCode = highestCode + 1;
    
    // Format with leading zeros
    return `PN${nextCode.toString().padStart(4, '0')}`;
  };

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset({
        code: generateOrderCode(),
        date: new Date(),
        supplierId: "",
        totalAmount: 0,
        paidAmount: 0,
        paymentMethod: "cash",
        status: "completed",
        items: [
          {
            productId: "",
            quantity: 1,
            purchasePrice: 0,
            amount: 0,
          },
        ],
      });
    }
  }, [isDialogOpen, form, purchaseOrders]);

  // Create purchase order mutation
  const createMutation = useMutation({
    mutationFn: async (data: PurchaseOrderFormValues) => {
      try {
      const formattedData = {
        order: {
          code: data.code,
          date:  data.date,
          supplierId: parseInt(data.supplierId),
          documents: data.documents || "",
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          debt: data.debt,
          notes: data.notes || "",
        },
        items: data.items.map(item => ({
          purchaseOrderId: 0,
          productId: parseInt(item.productId),
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          amount: item.amount,
        }))
      };
      
        console.log('Sending purchase order data:', formattedData);
      const res = await apiRequest2("POST", "/api/purchase-orders", formattedData);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to create purchase order');
        }
        
      return await res.json();
      } catch (error) {
        console.error('Error creating purchase order:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo phiếu nhập hàng mới",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo phiếu nhập hàng",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: PurchaseOrderFormValues) => {
    createMutation.mutate(data);
  };

  // Handle adding a new item row
  const handleAddItem = () => {
    append({
      productId: "",
      quantity: 1,
      purchasePrice: 0,
      sellingPrice: 0,
      amount: 0,
    });
  };

  // Get product details by id
  const getProductById = (productId: string) => {
    return products.find((product: any) => product.id === parseInt(productId));
  };

  // Handle product selection
  const handleProductSelection = (productId: string, index: number) => {
    const product = products.find((p: any) => p.id.toString() === productId);
    if (product) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.purchasePrice`, product.purchasePrice);
      form.setValue(`items.${index}.sellingPrice`, product.sellingPrice);
      // Recalculate amount after setting prices
      const quantity = form.getValues(`items.${index}.quantity`);
      const amount = quantity * product.purchasePrice;
      form.setValue(`items.${index}.amount`, amount);
      
      // Update total amount
      const items = form.getValues("items");
      const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      form.setValue("totalAmount", totalAmount);
      form.setValue("debt", totalAmount - (form.getValues("paidAmount") || 0));
    }
  };

  // Handle quantity change
  const handleQuantityChange = (value: string, index: number) => {
    const quantity = parseFloat(value) || 0;
    const purchasePrice = form.getValues(`items.${index}.purchasePrice`);
    const amount = quantity * purchasePrice;
    form.setValue(`items.${index}.amount`, amount);
    
    // Update total amount
    const items = form.getValues("items");
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    form.setValue("totalAmount", totalAmount);
    form.setValue("debt", totalAmount - (form.getValues("paidAmount") || 0));
  };

  // Handle price change
  const handlePriceChange = (value: string, index: number) => {
    const price = parseFloat(value) || 0;
    const quantity = form.getValues(`items.${index}.quantity`);
    const amount = quantity * price;
    form.setValue(`items.${index}.amount`, amount);
    
    // Update total amount
    const items = form.getValues("items");
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    form.setValue("totalAmount", totalAmount);
    form.setValue("debt", totalAmount - (form.getValues("paidAmount") || 0));
  };

  // Delete purchase order mutation
  const deleteMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("DELETE", `/api/purchase-orders/${orderId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete purchase order');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa phiếu nhập hàng",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phiếu nhập hàng",
        variant: "destructive",
      });
    },
  });

  // Handle delete purchase order
  const handleDelete = (orderId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu nhập hàng này?")) {
      deleteMutation.mutate(orderId);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Quản lý nhập hàng</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Tạo phiếu nhập
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo phiếu nhập hàng</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã phiếu nhập</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Ngày nhập</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Chọn ngày</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => field.onChange(date instanceof Date ? date : new Date(date))}
                                locale={vi}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nhà cung cấp <span className="text-red-500">*</span></FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn nhà cung cấp" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier: any) => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.name}
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
                      name="documents"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Chứng từ đi kèm</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập số chứng từ đi kèm" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-4">Danh sách hàng hóa nhập</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-light">
                        <thead>
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">STT</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Mã hàng</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark w-50">Tên hàng</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark w-24">Số lượng</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Giá nhập</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Giá bán</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark w-35">Thành tiền</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-neutral-dark">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-light">
                          {fields.map((field, index) => (
                            <tr key={field.id}>
                              <td className="px-2 py-2 text-sm">{index + 1}</td>
                              <td className="px-2 py-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.productId`}
                                  render={({ field }) => (
                                    <FormItem className="m-0 space-y-1">
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          handleProductSelection(value, index);
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Chọn sản phẩm" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {products.map((product: any) => (
                                            <SelectItem key={product.id} value={product.id.toString()}>
                                              {product.code}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="px-2 py-2 text-sm">
                                {form.watch(`items.${index}.productId`) && 
                                  products.find((p: any) => p.id.toString() === form.watch(`items.${index}.productId`))?.name}
                              </td>
                              <td className="px-2 py-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1"
                                          className="w-20"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            handleQuantityChange(e.target.value, index);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.purchasePrice`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="0"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(e);
                                            handlePriceChange(e.target.value, index);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.sellingPrice`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="0"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="px-2 py-2 text-sm font-medium w-40">
                                {new Intl.NumberFormat('vi-VN').format(form.getValues(`items.${index}.amount`))} ₫
                              </td>
                              <td className="px-2 py-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={fields.length === 1}
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="mt-4"
                    >
                      Thêm sản phẩm
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
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
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-4 border rounded-md p-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Tổng tiền hàng:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('vi-VN').format(form.getValues("totalAmount"))} ₫
                        </span>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="paidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiền thanh toán</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Công nợ:</span>
                        <span className="font-medium text-red-600">
                          {new Intl.NumberFormat('vi-VN').format(form.getValues("debt"))} ₫
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Hủy</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : "Tạo phiếu nhập"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between mb-4 space-y-3 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className="w-[300px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Chọn khoảng thời gian</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={vi}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="relative sm:w-64">
            <Input 
              type="text" 
              placeholder="Tìm kiếm phiếu nhập..." 
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                      Mã phiếu nhập
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Thời gian nhập
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Nhà cung cấp
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Tổng tiền hàng
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Đã thanh toán
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Công nợ
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-light">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">
                        Không có dữ liệu phiếu nhập
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-neutral-lightest">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-dark">
                          {order.code}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {format(new Date(order.date), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {suppliers.find((s: any) => s.id === order.supplierId)?.name || "Không rõ"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {new Intl.NumberFormat('vi-VN').format(order.totalAmount)} ₫
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {new Intl.NumberFormat('vi-VN').format(order.paidAmount)} ₫
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          <span className={order.debt > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                            {new Intl.NumberFormat('vi-VN').format(order.debt)} ₫
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                          <Link to={`/transactions/purchase-orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive-dark"
                              onClick={() => handleDelete(order.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
