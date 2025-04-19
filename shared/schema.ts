import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Binance API key schema
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  apiKey: text("api_key").notNull(),
  secretKey: text("secret_key").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  userId: true,
  apiKey: true,
  secretKey: true,
});

// Trading Strategy schema
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // MovingAverage, RSI, MACD, etc.
  pair: text("pair").notNull(), // BTC/USDT, ETH/USDT, etc.
  timeframe: text("timeframe").notNull(), // 1m, 5m, 15m, 1h, etc.
  parameters: json("parameters").notNull(), // Strategy-specific parameters
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  userId: true,
  name: true,
  type: true,
  pair: true,
  timeframe: true,
  parameters: true,
});

// Email Notification Settings schema
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tradeExecution: boolean("trade_execution").notNull().default(true),
  dailyReports: boolean("daily_reports").notNull().default(true),
  priceAlerts: boolean("price_alerts").notNull().default(false),
  systemNotifications: boolean("system_notifications").notNull().default(true),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).pick({
  userId: true,
  tradeExecution: true,
  dailyReports: true,
  priceAlerts: true,
  systemNotifications: true,
});

// Trade History schema
export const tradeHistory = pgTable("trade_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  strategyId: integer("strategy_id").notNull().references(() => strategies.id),
  pair: text("pair").notNull(),
  type: text("type").notNull(), // Buy or Sell
  price: text("price").notNull(),
  amount: text("amount").notNull(),
  profit: text("profit").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTradeHistorySchema = createInsertSchema(tradeHistory).pick({
  userId: true,
  strategyId: true, 
  pair: true,
  type: true,
  price: true,
  amount: true,
  profit: true,
});

// ---- Types ----
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingsSchema>;

export type TradeHistory = typeof tradeHistory.$inferSelect;
export type InsertTradeHistory = z.infer<typeof insertTradeHistorySchema>;
