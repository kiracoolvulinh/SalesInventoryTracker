import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Edit, ArrowUp, ArrowDown } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

// Define form schema
const priceAdjustmentSchema = z.object({
  productId: z.string().min(1, "Sản phẩm là bắt buộc"),
  oldPrice: z.number(),
  newPrice: z.number().min(0, "Giá mới không được âm"),
});

type PriceAdjustmentFormValues = z.infer<typeof priceAdjustmentSchema>;

export default function PriceAdjustmentPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form for price adjustment
  const form = useForm<PriceAdjustmentFormValues>({
    resolver: zodResolver(priceAdjustmentSchema),
    defaultValues: {
      productId: "",
      oldPrice: 0,
      newPrice: 0,
    },
  });

  // Fetch products
  const { 
    data: products = [], 
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError
  } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch categories for filter
  const { 
    data: categories = [],
    isLoading: isCategoriesLoading 
  } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch price adjustment history
  const { 
    data: priceAdjustments = [], 
    isLoading: isPriceAdjustmentsLoading,
    isError: isPriceAdjustmentsError,
    error: priceAdjustmentsError,
    refetch: refetchPriceAdjustments
  } = useQuery({
    queryKey: ['/api/price-adjustments'],
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedProduct(null);
      form.reset({
        productId: "",
        oldPrice: 0,
        newPrice: 0,
      });
    }
  }, [isDialogOpen, form]);

  // Update form values when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      form.setValue("productId", selectedProduct.id.toString());
      form.setValue("oldPrice", selectedProduct.sellingPrice);
      form.setValue("newPrice", selectedProduct.sellingPrice);
    }
  }, [selectedProduct, form]);

  // Create price adjustment mutation
  const adjustPriceMutation = useMutation({
    mutationFn: async (data: PriceAdjustmentFormValues & { userId: number }) => {
      const res = await apiRequest("POST", "/api/price-adjustments", {
        productId: parseInt(data.productId),
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
        userId: data.userId,
        date: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã điều chỉnh giá sản phẩm",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/price-adjustments'] });
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
  const onSubmit = (data: PriceAdjustmentFormValues) => {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để thực hiện điều chỉnh giá",
        variant: "destructive",
      });
      return;
    }
    
    adjustPriceMutation.mutate({
      ...data,
      userId: user.id,
    });
  };

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    const product = products.find((p: any) => p.id === parseInt(productId));
    if (product) {
      setSelectedProduct(product);
    }
  };

  // Get category name by id
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "Không rõ";
  };

  // Filter products based on applied filters
  let filteredProducts = [...products];
  
  // Apply category filter
  if (categoryFilter) {
    filteredProducts = filteredProducts.filter(
      (product: any) => product.categoryId === parseInt(categoryFilter)
    );
  }
  
  // Apply search filter
  if (searchQuery) {
    const lowerCaseQuery = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product: any) => 
        product.name.toLowerCase().includes(lowerCaseQuery) || 
        product.code.toLowerCase().includes(lowerCaseQuery)
    );
  }

  // Get username by user id
  const getUsernameById = (userId: number) => {
    return userId === user?.id ? 
      (user.fullName || user.username) : 
      `Người dùng ID: ${userId}`;
  };

  // Get product name by id
  const getProductNameById = (productId: number) => {
    const product = products.find((p: any) => p.id === productId);
    return product ? product.name : `Sản phẩm ID: ${productId}`;
  };

  // Calculate price change percentage
  const calculatePriceChange = (oldPrice: number, newPrice: number) => {
    if (oldPrice === 0) return 100;
    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    return change;
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Điều chỉnh giá bán</h2>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between mb-4 space-y-3 md:space-y-0 md:space-x-2">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả nhóm hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả nhóm hàng</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="relative sm:w-64">
            <Input 
              type="text" 
              placeholder="Tìm kiếm hàng hóa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {isProductsLoading || isCategoriesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isProductsError ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-700">Lỗi khi tải dữ liệu: {(productsError as Error).message}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-light">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Mã hàng
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Tên hàng
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Nhóm hàng
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Giá nhập
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Giá bán hiện tại
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-light">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">
                      Không có dữ liệu sản phẩm
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product: any) => (
                    <tr key={product.id} className="hover:bg-neutral-lightest">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-dark">
                        {product.code}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                        {getCategoryName(product.categoryId)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                        {product.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                        {new Intl.NumberFormat('vi-VN').format(product.purchasePrice)} ₫
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                        {new Intl.NumberFormat('vi-VN').format(product.sellingPrice)} ₫
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <Dialog open={isDialogOpen && selectedProduct?.id === product.id} onOpenChange={setIsDialogOpen}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDialogOpen(true);
                            }}
                            className="text-primary hover:text-primary-dark hover:bg-neutral-lightest"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Điều chỉnh giá bán</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="productId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Sản phẩm</FormLabel>
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          handleProductSelect(value);
                                        }}
                                        disabled={true}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Chọn sản phẩm" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {products.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                              {p.name} ({p.code})
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
                                  name="oldPrice"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Giá bán hiện tại</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field}
                                          disabled={true}
                                          value={field.value}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="newPrice"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Giá bán mới <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            field.onChange(value || 0);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                {form.watch("newPrice") !== form.watch("oldPrice") && (
                                  <div className="flex items-center space-x-2 py-2">
                                    <span>
                                      {form.watch("newPrice") > form.watch("oldPrice") ? (
                                        <ArrowUp className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <ArrowDown className="h-5 w-5 text-red-600" />
                                      )}
                                    </span>
                                    <span className={
                                      form.watch("newPrice") > form.watch("oldPrice") 
                                        ? "text-green-600 font-medium" 
                                        : "text-red-600 font-medium"
                                    }>
                                      {Math.abs(calculatePriceChange(form.watch("oldPrice"), form.watch("newPrice"))).toFixed(2)}%
                                    </span>
                                  </div>
                                )}
                                
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline" type="button">Hủy</Button>
                                  </DialogClose>
                                  <Button 
                                    type="submit" 
                                    disabled={
                                      adjustPriceMutation.isPending || 
                                      form.watch("newPrice") === form.watch("oldPrice")
                                    }
                                  >
                                    {adjustPriceMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                      </>
                                    ) : "Cập nhật giá"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-heading font-bold mb-4">Lịch sử điều chỉnh giá</h3>
        
        {isPriceAdjustmentsLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isPriceAdjustmentsError ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-700">Lỗi khi tải dữ liệu: {(priceAdjustmentsError as Error).message}</p>
            </CardContent>
          </Card>
        ) : priceAdjustments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có lịch sử điều chỉnh giá nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-light">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Giá cũ
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Giá mới
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Thay đổi
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Người thực hiện
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-light">
                {priceAdjustments.map((adjustment: any) => (
                  <tr key={adjustment.id} className="hover:bg-neutral-lightest">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                      {format(new Date(adjustment.date), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                      {getProductNameById(adjustment.productId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                      {new Intl.NumberFormat('vi-VN').format(adjustment.oldPrice)} ₫
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                      {new Intl.NumberFormat('vi-VN').format(adjustment.newPrice)} ₫
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {adjustment.newPrice > adjustment.oldPrice ? (
                          <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={
                          adjustment.newPrice > adjustment.oldPrice 
                            ? "text-green-600 font-medium" 
                            : "text-red-600 font-medium"
                        }>
                          {Math.abs(calculatePriceChange(adjustment.oldPrice, adjustment.newPrice)).toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                      {getUsernameById(adjustment.userId)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
