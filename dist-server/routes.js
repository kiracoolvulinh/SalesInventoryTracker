"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const storage_1 = require("./storage");
const auth_1 = require("./auth");
const zod_1 = require("zod");
const schema_1 = require("@shared/schema");
async function registerRoutes(app) {
    // Sets up authentication routes
    (0, auth_1.setupAuth)(app);
    // API Routes
    // Roles
    app.get("/api/roles", async (req, res, next) => {
        try {
            const roles = await storage_1.storage.getRoles();
            res.json(roles);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/roles", async (req, res, next) => {
        try {
            const validatedData = schema_1.insertRoleSchema.parse(req.body);
            const role = await storage_1.storage.createRole(validatedData);
            res.status(201).json(role);
        }
        catch (error) {
            next(error);
        }
    });
    // Users
    app.get("/api/users", async (req, res, next) => {
        try {
            const users = await storage_1.storage.getAllUsers();
            res.json(users);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/users", async (req, res, next) => {
        try {
            const validatedData = schema_1.insertUserSchema.parse(req.body);
            const user = await storage_1.storage.createUser(validatedData);
            res.status(201).json(user);
        }
        catch (error) {
            next(error);
        }
    });
    app.put("/api/users/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const user = await storage_1.storage.updateUser(id, req.body);
            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    });
    app.delete("/api/users/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            await storage_1.storage.deleteUser(id);
            res.status(204).end();
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/taikhoan", async (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.status(401).end();
        }
        try {
            const result = await storage_1.storage.getUserWithRole(req.user.id);
            if (!result)
                return res.status(404).end();
            const { user, role } = result;
            // Trả về thông tin người dùng và vai trò nhưng không bao gồm mật khẩu
            return res.json({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                roleId: user.roleId,
                isActive: user.isActive,
                role: {
                    id: role.id,
                    name: role.name,
                    permissions: role.permissions || {
                        categories: { view: true, create: true, update: true, delete: true },
                        products: { view: true, create: true, update: true, delete: true },
                        suppliers: { view: true, create: true, update: true, delete: true },
                        customers: { view: true, create: true, update: true, delete: true },
                        purchases: { view: true, create: true, update: true, delete: true },
                        sales: { view: true, create: true, update: true, delete: true },
                        inventory: { view: true, update: true },
                        prices: { view: true, update: true },
                        reports: { view: true },
                        settings: { view: true, create: true, update: true, delete: true }
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    });
    // Product Categories
    app.get("/api/categories", async (req, res, next) => {
        try {
            const categories = await storage_1.storage.getProductCategories();
            res.json(categories);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/categories/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const category = await storage_1.storage.getProductCategory(id);
            if (!category) {
                return res.status(404).json({ message: "Danh mục không tồn tại" });
            }
            res.json(category);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/categories", async (req, res, next) => {
        try {
            const validatedData = schema_1.insertProductCategorySchema.parse(req.body);
            const category = await storage_1.storage.createProductCategory(validatedData);
            res.status(201).json(category);
        }
        catch (error) {
            next(error);
        }
    });
    app.put("/api/categories/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const validatedData = zod_1.z.object({
                code: zod_1.z.string().optional(),
                name: zod_1.z.string().optional(),
                notes: zod_1.z.string().optional(),
            }).parse(req.body);
            const category = await storage_1.storage.updateProductCategory(id, validatedData);
            if (!category) {
                return res.status(404).json({ message: "Danh mục không tồn tại" });
            }
            res.json(category);
        }
        catch (error) {
            next(error);
        }
    });
    app.delete("/api/categories/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            await storage_1.storage.deleteProductCategory(id);
            res.status(204).end();
        }
        catch (error) {
            next(error);
        }
    });
    // Products
    app.get("/api/products", async (req, res, next) => {
        try {
            const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
            const search = req.query.search;
            const products = await storage_1.storage.getProducts({ categoryId, search });
            res.json(products);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/products/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const product = await storage_1.storage.getProduct(id);
            if (!product) {
                return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            }
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/products", async (req, res, next) => {
        try {
            const validatedData = schema_1.insertProductSchema.parse(req.body);
            const product = await storage_1.storage.createProduct(validatedData);
            res.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    });
    app.put("/api/products/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const validatedData = schema_1.insertProductSchema.parse(req.body);
            const product = await storage_1.storage.updateProduct(id, validatedData);
            if (!product) {
                return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            }
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    });
    app.delete("/api/products/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            await storage_1.storage.deleteProduct(id);
            res.status(204).end();
        }
        catch (error) {
            next(error);
        }
    });
    // Suppliers
    app.get("/api/suppliers", async (req, res, next) => {
        try {
            const search = req.query.search;
            const suppliers = await storage_1.storage.getSuppliers(search);
            res.json(suppliers);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/suppliers/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const supplier = await storage_1.storage.getSupplier(id);
            if (!supplier) {
                return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
            }
            res.json(supplier);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/suppliers", async (req, res, next) => {
        try {
            const validatedData = schema_1.insertSupplierSchema.parse(req.body);
            const supplier = await storage_1.storage.createSupplier(validatedData);
            res.status(201).json(supplier);
        }
        catch (error) {
            next(error);
        }
    });
    app.put("/api/suppliers/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const supplier = await storage_1.storage.updateSupplier(id, req.body);
            if (!supplier) {
                return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
            }
            res.json(supplier);
        }
        catch (error) {
            next(error);
        }
    });
    app.delete("/api/suppliers/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            await storage_1.storage.deleteSupplier(id);
            res.status(204).end();
        }
        catch (error) {
            next(error);
        }
    });
    // Customers
    app.get("/api/customers", async (req, res, next) => {
        try {
            const search = req.query.search;
            const customers = await storage_1.storage.getCustomers(search);
            res.json(customers);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/customers/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const customer = await storage_1.storage.getCustomer(id);
            if (!customer) {
                return res.status(404).json({ message: "Khách hàng không tồn tại" });
            }
            res.json(customer);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/customers", async (req, res, next) => {
        try {
            const validatedData = schema_1.insertCustomerSchema.parse(req.body);
            const customer = await storage_1.storage.createCustomer(validatedData);
            res.status(201).json(customer);
        }
        catch (error) {
            next(error);
        }
    });
    app.put("/api/customers/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const customer = await storage_1.storage.updateCustomer(id, req.body);
            if (!customer) {
                return res.status(404).json({ message: "Khách hàng không tồn tại" });
            }
            res.json(customer);
        }
        catch (error) {
            next(error);
        }
    });
    app.delete("/api/customers/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            await storage_1.storage.deleteCustomer(id);
            res.status(204).end();
        }
        catch (error) {
            next(error);
        }
    });
    // Purchase Orders
    app.get("/api/purchase-orders", async (req, res, next) => {
        try {
            const orders = await storage_1.storage.getPurchaseOrders();
            res.json(orders);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/purchase-orders/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const order = await storage_1.storage.getPurchaseOrder(id);
            if (!order) {
                return res.status(404).json({ message: "Phiếu nhập không tồn tại" });
            }
            const items = await storage_1.storage.getPurchaseOrderItems(id);
            res.json({ order, items });
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/purchase-orders", async (req, res, next) => {
        try {
            console.log('Received purchase order request:', req.body);
            const { order, items } = req.body;
            // Convert date string to Date object if needed
            const orderWithDate = {
                ...order,
                date: new Date(order.date)
            };
            const validatedOrder = schema_1.insertPurchaseOrderSchema.parse(orderWithDate);
            const validatedItems = zod_1.z.array(schema_1.insertPurchaseOrderItemSchema).parse(items);
            const result = await storage_1.storage.createPurchaseOrder(validatedOrder, validatedItems);
            console.log('Purchase order created successfully:', result);
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Error creating purchase order:', error);
            next(error);
        }
    });
    // app.delete("/api/purchase-orders/:id", async (req: Request, res: Response, next: NextFunction) => {
    //   try {
    //     const id = parseInt(req.params.id);
    //     const order = await storage.getPurchaseOrder(id);
    //     if (!order) {
    //       return res.status(404).json({ message: "Phiếu nhập không tồn tại" });
    //     }
    //     // Get order items to update product stock
    //     const items = await storage.getPurchaseOrderItems(id);
    //     // Update product stock (subtract the quantities)
    //     for (const item of items) {
    //       const product = await storage.getProduct(item.productId);
    //       if (product) {
    //         await storage.updateProduct(product.id, {
    //           stock: product.stock - item.quantity
    //         });
    //       }
    //     }
    //     // Delete the purchase order and its items using a transaction
    //     await db.transaction(async (tx) => {
    //       await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    //       await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    //     });
    //     res.status(204).end();
    //   } catch (error) {
    //     next(error);
    //   }
    // });
    app.delete("/api/purchase-orders/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const order = await storage_1.storage.getPurchaseOrder(id);
            if (!order) {
                return res.status(404).json({ message: "Phiếu nhập không tồn tại" });
            }
            // Get order items to update product stock
            const items = await storage_1.storage.getPurchaseOrderItems(id);
            // Update product stock (subtract the quantities)
            for (const item of items) {
                const product = await storage_1.storage.getProduct(item.productId);
                if (product) {
                    await storage_1.storage.updateProduct(product.id, {
                        stock: product.stock - item.quantity
                    });
                }
            }
            // Delete the purchase order (this will cascade delete the items)
            await storage_1.storage.deletePurchaseOrder(id);
            res.status(204).end();
        }
        catch (error) {
            next(error);
        }
    });
    // Sales Orders
    app.get("/api/sales-orders", async (req, res, next) => {
        try {
            const orders = await storage_1.storage.getSalesOrders();
            res.json(orders);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/sales-orders/:id", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const order = await storage_1.storage.getSalesOrder(id);
            if (!order) {
                return res.status(404).json({ message: "Phiếu bán không tồn tại" });
            }
            const items = await storage_1.storage.getSalesOrderItems(id);
            res.json({ order, items });
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/sales-orders", async (req, res, next) => {
        try {
            const { order, items } = req.body;
            const validatedOrder = schema_1.insertSalesOrderSchema.parse(order);
            const validatedItems = zod_1.z.array(schema_1.insertSalesOrderItemSchema).parse(items);
            const result = await storage_1.storage.createSalesOrder(validatedOrder, validatedItems);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // Inventory
    app.get("/api/inventory", async (req, res, next) => {
        try {
            const inventory = await storage_1.storage.getInventory();
            res.json(inventory);
        }
        catch (error) {
            next(error);
        }
    });
    // Price Adjustments
    app.post("/api/price-adjustments", async (req, res, next) => {
        try {
            const validatedData = schema_1.insertPriceAdjustmentSchema.parse(req.body);
            const product = await storage_1.storage.adjustProductPrice(validatedData);
            res.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/price-adjustments", async (req, res, next) => {
        try {
            const productId = req.query.productId ? parseInt(req.query.productId) : undefined;
            const adjustments = await storage_1.storage.getPriceAdjustments(productId);
            res.json(adjustments);
        }
        catch (error) {
            next(error);
        }
    });
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
