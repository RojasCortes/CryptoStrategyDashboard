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
export type User = typeof users.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export const loginUserSchema = insertUserSchema.pick({
  username: true,
  password: true,
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
