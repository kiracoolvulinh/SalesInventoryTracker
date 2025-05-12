import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  Search, 
  FileDown, 
  AlertTriangle,
  TrendingDown,
  ArrowUpDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch inventory data
  const { 
    data: products = [], 
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError
  } = useQuery({
    queryKey: ['/api/inventory'],
  });

  // Fetch categories for filter
  const { 
    data: categories = [],
    isLoading: isCategoriesLoading 
  } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Generate CSV export of inventory
  const handleExportCSV = () => {
    try {
      // Create header row
      let csvContent = "Mã hàng,Tên hàng,Đơn vị,Giá nhập,Giá bán,Số lượng tồn kho\n";
      
      // Add data rows
      filteredProducts.forEach((product: any) => {
        const row = [
          product.code,
          product.name,
          product.unit,
          product.purchasePrice,
          product.sellingPrice,
          product.stock
        ].join(',');
        csvContent += row + "\n";
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Xuất dữ liệu thành công",
        description: "Đã tải xuống file dữ liệu tồn kho",
      });
    } catch (error) {
      toast({
        title: "Lỗi xuất dữ liệu",
        description: "Đã xảy ra lỗi khi xuất dữ liệu",
        variant: "destructive",
      });
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
  
  // Apply stock filter
  if (stockFilter) {
    switch (stockFilter) {
      case "low":
        filteredProducts = filteredProducts.filter((product: any) => product.stock <= 5);
        break;
      case "out":
        filteredProducts = filteredProducts.filter((product: any) => product.stock === 0);
        break;
      case "available":
        filteredProducts = filteredProducts.filter((product: any) => product.stock > 0);
        break;
    }
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

  // Apply sorting
  filteredProducts.sort((a: any, b: any) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "stock":
        comparison = a.stock - b.stock;
        break;
      case "purchase":
        comparison = a.purchasePrice - b.purchasePrice;
        break;
      case "selling":
        comparison = a.sellingPrice - b.sellingPrice;
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Calculate totals
  const totalProducts = products.length;
  const lowStockProducts = products.filter((product: any) => product.stock <= 5 && product.stock > 0).length;
  const outOfStockProducts = products.filter((product: any) => product.stock === 0).length;

  // Handle toggle sort order
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Quản lý tồn kho</h2>
          <Button 
            onClick={handleExportCSV}
            className="flex items-center"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-medium">Tổng sản phẩm</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <ArrowUpDown className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-medium">Sắp hết hàng</p>
                <p className="text-2xl font-bold">{lowStockProducts}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-medium">Hết hàng</p>
                <p className="text-2xl font-bold">{outOfStockProducts}</p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
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
            
            <div className="relative">
              <Select
                value={stockFilter}
                onValueChange={setStockFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả trạng thái</SelectItem>
                  <SelectItem value="available">Còn hàng</SelectItem>
                  <SelectItem value="low">Sắp hết hàng</SelectItem>
                  <SelectItem value="out">Hết hàng</SelectItem>
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
                    <button 
                      onClick={() => handleSort("name")}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Tên hàng</span>
                      {sortBy === "name" && (
                        <span className="material-icons text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Nhóm hàng
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort("purchase")}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Giá nhập</span>
                      {sortBy === "purchase" && (
                        <span className="material-icons text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort("selling")}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Giá bán</span>
                      {sortBy === "selling" && (
                        <span className="material-icons text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort("stock")}
                      className="flex items-center space-x-1 hover:text-primary"
                    >
                      <span>Số lượng tồn kho</span>
                      {sortBy === "stock" && (
                        <span className="material-icons text-xs">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-light">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                      Không có dữ liệu tồn kho
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {product.stock === 0 ? (
                          <Badge variant="destructive">Hết hàng</Badge>
                        ) : product.stock <= 5 ? (
                          <Badge className="bg-yellow-500">Sắp hết</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            Còn hàng
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
