import { scripts, type Script, type InsertScript } from "@shared/schema";

export interface IStorage {
  getAllScripts(): Promise<Script[]>;
  getScriptById(id: number): Promise<Script | undefined>;
  searchScripts(query: string): Promise<Script[]>;
  createScript(script: InsertScript): Promise<Script>;
}

export class MemStorage implements IStorage {
  private scripts: Map<number, Script>;
  currentId: number;

  constructor() {
    this.scripts = new Map();
    this.currentId = 1;
    
    // Add some initial scripts
    this.addInitialScripts();
  }

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
      script.gameType.toLowerCase().includes(searchTerm)
    );
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const id = this.currentId++;
    const script: Script = { ...insertScript, id };
    this.scripts.set(id, script);
    return script;
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
        lastUpdated: new Date()
      },
      {
        title: "Blox Fruits Hub",
        description: "Complete hub for Blox Fruits with auto-farm, teleports, ESP, and more features. Regular updates to match game changes.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/blox-fruits-hub/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1602673221577-0b56d7ce446b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Blox Fruits",
        lastUpdated: new Date()
      },
      {
        title: "Pet Simulator X Auto Farm",
        description: "Powerful auto farm script for Pet Simulator X with auto-collect, auto-hatch, and coin farming capabilities.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/pet-sim-x/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Pet Simulator X",
        lastUpdated: new Date()
      },
      {
        title: "Arsenal Aimbot & ESP",
        description: "Complete Arsenal script with aimbot, wallhack, ESP, and silent aim features. Fully customizable through an easy-to-use interface.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/arsenal-script/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Arsenal",
        lastUpdated: new Date()
      },
      {
        title: "Doors Entity ESP",
        description: "Advanced script for Doors with entity ESP, auto-skip puzzles, and item locator. Get early warnings for all entities.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/doors-script/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Doors",
        lastUpdated: new Date()
      },
      {
        title: "Brookhaven RP Admin",
        description: "Ultimate admin script for Brookhaven RP with teleportation, vehicle spawning, and custom animations. Take control of the game.",
        code: "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/example/brookhaven-admin/main.lua\"))()",
        imageUrl: "https://images.unsplash.com/photo-1640955014216-75201056c829?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80",
        discordLink: "https://discord.gg/devscripts",
        gameType: "Brookhaven",
        lastUpdated: new Date()
      }
    ];

    initialScripts.forEach(script => {
      this.createScript(script);
    });
  }
}

export const storage = new MemStorage();
