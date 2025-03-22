import { 
  scripts, users, categories, tags, scriptTags, favorites, comments, ratings, activityLogs, 
  affiliateLinks, affiliateClicks, adCampaigns, adBanners,
  type Script, type InsertScript, type User, type InsertUser, type Category, type InsertCategory,
  type Tag, type InsertTag, type Favorite, type InsertFavorite, type Comment, type InsertComment,
  type Rating, type InsertRating, type AffiliateLink, type InsertAffiliateLink, type AdCampaign,
  type InsertAdCampaign, type AdBanner, type InsertAdBanner
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);

const MemoryStore = createMemoryStore(session);

// Password hashing functions
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export interface IStorage {
  // Script operations
  getAllScripts(): Promise<Script[]>;
  getScriptById(id: number): Promise<Script | undefined>;
  searchScripts(query: string): Promise<Script[]>;
  createScript(script: InsertScript, userId?: number): Promise<Script>;
  getUserScripts(userId: number): Promise<Script[]>;
  updateScript(id: number, scriptData: Partial<Omit<Script, "id">>): Promise<Script | undefined>;
  deleteScript(id: number): Promise<boolean>;
  getFeaturedScripts(limit?: number): Promise<Script[]>;
  incrementScriptViews(id: number): Promise<void>;
  incrementScriptCopies(id: number): Promise<void>;
  
  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<Omit<User, "id" | "password">>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  verifyUser(username: string, password: string): Promise<User | null>;
  banUser(id: number, reason: string, expiryDate?: Date): Promise<User | undefined>;
  unbanUser(id: number): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;
  updateUserReputation(id: number, amount: number): Promise<User | undefined>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getScriptsByCategory(categoryId: number): Promise<Script[]>;
  
  // Tag operations
  getAllTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  getTagBySlug(slug: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tagData: Partial<Tag>): Promise<Tag | undefined>;
  deleteTag(id: number): Promise<boolean>;
  getScriptsByTag(tagId: number): Promise<Script[]>;
  addTagToScript(scriptId: number, tagId: number): Promise<boolean>;
  removeTagFromScript(scriptId: number, tagId: number): Promise<boolean>;
  getTagsForScript(scriptId: number): Promise<Tag[]>;
  
  // Favorites operations
  getFavoritesByUser(userId: number): Promise<Script[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, scriptId: number): Promise<boolean>;
  isFavorite(userId: number, scriptId: number): Promise<boolean>;
  
  // Comments operations
  getCommentsByScript(scriptId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  approveComment(id: number): Promise<Comment | undefined>;
  
  // Ratings operations
  getScriptRating(scriptId: number): Promise<number>;
  rateScript(rating: InsertRating): Promise<Rating>;
  getUserRating(userId: number, scriptId: number): Promise<Rating | undefined>;
  
  // Analytics operations
  logActivity(userId: number | null, action: string, details: any, ipAddress?: string, userAgent?: string): Promise<void>;
  getLatestActivities(limit?: number): Promise<any[]>;
  getUserActivities(userId: number, limit?: number): Promise<any[]>;
  getActivityStats(startDate: Date, endDate: Date): Promise<any>;
  
  // Affiliate operations
  createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink>;
  getAffiliateLinks(userId?: number): Promise<AffiliateLink[]>;
  getAffiliateLinkByCode(code: string): Promise<AffiliateLink | undefined>;
  updateAffiliateLink(id: number, linkData: Partial<AffiliateLink>): Promise<AffiliateLink | undefined>;
  deleteAffiliateLink(id: number): Promise<boolean>;
  trackAffiliateClick(linkId: number, ipAddress?: string, userAgent?: string, referrer?: string): Promise<void>;
  getAffiliateClickStats(linkId?: number, startDate?: Date, endDate?: Date): Promise<any>;
  
  // Ad campaign operations
  createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign>;
  getAdCampaigns(): Promise<AdCampaign[]>;
  getAdCampaignById(id: number): Promise<AdCampaign | undefined>;
  updateAdCampaign(id: number, campaignData: Partial<AdCampaign>): Promise<AdCampaign | undefined>;
  deleteAdCampaign(id: number): Promise<boolean>;
  
  // Ad banner operations
  createAdBanner(banner: InsertAdBanner): Promise<AdBanner>;
  getAdBanners(campaignId?: number): Promise<AdBanner[]>;
  getAdBannerById(id: number): Promise<AdBanner | undefined>;
  updateAdBanner(id: number, bannerData: Partial<AdBanner>): Promise<AdBanner | undefined>;
  deleteAdBanner(id: number): Promise<boolean>;
  trackAdImpression(id: number): Promise<void>;
  trackAdClick(id: number): Promise<void>;
  getActiveAdBanners(position?: string): Promise<AdBanner[]>;
  
  // Session store
  sessionStore: any; // Store for session data (using any to avoid type conflicts)
}

export class MemStorage implements IStorage {
  private scripts: Map<number, Script>;
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private tags: Map<number, Tag>;
  private scriptTags: Map<string, {scriptId: number, tagId: number}>;
  private favorites: Map<string, Favorite>;
  private comments: Map<number, Comment>;
  private ratings: Map<string, Rating>;
  private activityLogs: any[]; // Array for simplicity
  private affiliateLinks: Map<number, AffiliateLink>;
  private affiliateClicks: any[]; // Array for simplicity
  private adCampaigns: Map<number, AdCampaign>;
  private adBanners: Map<number, AdBanner>;
  
  // ID counters
  scriptId: number;
  userId: number;
  categoryId: number;
  tagId: number;
  favoriteId: number;
  commentId: number;
  ratingId: number;
  activityLogId: number;
  affiliateLinkId: number;
  affiliateClickId: number;
  adCampaignId: number;
  adBannerId: number;
  
  sessionStore: any; // Memory-based session storage (using any to avoid type conflicts)

  constructor() {
    // Initialize maps
    this.scripts = new Map();
    this.users = new Map();
    this.categories = new Map();
    this.tags = new Map();
    this.scriptTags = new Map();
    this.favorites = new Map();
    this.comments = new Map();
    this.ratings = new Map();
    this.activityLogs = [];
    this.affiliateLinks = new Map();
    this.affiliateClicks = [];
    this.adCampaigns = new Map();
    this.adBanners = new Map();
    
    // Initialize IDs
    this.scriptId = 1;
    this.userId = 1;
    this.categoryId = 1;
    this.tagId = 1;
    this.favoriteId = 1;
    this.commentId = 1;
    this.ratingId = 1;
    this.activityLogId = 1;
    this.affiliateLinkId = 1;
    this.affiliateClickId = 1;
    this.adCampaignId = 1;
    this.adBannerId = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add initial data
    this.addInitialCategories();
    this.addInitialTags();
    this.addInitialScripts();
    this.addInitialUsers();
    this.addInitialAdCampaigns();
  }

  // Script operations
  async getAllScripts(): Promise<Script[]> {
    return Array.from(this.scripts.values());
  }

  async getScriptById(id: number): Promise<Script | undefined> {
    return this.scripts.get(id);
  }

  async searchScripts(query: string): Promise<Script[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.scripts.values()).filter(script =>
      script.title.toLowerCase().includes(searchTerm) ||
      script.description.toLowerCase().includes(searchTerm) ||
      (script.gameType && script.gameType.toLowerCase().includes(searchTerm)) ||
      (script.gameLink && script.gameLink.toLowerCase().includes(searchTerm))
    );
  }

  async createScript(insertScript: InsertScript, userId?: number): Promise<Script> {
    const id = this.scriptId++;
    
    // Convert lastUpdated to Date if it's a string
    let lastUpdated: Date;
    if (typeof insertScript.lastUpdated === 'string') {
      lastUpdated = new Date(insertScript.lastUpdated);
    } else if (insertScript.lastUpdated instanceof Date) {
      lastUpdated = insertScript.lastUpdated;
    } else {
      lastUpdated = new Date();
    }
    
    const script: Script = { 
      id,
      title: insertScript.title,
      description: insertScript.description,
      code: insertScript.code,
      imageUrl: insertScript.imageUrl,
      gameType: insertScript.gameType || null, 
      gameLink: insertScript.gameLink || null,
      discordLink: insertScript.discordLink || null,
      lastUpdated: lastUpdated,
      userId: userId || null,
      isApproved: true,
      categoryId: insertScript.categoryId || null,
      featuredRank: null,
      views: 0,
      copies: 0,
      avgRating: 0,
      ratingCount: 0
    };
    this.scripts.set(id, script);
    return script;
  }

  async getUserScripts(userId: number): Promise<Script[]> {
    return Array.from(this.scripts.values()).filter(script => script.userId === userId);
  }
  
  async updateScript(id: number, scriptData: Partial<Omit<Script, "id">>): Promise<Script | undefined> {
    const script = this.scripts.get(id);
    if (!script) return undefined;
    
    const updatedScript: Script = { ...script, ...scriptData };
    this.scripts.set(id, updatedScript);
    return updatedScript;
  }
  
  async deleteScript(id: number): Promise<boolean> {
    return this.scripts.delete(id);
  }

  // User operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const hashedPassword = await hashPassword(userData.password);
    
    const user: User = {
      id,
      username: userData.username,
      password: hashedPassword,
      email: userData.email || null,
      avatarUrl: userData.avatarUrl || "/images/default-avatar.png",
      createdAt: new Date(),
      bio: userData.bio || "",
      discordUsername: userData.discordUsername || null,
      role: userData.role || "user",
      lastLoginAt: null,
      reputation: 0,
      isBanned: false,
      banReason: null,
      banExpiresAt: null,
      ipAddress: null
    };
    
    this.users.set(id, user);
    return { ...user, password: "[HIDDEN]" } as User; // Don't return actual password
  }

  async updateUser(id: number, userData: Partial<Omit<User, "id" | "password">>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    return { ...updatedUser, password: "[HIDDEN]" } as User; // Don't return actual password
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const hashedPassword = await hashPassword(newPassword);
    const updatedUser: User = { ...user, password: hashedPassword };
    this.users.set(id, updatedUser);
    
    return { ...updatedUser, password: "[HIDDEN]" } as User; // Don't return actual password
  }

  // Authentication helpers
  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) return null;
    
    return { ...user, password: "[HIDDEN]" } as User; // Don't return actual password
  }

  private addInitialScripts() {
    const initialScripts: InsertScript[] = [
      {
        title: "Blade Ball Auto Parry",
        description: "Advanced auto parry script for Blade Ball with customizable settings and success rate. Works in all game modes and maps.",
        code: `loadstring(game:HttpGet("https://raw.githubusercontent.com/example/blade-ball-script/main.lua"))()

-- This script provides an advanced auto parry system for Blade Ball
-- Configuration:
--   - Press Right Shift to open settings
--   - Adjust timing in the range of 0.1 to 0.5
--   - Set success rate between 70% and 100%
--   - Toggle visual indicators on/off`,
        imageUrl: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Blade Ball",
        gameLink: "https://www.roblox.com/games/13772394625/Blade-Ball",
        lastUpdated: new Date()
      },
      {
        title: "Blox Fruits Hub",
        description: "Complete hub for Blox Fruits with auto-farm, teleports, ESP, and more features. Regular updates to match game changes.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/blox-fruits-hub/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1602673221577-0b56d7ce446b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Blox Fruits",
        gameLink: "https://www.roblox.com/games/2753915549/Blox-Fruits",
        lastUpdated: new Date()
      },
      {
        title: "Pet Simulator X Auto Farm",
        description: "Powerful auto farm script for Pet Simulator X with auto-collect, auto-hatch, and coin farming capabilities.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/pet-sim-x/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Pet Simulator X",
        gameLink: "https://www.roblox.com/games/6284583030/Pet-Simulator-X",
        lastUpdated: new Date()
      },
      {
        title: "Arsenal Aimbot & ESP",
        description: "Complete Arsenal script with aimbot, wallhack, ESP, and silent aim features. Fully customizable through an easy-to-use interface.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/arsenal-script/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Arsenal",
        gameLink: "https://www.roblox.com/games/286090429/Arsenal",
        lastUpdated: new Date()
      },
      {
        title: "Doors Entity ESP",
        description: "Advanced script for Doors with entity ESP, auto-skip puzzles, and item locator. Get early warnings for all entities.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/doors-script/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Doors",
        gameLink: "https://www.roblox.com/games/6516141723/DOORS",
        lastUpdated: new Date()
      },
      {
        title: "Brookhaven RP Admin",
        description: "Ultimate admin script for Brookhaven RP with teleportation, vehicle spawning, and custom animations. Take control of the game.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/brookhaven-admin/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1640955014216-75201056c829?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Brookhaven",
        gameLink: "https://www.roblox.com/games/4924922222/Brookhaven-RP",
        lastUpdated: new Date()
      }
    ];

    initialScripts.forEach(script => {
      this.createScript(script);
    });
  }

  private async addInitialUsers() {
    await this.createUser({
      username: "demo",
      password: "password123",
      email: "demo@example.com",
      avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      bio: "Just a demo user who loves Roblox scripting!",
      discordUsername: "demo#1234",
      role: "user"
    });
    
    // Create a moderator user
    await this.createUser({
      username: "moderator",
      password: "moderator123",
      email: "mod@devscripts.com",
      avatarUrl: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      bio: "Moderator of DevScripts platform",
      discordUsername: "mod#1234",
      role: "moderator"
    });
    
    // Create an admin user
    await this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@devscripts.com",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      bio: "Administrator of DevScripts platform",
      discordUsername: "admin#0000",
      role: "admin"
    });
  }

  private addInitialCategories() {
    const categories: InsertCategory[] = [
      {
        name: "Combat",
        description: "Scripts for combat and PvP games",
        slug: "combat",
        imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
        order: 1
      },
      {
        name: "Simulation",
        description: "Scripts for simulation and tycoon games",
        slug: "simulation",
        imageUrl: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
        order: 2
      },
      {
        name: "Adventure",
        description: "Scripts for adventure and exploration games",
        slug: "adventure",
        imageUrl: "https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
        order: 3
      },
      {
        name: "Utility",
        description: "Utility scripts that work across multiple games",
        slug: "utility",
        imageUrl: "https://images.unsplash.com/photo-1585184394271-4c0a47dc59c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
        order: 4
      }
    ];

    categories.forEach(category => {
      const id = this.categoryId++;
      this.categories.set(id, {
        id,
        name: category.name,
        slug: category.slug,
        description: category.description || null,
        imageUrl: category.imageUrl || null,
        order: category.order || null,
        createdAt: new Date()
      });
    });
  }

  private addInitialTags() {
    const tags: InsertTag[] = [
      { name: "Aimbot", slug: "aimbot", description: "Automatic aiming scripts", color: "#ff0000" },
      { name: "ESP", slug: "esp", description: "Wall hacks and player detection", color: "#00ff00" },
      { name: "Auto Farm", slug: "auto-farm", description: "Automatic resource farming", color: "#0000ff" },
      { name: "GUI", slug: "gui", description: "Graphical user interfaces", color: "#ffff00" },
      { name: "Admin", slug: "admin", description: "Administrative tools", color: "#ff00ff" },
      { name: "Silent Aim", slug: "silent-aim", description: "Hidden aiming assistance", color: "#00ffff" },
      { name: "Teleport", slug: "teleport", description: "Location teleportation", color: "#ff5500" },
      { name: "Speed", slug: "speed", description: "Character speed modification", color: "#5500ff" },
      { name: "Hitbox", slug: "hitbox", description: "Hitbox modification scripts", color: "#55ff00" },
      { name: "Infinite Jump", slug: "infinite-jump", description: "Unlimited jumping ability", color: "#00ff55" }
    ];

    tags.forEach(tag => {
      this.createTag(tag);
    });
  }

  private addInitialAdCampaigns() {
    const campaign: InsertAdCampaign = {
      name: "Main Campaign",
      description: "Primary ad campaign for the site",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      createdBy: 3 // Admin user ID
    };

    const id = this.adCampaignId++;
    this.adCampaigns.set(id, {
      id,
      name: campaign.name,
      description: campaign.description || null,
      startDate: campaign.startDate,
      endDate: campaign.endDate || null,
      isActive: campaign.isActive || null,
      createdBy: campaign.createdBy || null,
      createdAt: new Date()
    });

    // Add some initial banners for the campaign
    this.createAdBanner({
      campaignId: id,
      name: "Top Banner 1",
      imageUrl: "https://via.placeholder.com/720x90/1e293b/ffffff?text=DevScripts+Premium",
      linkUrl: "https://example.com/premium",
      position: "top",
      isActive: true
    });

    this.createAdBanner({
      campaignId: id,
      name: "Top Banner 2",
      imageUrl: "https://via.placeholder.com/720x90/0f172a/ffffff?text=Roblox+Scripts+Hub",
      linkUrl: "https://example.com/scripts",
      position: "top",
      isActive: true
    });
  }

  // Implementation of missing methods from IStorage interface
  
  // Script operations
  async getFeaturedScripts(limit: number = 5): Promise<Script[]> {
    return Array.from(this.scripts.values())
      .filter(script => script.featuredRank !== null)
      .sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999))
      .slice(0, limit);
  }

  async incrementScriptViews(id: number): Promise<void> {
    const script = this.scripts.get(id);
    if (script) {
      script.views = (script.views || 0) + 1;
      this.scripts.set(id, script);
    }
  }

  async incrementScriptCopies(id: number): Promise<void> {
    const script = this.scripts.get(id);
    if (script) {
      script.copies = (script.copies || 0) + 1;
      this.scripts.set(id, script);
    }
  }

  // User operations
  async getAllUsers(): Promise<User[]> {
    // Return all users with passwords hidden
    return Array.from(this.users.values()).map(user => ({ ...user, password: "[HIDDEN]" } as User));
  }

  async banUser(id: number, reason: string, expiryDate?: Date): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { 
      ...user, 
      isBanned: true, 
      banReason: reason,
      banExpiresAt: expiryDate || null
    };
    this.users.set(id, updatedUser);
    
    return { ...updatedUser, password: "[HIDDEN]" } as User;
  }

  async unbanUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { 
      ...user, 
      isBanned: false, 
      banReason: null,
      banExpiresAt: null
    };
    this.users.set(id, updatedUser);
    
    return { ...updatedUser, password: "[HIDDEN]" } as User;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = new Date();
      this.users.set(id, user);
    }
  }

  async updateUserReputation(id: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { 
      ...user, 
      reputation: (user.reputation || 0) + amount
    };
    this.users.set(id, updatedUser);
    
    return { ...updatedUser, password: "[HIDDEN]" } as User;
  }
  
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(category => category.slug === slug);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { 
      id,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      imageUrl: category.imageUrl || null,
      order: category.order || null,
      createdAt: new Date()
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getScriptsByCategory(categoryId: number): Promise<Script[]> {
    return Array.from(this.scripts.values()).filter(script => script.categoryId === categoryId);
  }

  // Ad campaign operations
  async createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign> {
    const id = this.adCampaignId++;
    const newCampaign: AdCampaign = {
      id,
      name: campaign.name,
      description: campaign.description || null,
      startDate: campaign.startDate,
      endDate: campaign.endDate || null,
      isActive: campaign.isActive || null,
      createdBy: campaign.createdBy || null,
      createdAt: new Date()
    };
    this.adCampaigns.set(id, newCampaign);
    return newCampaign;
  }

  async getAdCampaigns(): Promise<AdCampaign[]> {
    return Array.from(this.adCampaigns.values());
  }

  async getAdCampaignById(id: number): Promise<AdCampaign | undefined> {
    return this.adCampaigns.get(id);
  }

  async updateAdCampaign(id: number, campaignData: Partial<AdCampaign>): Promise<AdCampaign | undefined> {
    const campaign = this.adCampaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign: AdCampaign = { ...campaign, ...campaignData };
    this.adCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteAdCampaign(id: number): Promise<boolean> {
    return this.adCampaigns.delete(id);
  }

  // Ad banner operations
  async createAdBanner(banner: InsertAdBanner): Promise<AdBanner> {
    const id = this.adBannerId++;
    const newBanner: AdBanner = {
      id,
      name: banner.name,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position || null,
      campaignId: banner.campaignId || null,
      isActive: banner.isActive || null,
      impressions: 0,
      clicks: 0,
      createdAt: new Date()
    };
    this.adBanners.set(id, newBanner);
    return newBanner;
  }

  async getAdBanners(campaignId?: number): Promise<AdBanner[]> {
    const banners = Array.from(this.adBanners.values());
    return campaignId 
      ? banners.filter(banner => banner.campaignId === campaignId)
      : banners;
  }

  async getAdBannerById(id: number): Promise<AdBanner | undefined> {
    return this.adBanners.get(id);
  }

  async updateAdBanner(id: number, bannerData: Partial<AdBanner>): Promise<AdBanner | undefined> {
    const banner = this.adBanners.get(id);
    if (!banner) return undefined;
    
    const updatedBanner: AdBanner = { ...banner, ...bannerData };
    this.adBanners.set(id, updatedBanner);
    return updatedBanner;
  }

  async deleteAdBanner(id: number): Promise<boolean> {
    return this.adBanners.delete(id);
  }

  async trackAdImpression(id: number): Promise<void> {
    const banner = this.adBanners.get(id);
    if (banner) {
      banner.impressions = (banner.impressions || 0) + 1;
      this.adBanners.set(id, banner);
    }
  }

  async trackAdClick(id: number): Promise<void> {
    const banner = this.adBanners.get(id);
    if (banner) {
      banner.clicks = (banner.clicks || 0) + 1;
      this.adBanners.set(id, banner);
    }
  }

  async getActiveAdBanners(position?: string): Promise<AdBanner[]> {
    const now = new Date();
    return Array.from(this.adBanners.values())
      .filter(banner => {
        // Check if banner is active
        if (!banner.isActive) return false;
        
        // Check if campaign is active and not expired
        const campaign = banner.campaignId ? this.adCampaigns.get(banner.campaignId) : null;
        if (campaign) {
          if (!campaign.isActive) return false;
          if (campaign.startDate > now) return false;
          if (campaign.endDate && campaign.endDate < now) return false;
        }
        
        // Filter by position if provided
        if (position && banner.position !== position) return false;
        
        return true;
      });
  }

  // Tag operations
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(tag => tag.slug === slug);
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const id = this.tagId++;
    const newTag: Tag = {
      id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description || null,
      color: tag.color || null,
      createdAt: new Date()
    };
    this.tags.set(id, newTag);
    return newTag;
  }

  async updateTag(id: number, tagData: Partial<Tag>): Promise<Tag | undefined> {
    const tag = this.tags.get(id);
    if (!tag) return undefined;
    
    const updatedTag: Tag = { ...tag, ...tagData };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteTag(id: number): Promise<boolean> {
    return this.tags.delete(id);
  }

  async getScriptsByTag(tagId: number): Promise<Script[]> {
    const scriptIds = Array.from(this.scriptTags.values())
      .filter(st => st.tagId === tagId)
      .map(st => st.scriptId);
    
    return Array.from(this.scripts.values())
      .filter(script => scriptIds.includes(script.id));
  }

  async addTagToScript(scriptId: number, tagId: number): Promise<boolean> {
    const script = this.scripts.get(scriptId);
    const tag = this.tags.get(tagId);
    
    if (!script || !tag) return false;
    
    const key = `${scriptId}-${tagId}`;
    if (this.scriptTags.has(key)) return true; // Already exists
    
    this.scriptTags.set(key, { scriptId, tagId });
    return true;
  }

  async removeTagFromScript(scriptId: number, tagId: number): Promise<boolean> {
    const key = `${scriptId}-${tagId}`;
    return this.scriptTags.delete(key);
  }

  async getTagsForScript(scriptId: number): Promise<Tag[]> {
    const tagIds = Array.from(this.scriptTags.values())
      .filter(st => st.scriptId === scriptId)
      .map(st => st.tagId);
    
    return Array.from(this.tags.values())
      .filter(tag => tagIds.includes(tag.id));
  }

  // Favorites operations
  async getFavoritesByUser(userId: number): Promise<Script[]> {
    const scriptIds = Array.from(this.favorites.values())
      .filter(fav => fav.userId === userId)
      .map(fav => fav.scriptId);
    
    return Array.from(this.scripts.values())
      .filter(script => scriptIds.includes(script.id));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const key = `${favorite.userId}-${favorite.scriptId}`;
    const id = this.favoriteId++;
    
    const newFavorite: Favorite = {
      id,
      userId: favorite.userId,
      scriptId: favorite.scriptId,
      createdAt: new Date()
    };
    
    this.favorites.set(key, newFavorite);
    return newFavorite;
  }

  async removeFavorite(userId: number, scriptId: number): Promise<boolean> {
    const key = `${userId}-${scriptId}`;
    return this.favorites.delete(key);
  }

  async isFavorite(userId: number, scriptId: number): Promise<boolean> {
    const key = `${userId}-${scriptId}`;
    return this.favorites.has(key);
  }

  // Comments operations
  async getCommentsByScript(scriptId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.scriptId === scriptId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    
    const newComment: Comment = {
      id,
      userId: comment.userId,
      scriptId: comment.scriptId,
      content: comment.content,
      parentId: comment.parentId || null,
      isApproved: false as unknown as boolean | null,
      isDeleted: false as unknown as boolean | null,
      createdAt: new Date()
    };
    
    this.comments.set(id, newComment);
    return newComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const comment = this.comments.get(id);
    if (!comment) return false;
    
    comment.isDeleted = true;
    this.comments.set(id, comment);
    return true;
  }

  async approveComment(id: number): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    comment.isApproved = true;
    this.comments.set(id, comment);
    return comment;
  }

  // Ratings operations
  async getScriptRating(scriptId: number): Promise<number> {
    const ratings = Array.from(this.ratings.values())
      .filter(rating => rating.scriptId === scriptId);
    
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    return sum / ratings.length;
  }

  async rateScript(rating: InsertRating): Promise<Rating> {
    const key = `${rating.userId}-${rating.scriptId}`;
    const id = this.ratingId++;
    
    const newRating: Rating = {
      id,
      userId: rating.userId,
      scriptId: rating.scriptId,
      value: rating.value,
      createdAt: new Date()
    };
    
    this.ratings.set(key, newRating);
    
    // Update the script's average rating
    const script = this.scripts.get(rating.scriptId);
    if (script) {
      const avgRating = await this.getScriptRating(rating.scriptId);
      const ratingCount = Array.from(this.ratings.values())
        .filter(r => r.scriptId === rating.scriptId).length;
      
      script.avgRating = avgRating;
      script.ratingCount = ratingCount;
      this.scripts.set(rating.scriptId, script);
    }
    
    return newRating;
  }

  async getUserRating(userId: number, scriptId: number): Promise<Rating | undefined> {
    const key = `${userId}-${scriptId}`;
    return this.ratings.get(key);
  }

  // Analytics operations
  async logActivity(userId: number | null, action: string, details: any, ipAddress?: string, userAgent?: string): Promise<void> {
    const id = this.activityLogId++;
    this.activityLogs.push({
      id,
      userId,
      action,
      details,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date()
    });
  }

  async getLatestActivities(limit: number = 100): Promise<any[]> {
    return this.activityLogs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getUserActivities(userId: number, limit: number = 100): Promise<any[]> {
    return this.activityLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getActivityStats(startDate: Date, endDate: Date): Promise<any> {
    const activities = this.activityLogs.filter(
      log => log.createdAt >= startDate && log.createdAt <= endDate
    );
    
    // Group activities by action
    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count unique users
    const uniqueUsers = new Set(activities.map(a => a.userId).filter(id => id !== null)).size;
    
    return {
      totalActivities: activities.length,
      uniqueUsers,
      actionCounts
    };
  }

  // Affiliate operations
  async createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink> {
    const id = this.affiliateLinkId++;
    
    const newLink: AffiliateLink = {
      id,
      code: link.code,
      url: link.url,
      description: link.description || null,
      userId: link.userId || null,
      expiresAt: link.expiresAt || null,
      isActive: link.isActive || null,
      clicks: 0,
      createdAt: new Date()
    };
    
    this.affiliateLinks.set(id, newLink);
    return newLink;
  }

  async getAffiliateLinks(userId?: number): Promise<AffiliateLink[]> {
    const links = Array.from(this.affiliateLinks.values());
    return userId 
      ? links.filter(link => link.userId === userId)
      : links;
  }

  async getAffiliateLinkByCode(code: string): Promise<AffiliateLink | undefined> {
    return Array.from(this.affiliateLinks.values()).find(link => link.code === code);
  }

  async updateAffiliateLink(id: number, linkData: Partial<AffiliateLink>): Promise<AffiliateLink | undefined> {
    const link = this.affiliateLinks.get(id);
    if (!link) return undefined;
    
    const updatedLink: AffiliateLink = { ...link, ...linkData };
    this.affiliateLinks.set(id, updatedLink);
    return updatedLink;
  }

  async deleteAffiliateLink(id: number): Promise<boolean> {
    return this.affiliateLinks.delete(id);
  }

  async trackAffiliateClick(linkId: number, ipAddress?: string, userAgent?: string, referrer?: string): Promise<void> {
    const link = this.affiliateLinks.get(linkId);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.affiliateLinks.set(linkId, link);
    }
    
    const id = this.affiliateClickId++;
    this.affiliateClicks.push({
      id,
      linkId,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      referrer: referrer || null,
      createdAt: new Date()
    });
  }

  async getAffiliateClickStats(linkId?: number, startDate?: Date, endDate?: Date): Promise<any> {
    let clicks = this.affiliateClicks;
    
    if (linkId) {
      clicks = clicks.filter(click => click.linkId === linkId);
    }
    
    if (startDate) {
      clicks = clicks.filter(click => click.createdAt >= startDate);
    }
    
    if (endDate) {
      clicks = clicks.filter(click => click.createdAt <= endDate);
    }
    
    // Group clicks by day
    const clicksByDay = clicks.reduce((acc, click) => {
      const day = click.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count unique IPs
    const uniqueIPs = new Set(clicks.map(c => c.ipAddress).filter(ip => ip !== null)).size;
    
    return {
      totalClicks: clicks.length,
      uniqueIPs,
      clicksByDay
    };
  }
}

export const storage = new MemStorage();
