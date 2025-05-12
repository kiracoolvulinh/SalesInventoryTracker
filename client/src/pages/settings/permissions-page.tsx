import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Search, Lock, Check, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Define permission structure
type Permission = {
  module: string;
  actions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
};

// Define form schema for role
const roleSchema = z.object({
  name: z.string().min(1, "Tên vai trò là bắt buộc"),
  permissions: z.object({}).passthrough(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function PermissionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Define modules and their permissions
  const modules = [
    { id: "categories", name: "Danh mục", actions: ["view", "create", "update", "delete"] },
    { id: "products", name: "Hàng hóa", actions: ["view", "create", "update", "delete"] },
    { id: "suppliers", name: "Nhà cung cấp", actions: ["view", "create", "update", "delete"] },
    { id: "customers", name: "Khách hàng", actions: ["view", "create", "update", "delete"] },
    { id: "purchases", name: "Nhập hàng", actions: ["view", "create", "update", "delete"] },
    { id: "sales", name: "Bán hàng", actions: ["view", "create", "update", "delete"] },
    { id: "inventory", name: "Tồn kho", actions: ["view", "update"] },
    { id: "prices", name: "Điều chỉnh giá", actions: ["view", "update"] },
    { id: "reports", name: "Báo cáo", actions: ["view"] },
    { id: "settings", name: "Cài đặt", actions: ["view", "create", "update", "delete"] },
  ];

  // Form for adding/editing role
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: modules.reduce<Record<string, Record<string, boolean>>>((acc, module) => {
        acc[module.id] = module.actions.reduce<Record<string, boolean>>((actions, action) => {
          actions[action] = false;
          return actions;
        }, {});
        return acc;
      }, {}),
    },
  });

  // Fetch roles
  const { 
    data: roles = [], 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/roles'],
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingRole(null);
      const defaultPermissions = modules.reduce<Record<string, Record<string, boolean>>>((acc, module) => {
        acc[module.id] = module.actions.reduce<Record<string, boolean>>((actions, action) => {
          actions[action] = false;
          return actions;
        }, {});
        return acc;
      }, {});
      
      form.reset({
        name: "",
        permissions: defaultPermissions,
      });
    }
  }, [isDialogOpen, form, modules]);

  // Set form values when editing a role
  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        permissions: editingRole.permissions,
      });
    }
  }, [editingRole, form]);

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: async (data: RoleFormValues) => {
      const res = await apiRequest("POST", "/api/roles", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm vai trò mới",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
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

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: RoleFormValues }) => {
      const res = await apiRequest("PUT", `/api/roles/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
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

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa vai trò",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
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
  const onSubmit = (data: RoleFormValues) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (role: any) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  // Filter roles based on search query
  const filteredRoles = searchQuery
    ? roles.filter((role: any) => 
        role.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : roles;

  // Toggle all permissions for a module
  const toggleModulePermissions = (moduleId: string, value: boolean) => {
    const permissions = { ...form.getValues("permissions") };
    
    modules.find(m => m.id === moduleId)?.actions.forEach(action => {
      permissions[moduleId][action] = value;
    });
    
    form.setValue("permissions", permissions);
  };

  // Check if all permissions are enabled for a module
  const isModuleFullyEnabled = (moduleId: string) => {
    const permissions = form.getValues("permissions");
    const moduleActions = modules.find(m => m.id === moduleId)?.actions || [];
    
    return moduleActions.every(action => permissions[moduleId][action]);
  };

  // Check if any permission is enabled for a module
  const isModulePartiallyEnabled = (moduleId: string) => {
    const permissions = form.getValues("permissions");
    const moduleActions = modules.find(m => m.id === moduleId)?.actions || [];
    
    return moduleActions.some(action => permissions[moduleId][action]) && 
           !moduleActions.every(action => permissions[moduleId][action]);
  };

  // Translate action name to Vietnamese
  const translateAction = (action: string) => {
    switch (action) {
      case "view": return "Xem";
      case "create": return "Thêm mới";
      case "update": return "Cập nhật";
      case "delete": return "Xóa";
      default: return action;
    }
  };

  // Count permissions for a role
  const countPermissions = (role: any) => {
    let count = 0;
    
    for (const module in role.permissions) {
      for (const action in role.permissions[module]) {
        if (role.permissions[module][action]) {
          count++;
        }
      }
    }
    
    return count;
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-heading font-bold">Phân quyền chức năng</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Thêm vai trò
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRole ? "Cập nhật vai trò" : "Thêm vai trò mới"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên vai trò <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên vai trò" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <h3 className="mb-2 font-medium">Quyền truy cập</h3>
                    <Accordion type="multiple" className="border rounded-md">
                      {modules.map((module) => (
                        <AccordionItem value={module.id} key={module.id}>
                          <AccordionTrigger className="px-4 py-2 hover:no-underline">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`module-${module.id}`}
                                checked={isModuleFullyEnabled(module.id)}
                                onCheckedChange={(checked) => {
                                  toggleModulePermissions(module.id, !!checked);
                                }}
                                className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:opacity-70"
                                data-state={
                                  isModuleFullyEnabled(module.id) 
                                    ? "checked" 
                                    : isModulePartiallyEnabled(module.id)
                                    ? "indeterminate"
                                    : "unchecked"
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>{module.name}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {module.actions.map((action) => (
                                <FormField
                                  key={`${module.id}-${action}`}
                                  control={form.control}
                                  name={`permissions.${module.id}.${action}`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="cursor-pointer">
                                        {translateAction(action)}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
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
                        editingRole ? "Cập nhật" : "Thêm mới"
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
              placeholder="Tìm kiếm vai trò..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                      Tên vai trò
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Số quyền
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Quyền hạn
                    </th>
                    <th className="px-4 py-3 bg-neutral-lightest text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-light">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                        Không có dữ liệu vai trò
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role: any) => (
                      <tr key={role.id} className="hover:bg-neutral-lightest">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-dark">
                          <div className="flex items-center">
                            <Lock className="h-4 w-4 text-primary mr-2" />
                            {role.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                          {countPermissions(role)}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-dark">
                          <div className="flex flex-wrap gap-1">
                            {modules.map(module => {
                              // Check if any permission exists for this module
                              const hasPermission = module.actions.some(
                                action => role.permissions[module.id]?.[action]
                              );
                              
                              if (hasPermission) {
                                return (
                                  <span key={module.id} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                    {module.name}
                                  </span>
                                );
                              }
                              
                              return null;
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            className="text-primary hover:text-primary-dark hover:bg-neutral-lightest"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog open={deleteTargetId === role.id} onOpenChange={(open) => {
                            if (!open) setDeleteTargetId(null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(role.id)}
                                disabled={role.name === "Admin"}
                                className="text-destructive hover:text-destructive hover:bg-neutral-lightest"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa vai trò "{role.name}"? 
                                  Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(role.id)}
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
