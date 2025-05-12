import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  users, roles, productCategories, products, suppliers, customers,
  purchaseOrders, purchaseOrderItems, salesOrders, salesOrderItems,
  priceAdjustments, sessionLogs,
  type User, type InsertUser, type Role, type InsertRole,
  type ProductCategory, type InsertProductCategory, type Product, type InsertProduct,
  type Supplier, type InsertSupplier, type Customer, type InsertCustomer,
  type PurchaseOrder, type InsertPurchaseOrder, type PurchaseOrderItem, type InsertPurchaseOrderItem,
  type SalesOrder, type InsertSalesOrder, type SalesOrderItem, type InsertSalesOrderItem,
  type PriceAdjustment, type InsertPriceAdjustment, type SessionLog, type InsertSessionLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, asc, sql } from "drizzle-orm";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // Users and roles
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Roles
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  // Product Categories
  getProductCategories(): Promise<ProductCategory[]>;
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: number): Promise<boolean>;
  
  // Products
  getProducts(params?: { categoryId?: number, search?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Suppliers
  getSuppliers(search?: string): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  
  // Customers
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Purchase Orders
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<{ order: PurchaseOrder, items: PurchaseOrderItem[] }>;
  getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]>;
  
  // Sales Orders
  getSalesOrders(): Promise<SalesOrder[]>;
  getSalesOrder(id: number): Promise<SalesOrder | undefined>;
  createSalesOrder(order: InsertSalesOrder, items: InsertSalesOrderItem[]): Promise<{ order: SalesOrder, items: SalesOrderItem[] }>;
  getSalesOrderItems(salesOrderId: number): Promise<SalesOrderItem[]>;
  
  // Inventory
  getInventory(): Promise<Product[]>;
  
  // Price Adjustments
  adjustProductPrice(adjustment: InsertPriceAdjustment): Promise<Product>;
  getPriceAdjustments(productId?: number): Promise<PriceAdjustment[]>;
  
  // Session logging
  createSessionLog(log: InsertSessionLog): Promise<SessionLog>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return true;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Roles
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  
  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values(role)
      .returning();
    return newRole;
  }
  
  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set(roleData)
      .where(eq(roles.id, id))
      .returning();
    return role;
  }
  
  async deleteRole(id: number): Promise<boolean> {
    await db.delete(roles).where(eq(roles.id, id));
    return true;
  }
  
  // Product Categories
  async getProductCategories(): Promise<ProductCategory[]> {
    return await db.select().from(productCategories);
  }
  
  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return category;
  }
  
  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db
      .insert(productCategories)
      .values(category)
      .returning();
    return newCategory;
  }
  
  async updateProductCategory(id: number, categoryData: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const [category] = await db
      .update(productCategories)
      .set(categoryData)
      .where(eq(productCategories.id, id))
      .returning();
    return category;
  }
  
  async deleteProductCategory(id: number): Promise<boolean> {
    await db.delete(productCategories).where(eq(productCategories.id, id));
    return true;
  }
  
  // Products
  async getProducts(params?: { categoryId?: number, search?: string }): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (params?.categoryId) {
      query = query.where(eq(products.categoryId, params.categoryId));
    }
    
    if (params?.search) {
      query = query.where(
        sql`(${products.name} ILIKE ${'%' + params.search + '%'} OR ${products.code} ILIKE ${'%' + params.search + '%'})`
      );
    }
    
    return await query;
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProductByCode(code: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.code, code));
    return product;
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return product;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }
  
  // Suppliers
  async getSuppliers(search?: string): Promise<Supplier[]> {
    let query = db.select().from(suppliers);
    
    if (search) {
      query = query.where(
        sql`(${suppliers.name} ILIKE ${'%' + search + '%'} OR ${suppliers.code} ILIKE ${'%' + search + '%'})`
      );
    }
    
    return await query;
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }
  
  async updateSupplier(id: number, supplierData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(supplierData)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }
  
  async deleteSupplier(id: number): Promise<boolean> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }
  
  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    let query = db.select().from(customers);
    
    if (search) {
      query = query.where(
        sql`(${customers.name} ILIKE ${'%' + search + '%'} OR ${customers.code} ILIKE ${'%' + search + '%'} OR ${customers.phone} ILIKE ${'%' + search + '%'})`
      );
    }
    
    return await query;
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }
  
  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(customerData)
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }
  
  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await db
      .select()
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.date));
  }
  
  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [order] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
    return order;
  }
  
  async createPurchaseOrder(order: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<{ order: PurchaseOrder, items: PurchaseOrderItem[] }> {
    const [newOrder] = await db
      .insert(purchaseOrders)
      .values({
        ...order,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Insert items
    const orderItems = [];
    for (const item of items) {
      const [newItem] = await db
        .insert(purchaseOrderItems)
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
  
  async getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
    return await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
  }
  
  // Sales Orders
  async getSalesOrders(): Promise<SalesOrder[]> {
    return await db
      .select()
      .from(salesOrders)
      .orderBy(desc(salesOrders.date));
  }
  
  async getSalesOrder(id: number): Promise<SalesOrder | undefined> {
    const [order] = await db
      .select()
      .from(salesOrders)
      .where(eq(salesOrders.id, id));
    return order;
  }
  
  async createSalesOrder(order: InsertSalesOrder, items: InsertSalesOrderItem[]): Promise<{ order: SalesOrder, items: SalesOrderItem[] }> {
    const [newOrder] = await db
      .insert(salesOrders)
      .values({
        ...order,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Insert items
    const orderItems = [];
    for (const item of items) {
      const [newItem] = await db
        .insert(salesOrderItems)
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
  
  async getSalesOrderItems(salesOrderId: number): Promise<SalesOrderItem[]> {
    return await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, salesOrderId));
  }
  
  // Inventory
  async getInventory(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .orderBy(asc(products.name));
  }
  
  // Price Adjustments
  async adjustProductPrice(adjustment: InsertPriceAdjustment): Promise<Product> {
    // First record the adjustment
    await db
      .insert(priceAdjustments)
      .values(adjustment);
    
    // Then update the product's price
    const [product] = await db
      .update(products)
      .set({ sellingPrice: adjustment.newPrice })
      .where(eq(products.id, adjustment.productId))
      .returning();
    
    return product;
  }
  
  async getPriceAdjustments(productId?: number): Promise<PriceAdjustment[]> {
    let query = db.select().from(priceAdjustments);
    
    if (productId) {
      query = query.where(eq(priceAdjustments.productId, productId));
    }
    
    return await query.orderBy(desc(priceAdjustments.date));
  }
  
  // Session logging
  async createSessionLog(log: InsertSessionLog): Promise<SessionLog> {
    const [newLog] = await db
      .insert(sessionLogs)
      .values(log)
      .returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
