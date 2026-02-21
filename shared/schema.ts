import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // This will be the CPF for login
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(0),
  cnpjOrCpf: text("cnpj_or_cpf").notNull(),
  phone: text("phone").notNull(), // WhatsApp/Call
  storeName: text("store_name").notNull(),
  storeAddress: text("store_address").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull(),
  collectionAddress: text("collection_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  packageDetails: text("package_details").notNull(),
  customerName: text("customer_name").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  status: text("status").notNull().default('pending'), // pending, ready, accepted, picked_up, delivered
  price: integer("price").notNull(), // Price charged to merchant (in cents/credits)
  driverPrice: integer("driver_price").notNull(), // Price paid to driver (in cents/credits)
  distanceKm: integer("distance_km"), // Calculated distance
  orderNumber: text("order_number").notNull().default("0000"), // 4-digit order number
  collectionCode: text("collection_code").notNull().default("000000"), // Collection code
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true, credits: true }).extend({
  username: z.string().min(11, "CPF deve ter pelo menos 11 dígitos"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, merchantId: true, status: true, createdAt: true, driverPrice: true, price: true, distanceKm: true });
export const insertDepositSchema = createInsertSchema(deposits).omit({ id: true, merchantId: true, status: true, pixQrCode: true, pixPayload: true, createdAt: true });
export const updateProfileSchema = z.object({
  storeAddress: z.string().min(1, "Endereço é obrigatório"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres").optional(),
}).refine(data => {
  if (data.newPassword && !data.currentPassword) return false;
  return true;
}, {
  message: "Senha atual é necessária para definir uma nova senha",
  path: ["currentPassword"]
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
