import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  apiKey: true,
  apiSecret: true,
}).extend({
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario no puede tener más de 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "El nombre de usuario solo puede contener letras, números y guiones bajos"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede tener más de 100 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)"),
  email: z.string()
    .email("Formato de email inválido")
    .max(255, "El email no puede tener más de 255 caracteres"),
});

// Schema para el frontend (incluye confirmPassword)
export const registerUserSchema = insertUserSchema.pick({
  username: true,
  password: true,
  email: true,
}).extend({
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Schema para el servidor (sin confirmPassword)
export const serverRegisterSchema = z.object({
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario no puede tener más de 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "El nombre de usuario solo puede contener letras, números y guiones bajos"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede tener más de 100 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)"),
  email: z.string()
    .email("Formato de email inválido")
    .max(255, "El email no puede tener más de 255 caracteres"),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
});

export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  pair: text("pair").notNull(),
  strategyType: text("strategy_type").notNull(),
  timeframe: text("timeframe").notNull(),
  parameters: jsonb("parameters").notNull(),
  riskPerTrade: doublePrecision("risk_per_trade").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  userId: true,
  name: true,
  pair: true,
  strategyType: true,
  timeframe: true,
  parameters: true,
  riskPerTrade: true,
  isActive: true,
  emailNotifications: true,
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  strategyId: integer("strategy_id").notNull(),
  pair: text("pair").notNull(),
  type: text("type").notNull(),
  price: doublePrecision("price").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull(),
  profitLoss: doublePrecision("profit_loss"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  userId: true,
  strategyId: true,
  pair: true,
  type: true,
  price: true,
  amount: true,
  status: true,
  profitLoss: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export const loginUserSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;

export interface MarketData {
  symbol: string;
  price: string;
  priceChangePercent: string;
  volume: string;
  high: string;
  low: string;
}

export interface CryptoPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
