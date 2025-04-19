import { users, apiKeys, strategies, notificationSettings, tradeHistory } from "@shared/schema";
import type { User, InsertUser, ApiKey, InsertApiKey, Strategy, InsertStrategy, NotificationSetting, InsertNotificationSetting, TradeHistory, InsertTradeHistory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // API Key operations
  getApiKeys(userId: number): Promise<ApiKey[]>;
  getApiKey(id: number): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, isActive: boolean): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<void>;

  // Strategy operations
  getStrategies(userId: number): Promise<Strategy[]>;
  getStrategy(id: number): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, updates: Partial<Strategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: number): Promise<void>;

  // Notification Settings operations
  getNotificationSettings(userId: number): Promise<NotificationSetting | undefined>;
  createNotificationSettings(settings: InsertNotificationSetting): Promise<NotificationSetting>;
  updateNotificationSettings(userId: number, updates: Partial<NotificationSetting>): Promise<NotificationSetting | undefined>;

  // Trade History operations
  getTradeHistory(userId: number, limit?: number): Promise<TradeHistory[]>;
  getTradeHistoryByStrategy(strategyId: number, limit?: number): Promise<TradeHistory[]>;
  createTradeHistory(trade: InsertTradeHistory): Promise<TradeHistory>;

  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private apiKeys: Map<number, ApiKey>;
  private strategies: Map<number, Strategy>;
  private notificationSettings: Map<number, NotificationSetting>;
  private tradeHistory: TradeHistory[];
  sessionStore: session.SessionStore;
  private currentIds: {
    user: number;
    apiKey: number;
    strategy: number;
    notificationSetting: number;
    tradeHistory: number;
  };

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.strategies = new Map();
    this.notificationSettings = new Map();
    this.tradeHistory = [];
    this.currentIds = {
      user: 1,
      apiKey: 1,
      strategy: 1,
      notificationSetting: 1,
      tradeHistory: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  // API Key operations
  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(
      (apiKey) => apiKey.userId === userId
    );
  }

  async getApiKey(id: number): Promise<ApiKey | undefined> {
    return this.apiKeys.get(id);
  }

  async createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey> {
    const id = this.currentIds.apiKey++;
    const createdAt = new Date();
    const apiKey: ApiKey = { ...apiKeyData, id, isActive: true, createdAt };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async updateApiKey(id: number, isActive: boolean): Promise<ApiKey | undefined> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) return undefined;
    
    const updatedApiKey = { ...apiKey, isActive };
    this.apiKeys.set(id, updatedApiKey);
    return updatedApiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    this.apiKeys.delete(id);
  }

  // Strategy operations
  async getStrategies(userId: number): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(
      (strategy) => strategy.userId === userId
    );
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async createStrategy(strategyData: InsertStrategy): Promise<Strategy> {
    const id = this.currentIds.strategy++;
    const createdAt = new Date();
    const strategy: Strategy = { ...strategyData, id, isActive: true, createdAt };
    this.strategies.set(id, strategy);
    return strategy;
  }

  async updateStrategy(id: number, updates: Partial<Strategy>): Promise<Strategy | undefined> {
    const strategy = this.strategies.get(id);
    if (!strategy) return undefined;
    
    const updatedStrategy = { ...strategy, ...updates };
    this.strategies.set(id, updatedStrategy);
    return updatedStrategy;
  }

  async deleteStrategy(id: number): Promise<void> {
    this.strategies.delete(id);
  }

  // Notification Settings operations
  async getNotificationSettings(userId: number): Promise<NotificationSetting | undefined> {
    return Array.from(this.notificationSettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createNotificationSettings(settingsData: InsertNotificationSetting): Promise<NotificationSetting> {
    const id = this.currentIds.notificationSetting++;
    const settings: NotificationSetting = { ...settingsData, id };
    this.notificationSettings.set(id, settings);
    return settings;
  }

  async updateNotificationSettings(userId: number, updates: Partial<NotificationSetting>): Promise<NotificationSetting | undefined> {
    const settings = Array.from(this.notificationSettings.values()).find(
      (settings) => settings.userId === userId
    );
    if (!settings) return undefined;
    
    const updatedSettings = { ...settings, ...updates };
    this.notificationSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }

  // Trade History operations
  async getTradeHistory(userId: number, limit?: number): Promise<TradeHistory[]> {
    const trades = this.tradeHistory
      .filter(trade => trade.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? trades.slice(0, limit) : trades;
  }

  async getTradeHistoryByStrategy(strategyId: number, limit?: number): Promise<TradeHistory[]> {
    const trades = this.tradeHistory
      .filter(trade => trade.strategyId === strategyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? trades.slice(0, limit) : trades;
  }

  async createTradeHistory(tradeData: InsertTradeHistory): Promise<TradeHistory> {
    const id = this.currentIds.tradeHistory++;
    const createdAt = new Date();
    const trade: TradeHistory = { ...tradeData, id, createdAt };
    this.tradeHistory.push(trade);
    return trade;
  }
}

export const storage = new MemStorage();
