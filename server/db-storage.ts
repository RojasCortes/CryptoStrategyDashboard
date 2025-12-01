import { users, strategies, trades, type User, type InsertUser, type Strategy, type InsertStrategy, type Trade, type InsertTrade } from "@shared/schema";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
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
}