import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").default("").notNull(),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid").unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firebaseUid: true,
  displayName: true,
  photoURL: true,
  apiKey: true,
  apiSecret: true,
}).extend({
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario no puede tener más de 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "El nombre de usuario solo puede contener letras, números y guiones bajos"),
  password: z.string().optional().default(""),
  email: z.string()
    .email("Formato de email inválido")
    .max(255, "El email no puede tener más de 255 caracteres"),
  firebaseUid: z.string().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
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
  description: text("description"),
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
  description: true,
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

// Simulation Tables
export const simulationSessions = pgTable("simulation_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  strategyId: integer("strategy_id").notNull(),
  name: text("name").notNull(),
  initialBalance: doublePrecision("initial_balance").notNull().default(10000.0),
  currentBalance: doublePrecision("current_balance").notNull().default(10000.0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("running"), // 'running', 'completed', 'stopped'
  totalTrades: integer("total_trades").default(0),
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  totalProfitLoss: doublePrecision("total_profit_loss").default(0.0),
  maxDrawdown: doublePrecision("max_drawdown").default(0.0),
  returnPercentage: doublePrecision("return_percentage").default(0.0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const simulationTrades = pgTable("simulation_trades", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull(),
  userId: integer("user_id").notNull(),
  strategyId: integer("strategy_id").notNull(),
  pair: text("pair").notNull(),
  type: text("type").notNull(), // 'BUY' or 'SELL'
  price: doublePrecision("price").notNull(),
  amount: doublePrecision("amount").notNull(),
  fee: doublePrecision("fee").default(0.0),
  total: doublePrecision("total").notNull(),
  balanceAfter: doublePrecision("balance_after").notNull(),
  profitLoss: doublePrecision("profit_loss").default(0.0),
  reason: text("reason"), // Why the trade was made
  executedAt: timestamp("executed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const simulationPortfolio = pgTable("simulation_portfolio", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull(),
  asset: text("asset").notNull(),
  amount: doublePrecision("amount").notNull().default(0.0),
  averagePrice: doublePrecision("average_price").notNull().default(0.0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const simulationBalanceHistory = pgTable("simulation_balance_history", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull(),
  balance: doublePrecision("balance").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSimulationSessionSchema = createInsertSchema(simulationSessions).pick({
  userId: true,
  strategyId: true,
  name: true,
  initialBalance: true,
  currentBalance: true,
  startDate: true,
  endDate: true,
  status: true,
});

export const insertSimulationTradeSchema = createInsertSchema(simulationTrades).pick({
  simulationId: true,
  userId: true,
  strategyId: true,
  pair: true,
  type: true,
  price: true,
  amount: true,
  fee: true,
  total: true,
  balanceAfter: true,
  profitLoss: true,
  reason: true,
  executedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type SimulationSession = typeof simulationSessions.$inferSelect;
export type InsertSimulationSession = z.infer<typeof insertSimulationSessionSchema>;
export type SimulationTrade = typeof simulationTrades.$inferSelect;
export type InsertSimulationTrade = z.infer<typeof insertSimulationTradeSchema>;
export type SimulationPortfolio = typeof simulationPortfolio.$inferSelect;
export type SimulationBalanceHistory = typeof simulationBalanceHistory.$inferSelect;

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
