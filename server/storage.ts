import {
  users, strategies, trades,
  simulationSessions, simulationTrades, simulationPortfolio, simulationBalanceHistory,
  type User, type InsertUser,
  type Strategy, type InsertStrategy,
  type Trade, type InsertTrade,
  type SimulationSession, type InsertSimulationSession,
  type SimulationTrade, type InsertSimulationTrade,
  type SimulationPortfolio,
  type SimulationBalanceHistory
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserApiKeys(userId: number, apiKey: string, apiSecret: string): Promise<User>;
  updateUserProfile(userId: number, username: string, email: string): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User>;
  updateUserFirebaseInfo(userId: number, displayName?: string, photoURL?: string): Promise<User>;
  updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<User>;

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

  // Simulation methods
  getSimulationSessions(userId: number): Promise<SimulationSession[]>;
  getSimulationSession(id: number): Promise<SimulationSession | undefined>;
  createSimulationSession(session: InsertSimulationSession): Promise<SimulationSession>;
  updateSimulationSession(id: number, data: Partial<SimulationSession>): Promise<SimulationSession | undefined>;
  deleteSimulationSession(id: number): Promise<boolean>;

  getSimulationTrades(simulationId: number): Promise<SimulationTrade[]>;
  createSimulationTrade(trade: InsertSimulationTrade): Promise<SimulationTrade>;
  bulkCreateSimulationTrades(trades: InsertSimulationTrade[]): Promise<SimulationTrade[]>;

  getSimulationPortfolio(simulationId: number): Promise<SimulationPortfolio[]>;
  upsertSimulationPortfolio(simulationId: number, asset: string, amount: number, averagePrice: number): Promise<SimulationPortfolio>;

  getSimulationBalanceHistory(simulationId: number): Promise<SimulationBalanceHistory[]>;
  createSimulationBalanceHistory(simulationId: number, balance: number, timestamp: Date): Promise<SimulationBalanceHistory>;
  bulkCreateSimulationBalanceHistory(items: { simulationId: number, balance: number, timestamp: Date }[]): Promise<SimulationBalanceHistory[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private strategies: Map<number, Strategy>;
  private trades: Map<number, Trade>;
  private simulationSessions: Map<number, SimulationSession>;
  private simulationTrades: Map<number, SimulationTrade>;
  private simulationPortfolio: Map<string, SimulationPortfolio>;
  private simulationBalanceHistory: Map<number, SimulationBalanceHistory>;
  private currentUserId: number;
  private currentStrategyId: number;
  private currentTradeId: number;
  private currentSimulationId: number;
  private currentSimulationTradeId: number;
  private currentSimulationPortfolioId: number;
  private currentSimulationBalanceHistoryId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.strategies = new Map();
    this.trades = new Map();
    this.simulationSessions = new Map();
    this.simulationTrades = new Map();
    this.simulationPortfolio = new Map();
    this.simulationBalanceHistory = new Map();
    this.currentUserId = 1;
    this.currentStrategyId = 1;
    this.currentTradeId = 1;
    this.currentSimulationId = 1;
    this.currentSimulationTradeId = 1;
    this.currentSimulationPortfolioId = 1;
    this.currentSimulationBalanceHistoryId = 1;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      password: insertUser.password ?? "",
      firebaseUid: insertUser.firebaseUid ?? null,
      displayName: insertUser.displayName ?? null,
      photoURL: insertUser.photoURL ?? null,
      apiKey: insertUser.apiKey ?? null,
      apiSecret: insertUser.apiSecret ?? null 
    };
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
  
  async updateUserProfile(userId: number, username: string, email: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, username, email };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, password: hashedPassword };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserFirebaseInfo(userId: number, displayName?: string, photoURL?: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { 
      ...user, 
      displayName: displayName ?? user.displayName,
      photoURL: photoURL ?? user.photoURL 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, firebaseUid };
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
    // Ensure isActive and emailNotifications are set correctly
    const strategy: Strategy = { 
      ...insertStrategy, 
      id, 
      createdAt: now,
      isActive: insertStrategy.isActive ?? false,
      emailNotifications: insertStrategy.emailNotifications ?? true
    };
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
    // Ensure profitLoss is set correctly
    const trade: Trade = { 
      ...insertTrade, 
      id, 
      createdAt: now,
      profitLoss: insertTrade.profitLoss ?? null 
    };
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

  // Simulation methods
  async getSimulationSessions(userId: number): Promise<SimulationSession[]> {
    return Array.from(this.simulationSessions.values()).filter(
      (session) => session.userId === userId
    );
  }

  async getSimulationSession(id: number): Promise<SimulationSession | undefined> {
    return this.simulationSessions.get(id);
  }

  async createSimulationSession(insertSession: InsertSimulationSession): Promise<SimulationSession> {
    const id = this.currentSimulationId++;
    const now = new Date();
    const session: SimulationSession = {
      id,
      userId: insertSession.userId,
      strategyId: insertSession.strategyId,
      name: insertSession.name,
      initialBalance: insertSession.initialBalance || 10000.0,
      currentBalance: insertSession.currentBalance || insertSession.initialBalance || 10000.0,
      startDate: insertSession.startDate,
      endDate: insertSession.endDate || null,
      status: insertSession.status || "running",
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfitLoss: 0.0,
      maxDrawdown: 0.0,
      returnPercentage: 0.0,
      createdAt: now,
      updatedAt: now,
    };
    this.simulationSessions.set(id, session);
    return session;
  }

  async updateSimulationSession(id: number, data: Partial<SimulationSession>): Promise<SimulationSession | undefined> {
    const session = this.simulationSessions.get(id);
    if (!session) {
      return undefined;
    }
    const updatedSession = { ...session, ...data, updatedAt: new Date() };
    this.simulationSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSimulationSession(id: number): Promise<boolean> {
    return this.simulationSessions.delete(id);
  }

  async getSimulationTrades(simulationId: number): Promise<SimulationTrade[]> {
    const trades = Array.from(this.simulationTrades.values()).filter(
      (trade) => trade.simulationId === simulationId
    );
    trades.sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());
    return trades;
  }

  async createSimulationTrade(insertTrade: InsertSimulationTrade): Promise<SimulationTrade> {
    const id = this.currentSimulationTradeId++;
    const now = new Date();
    const trade: SimulationTrade = {
      id,
      simulationId: insertTrade.simulationId,
      userId: insertTrade.userId,
      strategyId: insertTrade.strategyId,
      pair: insertTrade.pair,
      type: insertTrade.type,
      price: insertTrade.price,
      amount: insertTrade.amount,
      fee: insertTrade.fee || 0.0,
      total: insertTrade.total,
      balanceAfter: insertTrade.balanceAfter,
      profitLoss: insertTrade.profitLoss || 0.0,
      reason: insertTrade.reason || null,
      executedAt: insertTrade.executedAt,
      createdAt: now,
    };
    this.simulationTrades.set(id, trade);
    return trade;
  }

  async bulkCreateSimulationTrades(trades: InsertSimulationTrade[]): Promise<SimulationTrade[]> {
    const created: SimulationTrade[] = [];
    for (const trade of trades) {
      const result = await this.createSimulationTrade(trade);
      created.push(result);
    }
    return created;
  }

  async getSimulationPortfolio(simulationId: number): Promise<SimulationPortfolio[]> {
    return Array.from(this.simulationPortfolio.values()).filter(
      (portfolio) => portfolio.simulationId === simulationId
    );
  }

  async upsertSimulationPortfolio(
    simulationId: number,
    asset: string,
    amount: number,
    averagePrice: number
  ): Promise<SimulationPortfolio> {
    const key = `${simulationId}-${asset}`;
    const existing = this.simulationPortfolio.get(key);

    const portfolio: SimulationPortfolio = {
      id: existing?.id || this.currentSimulationPortfolioId++,
      simulationId,
      asset,
      amount,
      averagePrice,
      updatedAt: new Date(),
    };

    this.simulationPortfolio.set(key, portfolio);
    return portfolio;
  }

  async getSimulationBalanceHistory(simulationId: number): Promise<SimulationBalanceHistory[]> {
    const history = Array.from(this.simulationBalanceHistory.values()).filter(
      (item) => item.simulationId === simulationId
    );
    history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return history;
  }

  async createSimulationBalanceHistory(
    simulationId: number,
    balance: number,
    timestamp: Date
  ): Promise<SimulationBalanceHistory> {
    const id = this.currentSimulationBalanceHistoryId++;
    const now = new Date();
    const history: SimulationBalanceHistory = {
      id,
      simulationId,
      balance,
      timestamp,
      createdAt: now,
    };
    this.simulationBalanceHistory.set(id, history);
    return history;
  }

  async bulkCreateSimulationBalanceHistory(
    items: { simulationId: number; balance: number; timestamp: Date }[]
  ): Promise<SimulationBalanceHistory[]> {
    const created: SimulationBalanceHistory[] = [];
    for (const item of items) {
      const result = await this.createSimulationBalanceHistory(
        item.simulationId,
        item.balance,
        item.timestamp
      );
      created.push(result);
    }
    return created;
  }
}

// Import the DatabaseStorage
import { DatabaseStorage } from "./db-storage";

// Use DatabaseStorage instead of MemStorage for production
export const storage = new DatabaseStorage();
