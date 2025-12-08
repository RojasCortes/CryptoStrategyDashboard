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
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";
import { encrypt, decrypt } from "./encryption";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData = {
      ...insertUser,
      password: insertUser.password ?? "",
      firebaseUid: insertUser.firebaseUid ?? null,
      displayName: insertUser.displayName ?? null,
      photoURL: insertUser.photoURL ?? null,
      apiKey: insertUser.apiKey ? await encrypt(insertUser.apiKey) : null,
      apiSecret: insertUser.apiSecret ? await encrypt(insertUser.apiSecret) : null
    };
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
      
    return user;
  }

  async updateUserApiKeys(userId: number, apiKey: string, apiSecret: string): Promise<User> {
    const encryptedKey = await encrypt(apiKey);
    const encryptedSecret = await encrypt(apiSecret);
    
    const [user] = await db
      .update(users)
      .set({ apiKey: encryptedKey, apiSecret: encryptedSecret })
      .where(eq(users.id, userId))
      .returning();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }
  
  async updateUserProfile(userId: number, username: string, email: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ username, email })
      .where(eq(users.id, userId))
      .returning();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async updateUserFirebaseInfo(userId: number, displayName?: string, photoURL?: string): Promise<User> {
    const updateData: { displayName?: string; photoURL?: string } = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ firebaseUid })
      .where(eq(users.id, userId))
      .returning();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async getStrategies(userId: number): Promise<Strategy[]> {
    return db
      .select()
      .from(strategies)
      .where(eq(strategies.userId, userId));
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.id, id));
      
    return strategy || undefined;
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    // Ensure default values for isActive and emailNotifications
    const strategyData = {
      ...insertStrategy,
      isActive: insertStrategy.isActive ?? false,
      emailNotifications: insertStrategy.emailNotifications ?? true
    };
    
    const [strategy] = await db
      .insert(strategies)
      .values(strategyData)
      .returning();
      
    return strategy;
  }

  async updateStrategy(id: number, updateData: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const [updatedStrategy] = await db
      .update(strategies)
      .set(updateData)
      .where(eq(strategies.id, id))
      .returning();
      
    return updatedStrategy || undefined;
  }

  async toggleStrategyStatus(id: number, isActive: boolean): Promise<Strategy | undefined> {
    return this.updateStrategy(id, { isActive });
  }

  async deleteStrategy(id: number): Promise<boolean> {
    await db
      .delete(strategies)
      .where(eq(strategies.id, id));
      
    // Since Drizzle doesn't return affected rows count directly,
    // we'll check if the strategy still exists
    const strategy = await this.getStrategy(id);
    return strategy === undefined;
  }

  async getTrades(userId: number, limit?: number): Promise<Trade[]> {
    let results = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(trades.createdAt);
      
    // Apply limit if provided
    if (limit && results.length > limit) {
      results = results.slice(0, limit);
    }
    
    return results;
  }

  async getTradesByStrategy(strategyId: number): Promise<Trade[]> {
    return db
      .select()
      .from(trades)
      .where(eq(trades.strategyId, strategyId))
      .orderBy(trades.createdAt);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    // Ensure profitLoss is initialized correctly
    const tradeData = {
      ...insertTrade,
      profitLoss: insertTrade.profitLoss ?? null
    };
    
    const [trade] = await db
      .insert(trades)
      .values(tradeData)
      .returning();
      
    return trade;
  }

  async updateTradeStatus(id: number, status: string, profitLoss?: number): Promise<Trade | undefined> {
    // If profitLoss is not provided, just update the status
    const updateData: { status: string; profitLoss?: number } = { status };

    if (profitLoss !== undefined) {
      updateData.profitLoss = profitLoss;
    }

    const [updatedTrade] = await db
      .update(trades)
      .set(updateData)
      .where(eq(trades.id, id))
      .returning();

    return updatedTrade || undefined;
  }

  // Simulation methods
  async getSimulationSessions(userId: number): Promise<SimulationSession[]> {
    return db
      .select()
      .from(simulationSessions)
      .where(eq(simulationSessions.userId, userId))
      .orderBy(desc(simulationSessions.createdAt));
  }

  async getSimulationSession(id: number): Promise<SimulationSession | undefined> {
    const [session] = await db
      .select()
      .from(simulationSessions)
      .where(eq(simulationSessions.id, id));

    return session || undefined;
  }

  async createSimulationSession(insertSession: InsertSimulationSession): Promise<SimulationSession> {
    const sessionData = {
      ...insertSession,
      initialBalance: insertSession.initialBalance || 10000.0,
      currentBalance: insertSession.currentBalance || insertSession.initialBalance || 10000.0,
      endDate: insertSession.endDate || null,
      status: insertSession.status || "running",
    };

    const [session] = await db
      .insert(simulationSessions)
      .values(sessionData)
      .returning();

    return session;
  }

  async updateSimulationSession(
    id: number,
    data: Partial<SimulationSession>
  ): Promise<SimulationSession | undefined> {
    const [updatedSession] = await db
      .update(simulationSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(simulationSessions.id, id))
      .returning();

    return updatedSession || undefined;
  }

  async deleteSimulationSession(id: number): Promise<boolean> {
    await db
      .delete(simulationSessions)
      .where(eq(simulationSessions.id, id));

    const session = await this.getSimulationSession(id);
    return session === undefined;
  }

  async getSimulationTrades(simulationId: number): Promise<SimulationTrade[]> {
    return db
      .select()
      .from(simulationTrades)
      .where(eq(simulationTrades.simulationId, simulationId))
      .orderBy(simulationTrades.executedAt);
  }

  async createSimulationTrade(insertTrade: InsertSimulationTrade): Promise<SimulationTrade> {
    const tradeData = {
      ...insertTrade,
      fee: insertTrade.fee || 0.0,
      profitLoss: insertTrade.profitLoss || 0.0,
      reason: insertTrade.reason || null,
    };

    const [trade] = await db
      .insert(simulationTrades)
      .values(tradeData)
      .returning();

    return trade;
  }

  async bulkCreateSimulationTrades(trades: InsertSimulationTrade[]): Promise<SimulationTrade[]> {
    if (trades.length === 0) {
      return [];
    }

    const tradesData = trades.map(trade => ({
      ...trade,
      fee: trade.fee || 0.0,
      profitLoss: trade.profitLoss || 0.0,
      reason: trade.reason || null,
    }));

    return db
      .insert(simulationTrades)
      .values(tradesData)
      .returning();
  }

  async getSimulationPortfolio(simulationId: number): Promise<SimulationPortfolio[]> {
    return db
      .select()
      .from(simulationPortfolio)
      .where(eq(simulationPortfolio.simulationId, simulationId));
  }

  async upsertSimulationPortfolio(
    simulationId: number,
    asset: string,
    amount: number,
    averagePrice: number
  ): Promise<SimulationPortfolio> {
    // Check if portfolio entry exists
    const [existing] = await db
      .select()
      .from(simulationPortfolio)
      .where(
        and(
          eq(simulationPortfolio.simulationId, simulationId),
          eq(simulationPortfolio.asset, asset)
        )
      );

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(simulationPortfolio)
        .set({ amount, averagePrice, updatedAt: new Date() })
        .where(eq(simulationPortfolio.id, existing.id))
        .returning();

      return updated;
    } else {
      // Insert new
      const [created] = await db
        .insert(simulationPortfolio)
        .values({ simulationId, asset, amount, averagePrice })
        .returning();

      return created;
    }
  }

  async getSimulationBalanceHistory(simulationId: number): Promise<SimulationBalanceHistory[]> {
    return db
      .select()
      .from(simulationBalanceHistory)
      .where(eq(simulationBalanceHistory.simulationId, simulationId))
      .orderBy(simulationBalanceHistory.timestamp);
  }

  async createSimulationBalanceHistory(
    simulationId: number,
    balance: number,
    timestamp: Date
  ): Promise<SimulationBalanceHistory> {
    const [history] = await db
      .insert(simulationBalanceHistory)
      .values({ simulationId, balance, timestamp })
      .returning();

    return history;
  }

  async bulkCreateSimulationBalanceHistory(
    items: { simulationId: number; balance: number; timestamp: Date }[]
  ): Promise<SimulationBalanceHistory[]> {
    if (items.length === 0) {
      return [];
    }

    return db
      .insert(simulationBalanceHistory)
      .values(items)
      .returning();
  }
}