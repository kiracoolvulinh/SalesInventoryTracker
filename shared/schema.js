"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSessionLogSchema = exports.sessionLogs = exports.insertPriceAdjustmentSchema = exports.priceAdjustments = exports.insertSalesOrderItemSchema = exports.salesOrderItems = exports.insertSalesOrderSchema = exports.salesOrders = exports.insertPurchaseOrderItemSchema = exports.purchaseOrderItems = exports.insertPurchaseOrderSchema = exports.purchaseOrders = exports.insertCustomerSchema = exports.customers = exports.insertSupplierSchema = exports.suppliers = exports.insertProductSchema = exports.products = exports.insertProductCategorySchema = exports.productCategories = exports.insertUserSchema = exports.users = exports.insertRoleSchema = exports.roles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
// User roles
exports.roles = (0, pg_core_1.pgTable)("roles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    permissions: (0, pg_core_1.jsonb)("permissions").notNull()
});
exports.insertRoleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.roles).pick({
    name: true,
    permissions: true,
});
// Users
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    fullName: (0, pg_core_1.text)("full_name").notNull(),
    roleId: (0, pg_core_1.integer)("role_id").references(() => exports.roles.id),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    password: true,
    fullName: true,
    roleId: true,
    isActive: true,
});
// Product Categories
exports.productCategories = (0, pg_core_1.pgTable)("product_categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    name: (0, pg_core_1.text)("name").notNull(),
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertProductCategorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.productCategories).pick({
    code: true,
    name: true,
    notes: true,
});
// Products
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    name: (0, pg_core_1.text)("name").notNull(),
    categoryId: (0, pg_core_1.integer)("category_id").references(() => exports.productCategories.id),
    unit: (0, pg_core_1.text)("unit").notNull(),
    images: (0, pg_core_1.text)("images").array().default([]),
    purchasePrice: (0, pg_core_1.doublePrecision)("purchase_price").notNull(),
    sellingPrice: (0, pg_core_1.doublePrecision)("selling_price").notNull(),
    stock: (0, pg_core_1.integer)("stock").default(0).notNull(),
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertProductSchema = (0, drizzle_zod_1.createInsertSchema)(exports.products).pick({
    code: true,
    name: true,
    categoryId: true,
    unit: true,
    images: true,
    purchasePrice: true,
    sellingPrice: true,
    stock: true,
    notes: true,
}).extend({
    images: zod_1.z.array(zod_1.z.string()).default([]),
});
// Suppliers
exports.suppliers = (0, pg_core_1.pgTable)("suppliers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    name: (0, pg_core_1.text)("name").notNull(),
    phone: (0, pg_core_1.text)("phone"),
    address: (0, pg_core_1.text)("address"),
    contactPerson: (0, pg_core_1.text)("contact_person"),
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertSupplierSchema = (0, drizzle_zod_1.createInsertSchema)(exports.suppliers).pick({
    code: true,
    name: true,
    phone: true,
    address: true,
    contactPerson: true,
    notes: true,
});
// Customers
exports.customers = (0, pg_core_1.pgTable)("customers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    name: (0, pg_core_1.text)("name").notNull(),
    phone: (0, pg_core_1.text)("phone").notNull(),
    address: (0, pg_core_1.text)("address"),
    email: (0, pg_core_1.text)("email"),
    customerType: (0, pg_core_1.text)("customer_type").default("regular").notNull(),
    debt: (0, pg_core_1.doublePrecision)("debt").default(0).notNull(),
    totalPurchase: (0, pg_core_1.doublePrecision)("total_purchase").default(0).notNull(),
    notes: (0, pg_core_1.text)("notes"),
});
exports.insertCustomerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.customers).pick({
    code: true,
    name: true,
    phone: true,
    address: true,
    email: true,
    customerType: true,
    debt: true,
    totalPurchase: true,
    notes: true,
});
// Purchase Orders
exports.purchaseOrders = (0, pg_core_1.pgTable)("purchase_orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    date: (0, pg_core_1.timestamp)("date").notNull(),
    supplierId: (0, pg_core_1.integer)("supplier_id").references(() => exports.suppliers.id),
    documents: (0, pg_core_1.text)("documents"),
    totalAmount: (0, pg_core_1.doublePrecision)("total_amount").notNull(),
    paidAmount: (0, pg_core_1.doublePrecision)("paid_amount").notNull(),
    debt: (0, pg_core_1.doublePrecision)("debt").notNull(),
    notes: (0, pg_core_1.text)("notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull()
});
exports.insertPurchaseOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.purchaseOrders).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
// Purchase Order Items
exports.purchaseOrderItems = (0, pg_core_1.pgTable)("purchase_order_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    purchaseOrderId: (0, pg_core_1.integer)("purchase_order_id").references(() => exports.purchaseOrders.id).notNull(),
    productId: (0, pg_core_1.integer)("product_id").references(() => exports.products.id).notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    purchasePrice: (0, pg_core_1.doublePrecision)("purchase_price").notNull(),
    sellingPrice: (0, pg_core_1.doublePrecision)("selling_price").notNull(),
    amount: (0, pg_core_1.doublePrecision)("amount").notNull(),
});
exports.insertPurchaseOrderItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.purchaseOrderItems).omit({
    id: true
});
// Sales Orders
exports.salesOrders = (0, pg_core_1.pgTable)("sales_orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    date: (0, pg_core_1.timestamp)("date").notNull(),
    customerType: (0, pg_core_1.text)("customer_type").notNull(),
    customerId: (0, pg_core_1.integer)("customer_id").references(() => exports.customers.id),
    totalAmount: (0, pg_core_1.doublePrecision)("total_amount").notNull(),
    customerPayment: (0, pg_core_1.doublePrecision)("customer_payment").notNull(),
    paymentMethod: (0, pg_core_1.text)("payment_method").notNull(),
    status: (0, pg_core_1.text)("status").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull()
});
exports.insertSalesOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.salesOrders).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
// Sales Order Items
exports.salesOrderItems = (0, pg_core_1.pgTable)("sales_order_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    salesOrderId: (0, pg_core_1.integer)("sales_order_id").references(() => exports.salesOrders.id).notNull(),
    productId: (0, pg_core_1.integer)("product_id").references(() => exports.products.id).notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    price: (0, pg_core_1.doublePrecision)("price").notNull(),
    amount: (0, pg_core_1.doublePrecision)("amount").notNull(),
});
exports.insertSalesOrderItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.salesOrderItems).omit({
    id: true
});
// Price Adjustments
exports.priceAdjustments = (0, pg_core_1.pgTable)("price_adjustments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    productId: (0, pg_core_1.integer)("product_id").references(() => exports.products.id).notNull(),
    oldPrice: (0, pg_core_1.doublePrecision)("old_price").notNull(),
    newPrice: (0, pg_core_1.doublePrecision)("new_price").notNull(),
    date: (0, pg_core_1.timestamp)("date").defaultNow().notNull(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
});
exports.insertPriceAdjustmentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.priceAdjustments).omit({
    id: true
});
// Session log
exports.sessionLogs = (0, pg_core_1.pgTable)("session_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id),
    action: (0, pg_core_1.text)("action").notNull(),
    details: (0, pg_core_1.text)("details"),
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
});
exports.insertSessionLogSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sessionLogs).omit({
    id: true
});
