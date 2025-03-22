import { scripts, type Script, type InsertScript, type User, type InsertUser, users } from "@shared/schema";
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
  
  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<Omit<User, "id" | "password">>): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  verifyUser(username: string, password: string): Promise<User | null>;
  
  // Session store
  sessionStore: any; // Using 'any' to avoid type issues with session store
}

export class MemStorage implements IStorage {
  private scripts: Map<number, Script>;
  private users: Map<number, User>;
  scriptId: number;
  userId: number;
  sessionStore: any; // Using 'any' to avoid type issues with session store

  constructor() {
    this.scripts = new Map();
    this.users = new Map();
    this.scriptId = 1;
    this.userId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add some initial scripts
    this.addInitialScripts();
    // Add a demo user
    this.addInitialUsers();
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
      isApproved: true
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
      role: userData.role || "user"
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
}

export const storage = new MemStorage();
