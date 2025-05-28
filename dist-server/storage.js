"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const schema_1 = require("@shared/schema");
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
const db_2 = require("./db");
const PostgresSessionStore = (0, connect_pg_simple_1.default)(express_session_1.default);
class DatabaseStorage {
    constructor() {
        this.sessionStore = new PostgresSessionStore({
            pool: db_2.pool,
            createTableIfMissing: true,
            tableName: 'user_sessions'
        });
    }
    // Users
    async getUser(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user;
    }
    async getUserByUsername(username) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        return user;
    }
    async getUserWithRole(id) {
        const [result] = await db_1.db
            .select({
            user: schema_1.users,
            role: schema_1.roles
        })
            .from(schema_1.users)
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.users.roleId, schema_1.roles.id))
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        if (!result)
            return undefined;
        return {
            user: result.user,
            role: result.role
        };
    }
    async createUser(insertUser) {
        const [user] = await db_1.db
            .insert(schema_1.users)
            .values(insertUser)
            .returning();
        return user;
    }
    async updateUser(id, userData) {
        const [user] = await db_1.db
            .update(schema_1.users)
            .set(userData)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user;
    }
    async deleteUser(id) {
        const result = await db_1.db
            .delete(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return true;
    }
    async getAllUsers() {
        return await db_1.db.select().from(schema_1.users);
    }
    // Roles
    async getRoles() {
        return await db_1.db.select().from(schema_1.roles);
    }
    async getRole(id) {
        const [role] = await db_1.db.select().from(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.id, id));
        return role;
    }
    async createRole(role) {
        const [newRole] = await db_1.db
            .insert(schema_1.roles)
            .values(role)
            .returning();
        return newRole;
    }
    async updateRole(id, roleData) {
        const [role] = await db_1.db
            .update(schema_1.roles)
            .set(roleData)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, id))
            .returning();
        return role;
    }
    async deleteRole(id) {
        await db_1.db.delete(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.id, id));
        return true;
    }
    // Product Categories
    async getProductCategories() {
        return await db_1.db.select().from(schema_1.productCategories);
    }
    async getProductCategory(id) {
        const [category] = await db_1.db.select().from(schema_1.productCategories).where((0, drizzle_orm_1.eq)(schema_1.productCategories.id, id));
        return category;
    }
    async createProductCategory(category) {
        const [newCategory] = await db_1.db
            .insert(schema_1.productCategories)
            .values(category)
            .returning();
        return newCategory;
    }
    async updateProductCategory(id, categoryData) {
        const [category] = await db_1.db
            .update(schema_1.productCategories)
            .set(categoryData)
            .where((0, drizzle_orm_1.eq)(schema_1.productCategories.id, id))
            .returning();
        return category;
    }
    async deleteProductCategory(id) {
        await db_1.db.delete(schema_1.productCategories).where((0, drizzle_orm_1.eq)(schema_1.productCategories.id, id));
        return true;
    }
    // Products
    async getProducts(params) {
        let query = db_1.db.select().from(schema_1.products);
        if (params?.categoryId) {
            query = query.where((0, drizzle_orm_1.eq)(schema_1.products.categoryId, params.categoryId));
        }
        if (params?.search) {
            query = query.where((0, drizzle_orm_1.sql) `(${schema_1.products.name} ILIKE ${'%' + params.search + '%'} OR ${schema_1.products.code} ILIKE ${'%' + params.search + '%'})`);
        }
        return await query;
    }
    async getProduct(id) {
        const [product] = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        return product;
    }
    async getProductByCode(code) {
        const [product] = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.code, code));
        return product;
    }
    async createProduct(product) {
        const [newProduct] = await db_1.db
            .insert(schema_1.products)
            .values(product)
            .returning();
        return newProduct;
    }
    async updateProduct(id, productData) {
        const [product] = await db_1.db
            .update(schema_1.products)
            .set(productData)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id))
            .returning();
        return product;
    }
    async deleteProduct(id) {
        await db_1.db.delete(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        return true;
    }
    // Suppliers
    async getSuppliers(search) {
        let query = db_1.db.select().from(schema_1.suppliers);
        if (search) {
            query = query.where((0, drizzle_orm_1.sql) `(${schema_1.suppliers.name} ILIKE ${'%' + search + '%'} OR ${schema_1.suppliers.code} ILIKE ${'%' + search + '%'})`);
        }
        return await query;
    }
    async getSupplier(id) {
        const [supplier] = await db_1.db.select().from(schema_1.suppliers).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, id));
        return supplier;
    }
    async createSupplier(supplier) {
        const [newSupplier] = await db_1.db
            .insert(schema_1.suppliers)
            .values(supplier)
            .returning();
        return newSupplier;
    }
    async updateSupplier(id, supplierData) {
        const [supplier] = await db_1.db
            .update(schema_1.suppliers)
            .set(supplierData)
            .where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, id))
            .returning();
        return supplier;
    }
    async deleteSupplier(id) {
        await db_1.db.delete(schema_1.suppliers).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, id));
        return true;
    }
    // Customers
    async getCustomers(search) {
        let query = db_1.db.select().from(schema_1.customers);
        if (search) {
            query = query.where((0, drizzle_orm_1.sql) `(${schema_1.customers.name} ILIKE ${'%' + search + '%'} OR ${schema_1.customers.code} ILIKE ${'%' + search + '%'} OR ${schema_1.customers.phone} ILIKE ${'%' + search + '%'})`);
        }
        return await query;
    }
    async getCustomer(id) {
        const [customer] = await db_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, id));
        return customer;
    }
    async createCustomer(customer) {
        const [newCustomer] = await db_1.db
            .insert(schema_1.customers)
            .values(customer)
            .returning();
        return newCustomer;
    }
    async updateCustomer(id, customerData) {
        const [customer] = await db_1.db
            .update(schema_1.customers)
            .set(customerData)
            .where((0, drizzle_orm_1.eq)(schema_1.customers.id, id))
            .returning();
        return customer;
    }
    async deleteCustomer(id) {
        await db_1.db.delete(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, id));
        return true;
    }
    // Purchase Orders
    async getPurchaseOrders() {
        return await db_1.db
            .select()
            .from(schema_1.purchaseOrders)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.purchaseOrders.date));
    }
    async getPurchaseOrder(id) {
        const [order] = await db_1.db
            .select()
            .from(schema_1.purchaseOrders)
            .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrders.id, id));
        return order;
    }
    async createPurchaseOrder(order, items) {
        const [newOrder] = await db_1.db
            .insert(schema_1.purchaseOrders)
            .values({
            ...order,
            createdAt: new Date(),
            updatedAt: new Date()
        })
            .returning();
        // Insert items
        const orderItems = [];
        for (const item of items) {
            const [newItem] = await db_1.db
                .insert(schema_1.purchaseOrderItems)
                .values({
                ...item,
                purchaseOrderId: newOrder.id,
            })
                .returning();
            // Update product stock and prices
            const product = await this.getProduct(item.productId);
            if (product) {
                await this.updateProduct(product.id, {
                    stock: product.stock + item.quantity,
                    purchasePrice: item.purchasePrice,
                    sellingPrice: item.sellingPrice
                });
            }
            orderItems.push(newItem);
        }
        return { order: newOrder, items: orderItems };
    }
    async getPurchaseOrderItems(purchaseOrderId) {
        return await db_1.db
            .select()
            .from(schema_1.purchaseOrderItems)
            .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrderItems.purchaseOrderId, purchaseOrderId));
    }
    async deletePurchaseOrder(id) {
        // Xóa các item trước
        await db_1.db
            .delete(schema_1.purchaseOrderItems)
            .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrderItems.purchaseOrderId, id));
        // Sau đó xóa order
        await db_1.db
            .delete(schema_1.purchaseOrders)
            .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrders.id, id));
        return true;
    }
    // Sales Orders
    async getSalesOrders() {
        return await db_1.db
            .select()
            .from(schema_1.salesOrders)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.salesOrders.date));
    }
    async getSalesOrder(id) {
        const [order] = await db_1.db
            .select()
            .from(schema_1.salesOrders)
            .where((0, drizzle_orm_1.eq)(schema_1.salesOrders.id, id));
        return order;
    }
    async createSalesOrder(order, items) {
        const [newOrder] = await db_1.db
            .insert(schema_1.salesOrders)
            .values({
            ...order,
            createdAt: new Date(),
            updatedAt: new Date()
        })
            .returning();
        // Insert items
        const orderItems = [];
        for (const item of items) {
            const [newItem] = await db_1.db
                .insert(schema_1.salesOrderItems)
                .values({
                ...item,
                salesOrderId: newOrder.id,
            })
                .returning();
            // Update product stock
            const product = await this.getProduct(item.productId);
            if (product) {
                await this.updateProduct(product.id, {
                    stock: product.stock - item.quantity
                });
            }
            orderItems.push(newItem);
        }
        // If there's a customer, update their total purchase and debt
        if (order.customerId) {
            const customer = await this.getCustomer(order.customerId);
            if (customer) {
                let newDebt = customer.debt;
                // If customer payment is less than total, increase debt
                if (order.customerPayment < order.totalAmount) {
                    newDebt += (order.totalAmount - order.customerPayment);
                }
                await this.updateCustomer(customer.id, {
                    totalPurchase: customer.totalPurchase + order.totalAmount,
                    debt: newDebt
                });
            }
        }
        return { order: newOrder, items: orderItems };
    }
    async getSalesOrderItems(salesOrderId) {
        return await db_1.db
            .select()
            .from(schema_1.salesOrderItems)
            .where((0, drizzle_orm_1.eq)(schema_1.salesOrderItems.salesOrderId, salesOrderId));
    }
    // Inventory
    async getInventory() {
        return await db_1.db
            .select()
            .from(schema_1.products)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.products.name));
    }
    // Price Adjustments
    async adjustProductPrice(adjustment) {
        // First record the adjustment
        await db_1.db
            .insert(schema_1.priceAdjustments)
            .values(adjustment);
        // Then update the product's price
        const [product] = await db_1.db
            .update(schema_1.products)
            .set({ sellingPrice: adjustment.newPrice })
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, adjustment.productId))
            .returning();
        return product;
    }
    async getPriceAdjustments(productId) {
        let query = db_1.db.select().from(schema_1.priceAdjustments);
        if (productId) {
            query = query.where((0, drizzle_orm_1.eq)(schema_1.priceAdjustments.productId, productId));
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.priceAdjustments.date));
    }
    // Session logging
    async createSessionLog(log) {
        const [newLog] = await db_1.db
            .insert(schema_1.sessionLogs)
            .values(log)
            .returning();
        return newLog;
    }
}
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
