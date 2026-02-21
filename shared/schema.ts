import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull(),
  collectionAddress: text("collection_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  packageDetails: text("package_details").notNull(),
  status: text("status").notNull().default('pending'), // pending, accepted, picked_up, delivered
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  credits: integer("credits").notNull(),
  status: text("status").notNull().default('pending'), // pending, paid
  pixQrCode: text("pix_qr_code").notNull(),
  pixPayload: text("pix_payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  deposits: many(deposits),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  merchant: one(users, {
    fields: [orders.merchantId],
    references: [users.id],
  }),
}));

export const depositsRelations = relations(deposits, ({ one }) => ({
  merchant: one(users, {
    fields: [deposits.merchantId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, credits: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, merchantId: true, status: true, createdAt: true });
export const insertDepositSchema = createInsertSchema(deposits).omit({ id: true, merchantId: true, status: true, pixQrCode: true, pixPayload: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;