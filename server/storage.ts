import { users, strategies, trades, type User, type InsertUser, type Strategy, type InsertStrategy, type Trade, type InsertTrade } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserApiKeys(userId: number, apiKey: string, apiSecret: string): Promise<User>;
  
  getStrategies(userId: number): Promise<Strategy[]>;
  getStrategy(id: number): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, strategy: Partial<InsertStrategy>): Promise<Strategy | undefined>;
  toggleStrategyStatus(id: number, isActive: boolean): Promise<Strategy | undefined>;
  deleteStrategy(id: number): Promise<boolean>;
  
  getTrades(userId: number, limit?: number): Promise<Trade[]>;
  getTradesByStrategy(strategyId: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTradeStatus(id: number, status: string, profitLoss?: number): Promise<Trade | undefined>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private strategies: Map<number, Strategy>;
  private trades: Map<number, Trade>;
  private currentUserId: number;
  private currentStrategyId: number;
  private currentTradeId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.strategies = new Map();
    this.trades = new Map();
    this.currentUserId = 1;
    this.currentStrategyId = 1;
    this.currentTradeId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUserApiKeys(userId: number, apiKey: string, apiSecret: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, apiKey, apiSecret };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getStrategies(userId: number): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(
      (strategy) => strategy.userId === userId,
    );
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const id = this.currentStrategyId++;
    const now = new Date();
    const strategy: Strategy = { ...insertStrategy, id, createdAt: now };
    this.strategies.set(id, strategy);
    return strategy;
  }

  async updateStrategy(id: number, updateData: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const strategy = await this.getStrategy(id);
    if (!strategy) {
      return undefined;
    }
    const updatedStrategy = { ...strategy, ...updateData };
    this.strategies.set(id, updatedStrategy);
    return updatedStrategy;
  }

  async toggleStrategyStatus(id: number, isActive: boolean): Promise<Strategy | undefined> {
    return this.updateStrategy(id, { isActive });
  }

  async deleteStrategy(id: number): Promise<boolean> {
    return this.strategies.delete(id);
  }

  async getTrades(userId: number, limit?: number): Promise<Trade[]> {
    let trades = Array.from(this.trades.values()).filter(
      (trade) => trade.userId === userId,
    );
    trades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (limit) {
      trades = trades.slice(0, limit);
    }
    return trades;
  }

  async getTradesByStrategy(strategyId: number): Promise<Trade[]> {
    const trades = Array.from(this.trades.values()).filter(
      (trade) => trade.strategyId === strategyId,
    );
    trades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return trades;
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const now = new Date();
    const trade: Trade = { ...insertTrade, id, createdAt: now };
    this.trades.set(id, trade);
    return trade;
  }

  async updateTradeStatus(id: number, status: string, profitLoss?: number): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) {
      return undefined;
    }
    const updatedTrade = { ...trade, status, profitLoss: profitLoss ?? trade.profitLoss };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }
}

export const storage = new MemStorage();
