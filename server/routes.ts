import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for scripts
  app.get('/api/scripts', async (req, res) => {
    try {
      const scripts = await storage.getAllScripts();
      return res.json(scripts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch scripts' });
    }
  });

  app.get('/api/scripts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      const script = await storage.getScriptById(id);
      if (!script) {
        return res.status(404).json({ message: 'Script not found' });
      }
      
      return res.json(script);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch script' });
    }
  });

  app.get('/api/scripts/search', async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const scripts = await storage.searchScripts(query);
      return res.json(scripts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to search scripts' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
