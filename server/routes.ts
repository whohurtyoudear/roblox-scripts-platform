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

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: any, next: any) => {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
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
      console.log('Script upload - request body:', JSON.stringify(req.body));
      const parseResult = insertScriptSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        console.log('Script validation errors:', JSON.stringify(parseResult.error.errors));
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

  // Update script - accessible by script owner or admin
  app.put('/api/scripts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      // Get the existing script
      const script = await storage.getScriptById(id);
      if (!script) {
        return res.status(404).json({ message: 'Script not found' });
      }
      
      // Check if user is the script owner or an admin
      const isOwner = script.userId === req.user!.id;
      const isUserAdmin = req.user!.isAdmin;
      
      if (!isOwner && !isUserAdmin) {
        return res.status(403).json({ message: 'You do not have permission to update this script' });
      }
      
      // Validate update data - accept any fields that are in the insertScriptSchema
      const parseResult = insertScriptSchema.safeParse({
        ...script, // Include existing values
        ...req.body // Override with new values
      });
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid script data', 
          errors: parseResult.error.errors 
        });
      }
      
      // Update the script
      const scriptData = parseResult.data;
      const updatedScript = await storage.updateScript(id, {
        ...scriptData,
        lastUpdated: new Date() // Always update the lastUpdated timestamp
      });
      
      return res.json(updatedScript);
    } catch (error) {
      console.error('Failed to update script:', error);
      return res.status(500).json({ message: 'Failed to update script' });
    }
  });

  // Delete script - accessible only by admin
  app.delete('/api/scripts/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      const result = await storage.deleteScript(id);
      if (!result) {
        return res.status(404).json({ message: 'Script not found or already deleted' });
      }
      
      return res.status(200).json({ message: 'Script deleted successfully' });
    } catch (error) {
      console.error('Failed to delete script:', error);
      return res.status(500).json({ message: 'Failed to delete script' });
    }
  });

  // Get user admin status
  app.get('/api/user/admin-status', isAuthenticated, (req, res) => {
    return res.json({ isAdmin: !!req.user?.isAdmin });
  });

  const httpServer = createServer(app);
  return httpServer;
}
