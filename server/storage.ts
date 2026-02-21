import { InsertUser, User, InsertOrder, Order, InsertDeposit, Deposit, users, orders, deposits } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: number, credits: number): Promise<User>;

  getOrders(merchantId: number): Promise<Order[]>;
  createOrder(order: InsertOrder & { merchantId: number; price: number; driverPrice: number; distanceKm?: number }): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  getDeposits(merchantId: number): Promise<Deposit[]>;
  getDeposit(id: number): Promise<Deposit | undefined>;
  createDeposit(deposit: InsertDeposit & { merchantId: number }): Promise<Deposit>;
  updateDepositStatus(id: number, status: string): Promise<Deposit>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserCredits(id: number, credits: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ credits })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getOrders(merchantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.merchantId, merchantId));
  }

  async createOrder(order: InsertOrder & { merchantId: number; price: number; driverPrice: number; distanceKm?: number }): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getDeposits(merchantId: number): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.merchantId, merchantId));
  }

  async getDeposit(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async createDeposit(deposit: InsertDeposit & { merchantId: number }): Promise<Deposit> {
    const [newDeposit] = await db.insert(deposits).values(deposit).returning();
    return newDeposit;
  }

  async updateDepositStatus(id: number, status: string): Promise<Deposit> {
    const [updatedDeposit] = await db.update(deposits)
      .set({ status })
      .where(eq(deposits.id, id))
      .returning();
    return updatedDeposit;
  }
}

export const storage = new DatabaseStorage();
