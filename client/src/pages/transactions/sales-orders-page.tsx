import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "wouter";

// Define form schema for sales order
const salesOrderSchema = z.object({
  code: z.string().min(1, "Mã phiếu xuất là bắt buộc"),
  date: z.date(),
  customerType: z.string().min(1, "Loại khách hàng là bắt buộc"),
  customerId: z.string().optional(),
  totalAmount: z.number().min(0),
  customerPayment: z.number().min(0),
  paymentMethod: z.string().min(1, "Hình thức thanh toán là bắt buộc"),
  status: z.string().min(1, "Trạng thái là bắt buộc"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Sản phẩm là bắt buộc"),
      quantity: z.coerce.number().min(1, "Số lượng phải lớn hơn 0"),
      price: z.coerce.number().min(0, "Đơn giá không được âm"),
      amount: z.number(),
    })
  ).min(1, "Phải có ít nhất một sản phẩm"),
});

type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;

export default function SalesOrdersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Form for adding sales order
  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      code: "",
      date: new Date(),
      customerType: "anonymous",
      customerId: "",
      totalAmount: 0,
      customerPayment: 0,
      paymentMethod: "cash",
      status: "completed",
      items: [
        {
          productId: "",
          quantity: 1,
          price: 0,
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
  const customerPayment = form.watch("customerPayment");
  const customerType = form.watch("customerType");

  // Calculate the total amount whenever items change
  useEffect(() => {
    const totalAmount = items.reduce((sum, item) => {
      const amount = item.quantity * item.price;
      form.setValue(`items.${items.indexOf(item)}.amount`, amount);
      return sum + amount;
    }, 0);

    form.setValue("totalAmount", totalAmount);
  }, [items, form]);

  // Fetch customers for the dropdown
  const { 
    data: customers = [],
    isLoading: isCustomersLoading 
  } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Fetch products for the dropdown
  const { 
    data: products = [],
    isLoading: isProductsLoading 
  } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch sales orders
  const { 
    data: salesOrders = [], 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/sales-orders'],
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset({
        code: generateOrderCode(),
        date: new Date(),
        customerType: "anonymous",
        customerId: "",
        totalAmount: 0,
        customerPayment: 0,
        paymentMethod: "cash",
        status: "completed",
        items: [
          {
            productId: "",
            quantity: 1,
            price: 0,
            amount: 0,
          },
        ],
      });
    }
  }, [isDialogOpen, form]);

  // Create sales order mutation
  const createMutation = useMutation({
    mutationFn: async (data: SalesOrderFormValues) => {
      const formattedData = {
        order: {
          code: data.code,
          date: data.date.toISOString(),
          customerType: data.customerType,
          customerId: data.customerType === "regular" && data.customerId ? parseInt(data.customerId) : null,
          totalAmount: data.totalAmount,
          customerPayment: data.customerPayment,
          paymentMethod: data.paymentMethod,
          status: data.status,
        },
        items: data.items.map(item => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          price: item.price,
          amount: item.amount,
        }))
      };
      
      const res = await apiRequest("POST", "/api/sales-orders", formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo phiếu xuất hàng mới",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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

  // Handle form submission
  const onSubmit = (data: SalesOrderFormValues) => {
    createMutation.mutate(data);
  };

  // Auto-generate order code
  const generateOrderCode = () => {
    if (salesOrders.length === 0) return "PX0001";
    
    // Find the highest order code number
    const codes = salesOrders.map((order: any) => {
      const match = order.code.match(/PX(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const highestCode = Math.max(...codes);
    const nextCode = highestCode + 1;
    
    // Format with leading zeros
    return `PX${nextCode.toString().padStart(4, '0')}`;
  };

  // Handle adding a new item row
  const handleAddItem = () => {
    append({
      productId: "",
      quantity: 1,
      price: 0,
      amount: 0,
    });
  };

  // Get product details by id
  const getProductById = (productId: string) => {
    return products.find((product: any) => product.id === parseInt(productId));
  };

  // Handle product selection to set default price
  const handleProductSelection = (productId: string, index: number) => {
    const product = getProductById(productId);
    if (product) {
      form.setValue(`items.${index}.price`, product.sellingPrice);
    }
  };

  // Filter sales orders by status
  const filteredOrders = statusFilter
    ? salesOrders.filter((order: any) => order.status === statusFilter)
    : salesOrders;

  // Filter orders by date range if set
  const dateFilteredOrders = dateRange.from
    ? filteredOrders.filter((order: any) => {
        const orderDate = new Date(order.date);
        return dateRange.from && orderDate >= dateRange.from && 
               (!dateRange.to || orderDate <= dateRange.to);
      })
    : filteredOrders;

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Hoàn thành</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Chờ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get customer name by id
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((cust: any) => cust.id === customerId);
    return customer ? customer.name : "Khách hàng không xác định";
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Quản lý bán hàng</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Tạo phiếu bán
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo phiếu bán hàng</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã phiếu xuất</FormLabel>
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
                          <FormLabel>Ngày xuất</FormLabel>
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
                                onSelect={field.onChange}
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
                      name="customerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loại khách hàng <span className="text-red-500">*</span></FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại khách hàng" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="anonymous">Ẩn danh</SelectItem>
                              <SelectItem value="regular">Khách thường</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {customerType === "regular" && (
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Khách hàng <span className="text-red-500">*</span></FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn khách hàng" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.name} - {customer.phone}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-4">Danh sách hàng hóa xuất</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-light">
                        <thead>
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">STT</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Mã hàng</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Tên hàng</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Đơn vị</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Số lượng</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Đơn giá</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-neutral-dark">Thành tiền</th>
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
                                {field.productId && getProductById(field.productId.toString())?.name}
                              </td>
                              <td className="px-2 py-2 text-sm">
                                {field.productId && getProductById(field.productId.toString())?.unit}
                              </td>
                              <td className="px-2 py-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem className="m-0 space-y-1">
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          className="w-20"
                                          {...field}
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
                                  name={`items.${index}.price`}
                                  render={({ field }) => (
                                    <FormItem className="m-0 space-y-1">
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          className="w-28"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="px-2 py-2 text-sm font-medium">
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
                    <div></div>
                    
                    <div className="flex flex-col space-y-4 border rounded-md p-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Tổng tiền hàng:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('vi-VN').format(form.getValues("totalAmount"))} ₫
                        </span>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="customerPayment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Khách trả</FormLabel>
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
                      
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hình thức thanh toán</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn hình thức thanh toán" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Tiền mặt</SelectItem>
                                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                                <SelectItem value="card">Quẹt thẻ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Tiền thừa trả lại:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('vi-VN').format(
                            Math.max(0, form.getValues("customerPayment") - form.getValues("totalAmount"))
                          )} ₫
                        </span>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trạng thái</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="completed">Hoàn thành</SelectItem>
                                <SelectItem value="pending">Chờ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      ) : "Tạo phiếu bán"}
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
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả trạng thái</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="pending">Chờ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="relative sm:w-64">
            <Input 
              type="text" 
              placeholder="Tìm kiếm phiếu bán..." 
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
                      Mã phiếu xuất
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Ngày xuất
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Tổng tiền hàng
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-light">
                  {dateFilteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                        Không có dữ liệu phiếu bán
                      </td>
                    </tr>
                  ) : (
                    dateFilteredOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-neutral-lightest">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-dark">
                          {order.code}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {format(new Date(order.date), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {order.customerType === "regular" && order.customerId 
                            ? getCustomerName(order.customerId)
                            : "Khách lẻ"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {new Intl.NumberFormat('vi-VN').format(order.totalAmount)} ₫
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {formatStatus(order.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                          <Link to={`/transactions/sales-orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
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
