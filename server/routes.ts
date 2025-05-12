import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertProductCategorySchema, insertProductSchema, insertSupplierSchema,
  insertCustomerSchema, insertPurchaseOrderSchema, insertPurchaseOrderItemSchema,
  insertSalesOrderSchema, insertSalesOrderItemSchema, insertPriceAdjustmentSchema,
  insertUserSchema, insertRoleSchema
} from "@shared/schema";

// Helper for role-based access control
function requireRole(requiredRoles: string[]) {
  return (req: Express.Request, res: Express.Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }
    
    const userRole = req.user?.roleId;
    if (!userRole || !requiredRoles.includes(userRole.toString())) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up authentication routes
  setupAuth(app);
  
  // API Routes
  
  // Roles
  app.get("/api/roles", async (req, res, next) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/roles", async (req, res, next) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  });
  
  // Users
  app.get("/api/users", async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/users", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/users/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/users/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Product Categories
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.getProductCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/categories/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getProductCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/categories", async (req, res, next) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createProductCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/categories/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = z.object({
        code: z.string().optional(),
        name: z.string().optional(),
        notes: z.string().optional(),
      }).parse(req.body);
      
      const category = await storage.updateProductCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Danh mục không tồn tại" });
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/categories/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductCategory(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Products
  app.get("/api/products", async (req, res, next) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string | undefined;
      
      const products = await storage.getProducts({ categoryId, search });
      res.json(products);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/products/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/products", async (req, res, next) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/products/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/products/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Suppliers
  app.get("/api/suppliers", async (req, res, next) => {
    try {
      const search = req.query.search as string | undefined;
      const suppliers = await storage.getSuppliers(search);
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/suppliers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
      }
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/suppliers", async (req, res, next) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/suppliers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id, req.body);
      if (!supplier) {
        return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
      }
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/suppliers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Customers
  app.get("/api/customers", async (req, res, next) => {
    try {
      const search = req.query.search as string | undefined;
      const customers = await storage.getCustomers(search);
      res.json(customers);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/customers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Khách hàng không tồn tại" });
      }
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/customers", async (req, res, next) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/customers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Khách hàng không tồn tại" });
      }
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/customers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Purchase Orders
  app.get("/api/purchase-orders", async (req, res, next) => {
    try {
      const orders = await storage.getPurchaseOrders();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/purchase-orders/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getPurchaseOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Phiếu nhập không tồn tại" });
      }
      
      const items = await storage.getPurchaseOrderItems(id);
      res.json({ order, items });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/purchase-orders", async (req, res, next) => {
    try {
      const { order, items } = req.body;
      
      const validatedOrder = insertPurchaseOrderSchema.parse(order);
      const validatedItems = z.array(insertPurchaseOrderItemSchema).parse(items);
      
      const result = await storage.createPurchaseOrder(validatedOrder, validatedItems);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Sales Orders
  app.get("/api/sales-orders", async (req, res, next) => {
    try {
      const orders = await storage.getSalesOrders();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/sales-orders/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getSalesOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Phiếu bán không tồn tại" });
      }
      
      const items = await storage.getSalesOrderItems(id);
      res.json({ order, items });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/sales-orders", async (req, res, next) => {
    try {
      const { order, items } = req.body;
      
      const validatedOrder = insertSalesOrderSchema.parse(order);
      const validatedItems = z.array(insertSalesOrderItemSchema).parse(items);
      
      const result = await storage.createSalesOrder(validatedOrder, validatedItems);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Inventory
  app.get("/api/inventory", async (req, res, next) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      next(error);
    }
  });
  
  // Price Adjustments
  app.post("/api/price-adjustments", async (req, res, next) => {
    try {
      const validatedData = insertPriceAdjustmentSchema.parse(req.body);
      const product = await storage.adjustProductPrice(validatedData);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/price-adjustments", async (req, res, next) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const adjustments = await storage.getPriceAdjustments(productId);
      res.json(adjustments);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
