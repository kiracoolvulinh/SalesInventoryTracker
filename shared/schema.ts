import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, foreignKey, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  permissions: jsonb("permissions").notNull()
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  permissions: true,
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  roleId: true,
  isActive: true,
});

// Product Categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  notes: text("notes"),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).pick({
  code: true,
  name: true,
  notes: true,
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => productCategories.id),
  unit: text("unit").notNull(),
  images: text("images").array().default([]),
  purchasePrice: doublePrecision("purchase_price").notNull(),
  sellingPrice: doublePrecision("selling_price").notNull(),
  stock: integer("stock").default(0).notNull(),
  notes: text("notes"),
});

export const insertProductSchema = createInsertSchema(products).pick({
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
  images: z.array(z.string()).default([]),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  notes: text("notes"),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  code: true,
  name: true,
  phone: true,
  address: true,
  contactPerson: true,
  notes: true,
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  email: text("email"),
  customerType: text("customer_type").default("regular").notNull(),
  debt: doublePrecision("debt").default(0).notNull(),
  totalPurchase: doublePrecision("total_purchase").default(0).notNull(),
  notes: text("notes"),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
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
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  date: timestamp("date").notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  documents: text("documents"),
  totalAmount: doublePrecision("total_amount").notNull(),
  paidAmount: doublePrecision("paid_amount").notNull(),
  debt: doublePrecision("debt").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Purchase Order Items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  purchasePrice: doublePrecision("purchase_price").notNull(),
  sellingPrice: doublePrecision("selling_price").notNull(),
  amount: doublePrecision("amount").notNull(),
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true
});

// Sales Orders
export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  date: timestamp("date").notNull(),
  customerType: text("customer_type").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  totalAmount: doublePrecision("total_amount").notNull(),
  customerPayment: doublePrecision("customer_payment").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Sales Order Items
export const salesOrderItems = pgTable("sales_order_items", {
  id: serial("id").primaryKey(),
  salesOrderId: integer("sales_order_id").references(() => salesOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  amount: doublePrecision("amount").notNull(),
});

export const insertSalesOrderItemSchema = createInsertSchema(salesOrderItems).omit({
  id: true
});

// Price Adjustments
export const priceAdjustments = pgTable("price_adjustments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  oldPrice: doublePrecision("old_price").notNull(),
  newPrice: doublePrecision("new_price").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const insertPriceAdjustmentSchema = createInsertSchema(priceAdjustments).omit({
  id: true
});

// Session log
export const sessionLogs = pgTable("session_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertSessionLogSchema = createInsertSchema(sessionLogs).omit({
  id: true
});

// Types
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertSalesOrderItem = z.infer<typeof insertSalesOrderItemSchema>;

export type PriceAdjustment = typeof priceAdjustments.$inferSelect;
export type InsertPriceAdjustment = z.infer<typeof insertPriceAdjustmentSchema>;

export type SessionLog = typeof sessionLogs.$inferSelect;
export type InsertSessionLog = z.infer<typeof insertSessionLogSchema>;
