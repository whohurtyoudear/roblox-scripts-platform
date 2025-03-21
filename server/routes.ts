import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertScriptSchema } from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Authentication required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

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

  app.get('/api/search/scripts', async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const scripts = await storage.searchScripts(query);
      return res.json(scripts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to search scripts' });
    }
  });

  // User scripts
  app.get('/api/user/scripts', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scripts = await storage.getUserScripts(userId);
      return res.json(scripts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch user scripts' });
    }
  });

  // Script upload
  app.post('/api/scripts', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate script data
      const parseResult = insertScriptSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid script data', 
          errors: parseResult.error.errors 
        });
      }
      
      const scriptData = parseResult.data;
      const script = await storage.createScript(scriptData, userId);
      
      return res.status(201).json(script);
    } catch (error) {
      console.error('Failed to create script:', error);
      return res.status(500).json({ message: 'Failed to create script' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
