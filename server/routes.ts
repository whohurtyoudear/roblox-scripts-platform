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
  if (req.isAuthenticated() && req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

// Middleware to check if user is a moderator or admin (can delete scripts)
const isModeratorOrAdmin = (req: Request, res: any, next: any) => {
  if (req.isAuthenticated() && (req.user?.role === 'admin' || req.user?.role === 'moderator')) {
    return next();
  }
  return res.status(403).json({ message: 'Moderator or admin access required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a redirect for index.html to the root path
  app.get('/index.html', (req, res) => {
    res.redirect('/');
  });

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
  
  // API route for categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      return res.json(categories);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  // API route for tags
  app.get('/api/tags', async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      return res.json(tags);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch tags' });
    }
  });

  // API route for featured scripts
  app.get('/api/scripts/featured', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const featuredScripts = await storage.getFeaturedScripts(limit);
      return res.json(featuredScripts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch featured scripts' });
    }
  });
  
  // API route for trending scripts
  app.get('/api/scripts/trending', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const limit = parseInt(req.query.limit as string) || 5;
      const trendingScripts = await storage.getTrendingScripts(days, limit);
      return res.json(trendingScripts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch trending scripts' });
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
      
      // Increment view count
      await storage.incrementScriptViews(id);
      
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
  
  // User favorites
  app.get('/api/user/favorites', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const favoriteScripts = await storage.getFavoritesByUser(userId);
      return res.json(favoriteScripts);
    } catch (error) {
      console.error('Failed to fetch user favorites:', error);
      return res.status(500).json({ message: 'Failed to fetch user favorites' });
    }
  });
  
  // Check if a script is in the user's favorites
  app.get('/api/scripts/:id/favorite/check', isAuthenticated, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      
      if (isNaN(scriptId)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      const isFavorite = await storage.isFavorite(userId, scriptId);
      return res.json({ isFavorite });
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return res.status(500).json({ message: 'Failed to check favorite status' });
    }
  });
  
  app.post('/api/scripts/:id/favorite', isAuthenticated, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      
      if (isNaN(scriptId)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      // Check if script exists
      const script = await storage.getScriptById(scriptId);
      if (!script) {
        return res.status(404).json({ message: 'Script not found' });
      }
      
      // Check if already favorited
      const isFavorite = await storage.isFavorite(userId, scriptId);
      if (isFavorite) {
        return res.status(400).json({ message: 'Script is already in favorites' });
      }
      
      // Add to favorites
      const favorite = await storage.addFavorite({
        userId,
        scriptId
      });
      
      return res.status(201).json({ message: 'Added to favorites', favorite });
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return res.status(500).json({ message: 'Failed to add to favorites' });
    }
  });
  
  app.delete('/api/scripts/:id/favorite', isAuthenticated, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      
      if (isNaN(scriptId)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      // Check if favorited
      const isFavorite = await storage.isFavorite(userId, scriptId);
      if (!isFavorite) {
        return res.status(400).json({ message: 'Script is not in favorites' });
      }
      
      // Remove from favorites
      await storage.removeFavorite(userId, scriptId);
      
      return res.json({ message: 'Removed from favorites' });
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      return res.status(500).json({ message: 'Failed to remove from favorites' });
    }
  });
  
  // Script copy count tracking
  app.post('/api/scripts/:id/copy', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      // Increment copy count
      await storage.incrementScriptCopies(id);
      
      return res.json({ message: 'Copy count incremented' });
    } catch (error) {
      console.error('Failed to increment copy count:', error);
      return res.status(500).json({ message: 'Failed to increment copy count' });
    }
  });
  
  // Script rating endpoints
  app.post('/api/scripts/:id/rate', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scriptId = parseInt(req.params.id, 10);
      const value = parseInt(req.body.value);
      
      if (isNaN(scriptId)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      if (isNaN(value) || value < 1 || value > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
      }
      
      const script = await storage.getScriptById(scriptId);
      if (!script) {
        return res.status(404).json({ message: 'Script not found' });
      }
      
      const rating = await storage.rateScript({
        userId,
        scriptId,
        value
      });
      
      // Fetch the updated script with the new rating
      const updatedScript = await storage.getScriptById(scriptId);
      
      return res.status(200).json({ 
        rating,
        scriptRating: {
          avgRating: updatedScript?.avgRating || 0,
          ratingCount: updatedScript?.ratingCount || 0
        }
      });
    } catch (error) {
      console.error('Error rating script:', error);
      return res.status(500).json({ message: 'Failed to rate script' });
    }
  });
  
  app.get('/api/scripts/:id/rating', async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id, 10);
      
      if (isNaN(scriptId)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      const script = await storage.getScriptById(scriptId);
      if (!script) {
        return res.status(404).json({ message: 'Script not found' });
      }
      
      return res.status(200).json({
        avgRating: script.avgRating || 0,
        ratingCount: script.ratingCount || 0
      });
    } catch (error) {
      console.error('Error getting script rating:', error);
      return res.status(500).json({ message: 'Failed to get script rating' });
    }
  });
  
  app.get('/api/scripts/:id/rating/user', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scriptId = parseInt(req.params.id, 10);
      
      if (isNaN(scriptId)) {
        return res.status(400).json({ message: 'Invalid script ID' });
      }
      
      const rating = await storage.getUserRating(userId, scriptId);
      return res.status(200).json({ rating });
    } catch (error) {
      console.error('Error getting user rating:', error);
      return res.status(500).json({ message: 'Failed to get user rating' });
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
      const isUserAdmin = req.user!.role === 'admin';
      
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

  // Delete script - accessible by moderators and admins
  app.delete('/api/scripts/:id', isModeratorOrAdmin, async (req, res) => {
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

  // Get user role
  app.get('/api/user/role', isAuthenticated, (req, res) => {
    return res.json({ 
      role: req.user?.role || 'user',
      isAdmin: req.user?.role === 'admin',
      isModerator: req.user?.role === 'moderator' || req.user?.role === 'admin'
    });
  });

  // Admin endpoint to get all users (admin only)
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      // Get all users using the storage interface
      const users = await storage.getAllUsers();
      // Map to hide passwords
      const sanitizedUsers = users.map(user => ({ 
        ...user, 
        password: '[HIDDEN]' // Never expose passwords
      }));
      return res.json({ users: sanitizedUsers });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  // Admin endpoint to create a new user (admin only)
  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password,
        email: email || '',
        role: role || 'user',
        bio: '',
        avatarUrl: '',
      });
      
      return res.status(201).json({
        message: 'User created successfully',
        user: { ...newUser, password: '[HIDDEN]' }
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      return res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Admin endpoint to update user role (admin only)
  app.put('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const { role } = req.body;
      if (!role || !['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be user, moderator, or admin' });
      }

      // Prevent changing own role (for safety)
      if (id === req.user!.id) {
        return res.status(403).json({ message: 'Cannot change your own role' });
      }

      const updatedUser = await storage.updateUser(id, { role });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ 
        message: `User role updated to ${role}`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Failed to update user role:', error);
      return res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Admin endpoint to create a new moderator (admin only)
  app.post('/api/admin/moderator', isAdmin, async (req, res) => {
    try {
      const { username, password, email } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Create moderator account
      const newModerator = await storage.createUser({
        username,
        password,
        email,
        role: 'moderator',
        bio: 'Moderator account',
        avatarUrl: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      });
      
      return res.status(201).json({
        message: 'Moderator account created successfully',
        user: { ...newModerator, password: '[HIDDEN]' } 
      });
    } catch (error) {
      console.error('Failed to create moderator:', error);
      return res.status(500).json({ message: 'Failed to create moderator' });
    }
  });

  // Admin User Management Routes
  app.post('/api/admin/users/:id/ban', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const { reason, duration } = req.body;
      if (!reason) {
        return res.status(400).json({ message: 'Ban reason is required' });
      }

      // Prevent banning yourself
      if (id === req.user!.id) {
        return res.status(403).json({ message: 'Cannot ban yourself' });
      }

      // Calculate expiry date if duration is provided
      let expiryDate: Date | undefined = undefined;
      if (duration && duration !== 'permanent') {
        const days = parseInt(duration, 10);
        if (!isNaN(days)) {
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
        }
      }

      const bannedUser = await storage.banUser(id, reason, expiryDate);
      if (!bannedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        message: `User banned successfully${expiryDate ? ' until ' + expiryDate.toISOString() : ' permanently'}`,
        user: { ...bannedUser, password: '[HIDDEN]' }
      });
    } catch (error) {
      console.error('Failed to ban user:', error);
      return res.status(500).json({ message: 'Failed to ban user' });
    }
  });

  app.post('/api/admin/users/:id/unban', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const unbannedUser = await storage.unbanUser(id);
      if (!unbannedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        message: 'User unbanned successfully',
        user: { ...unbannedUser, password: '[HIDDEN]' }
      });
    } catch (error) {
      console.error('Failed to unban user:', error);
      return res.status(500).json({ message: 'Failed to unban user' });
    }
  });

  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const { role } = req.body;
      if (!role || !['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be user, moderator, or admin' });
      }

      // Prevent changing own role (for safety)
      if (id === req.user!.id) {
        return res.status(403).json({ message: 'Cannot change your own role' });
      }

      const updatedUser = await storage.updateUser(id, { role });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        message: `User role updated to ${role}`,
        user: { ...updatedUser, password: '[HIDDEN]' }
      });
    } catch (error) {
      console.error('Failed to update user role:', error);
      return res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const { username, email, bio, avatarUrl } = req.body;
      
      // Create update data object
      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (bio !== undefined) updateData.bio = bio;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      
      // Update user
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.json({
        message: 'User updated successfully',
        user: { ...updatedUser, password: '[HIDDEN]' }
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      return res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Prevent deleting yourself
      if (id === req.user!.id) {
        return res.status(403).json({ message: 'Cannot delete your own account' });
      }

      // Delete the user from storage
      const result = await storage.deleteUser(id);
      
      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Admin Analytics Routes
  app.get('/api/admin/analytics', isAdmin, async (req, res) => {
    try {
      const dateRange = req.query.dateRange || 'week';
      
      // Get overview stats using storage interface
      const users = await storage.getAllUsers();
      const scripts = await storage.getAllScripts();
      
      // Calculate new users (mock data - in a real app, this would use real date filtering)
      const randomNewUsers = Math.floor(Math.random() * 20) + 5;
      const randomTrend = Math.floor(Math.random() * 15) - 5; // Between -5 and 10
      
      // Calculate active scripts
      const randomActiveScripts = Math.floor(Math.random() * scripts.length) + 1;
      const randomScriptTrend = Math.floor(Math.random() * 15) - 3; // Between -3 and 12
      
      // Calculate views and copies
      const totalViews = scripts.reduce((sum, script) => sum + (script.views || 0), 0);
      const totalCopies = scripts.reduce((sum, script) => sum + (script.copies || 0), 0);
      
      // Generate daily visit data
      const dailyVisits = [];
      const daysToGenerate = dateRange === 'week' ? 7 : 
                             dateRange === 'month' ? 30 : 
                             dateRange === 'quarter' ? 90 : 365;
      
      const now = new Date();
      for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        dailyVisits.push({
          date: dateStr,
          views: Math.floor(Math.random() * 100) + 20,
          copies: Math.floor(Math.random() * 30) + 5
        });
      }
      
      // Sort by date ascending
      dailyVisits.sort((a, b) => a.date.localeCompare(b.date));
      
      // Generate user activity by hour
      const userActivity = [];
      for (let hour = 0; hour < 24; hour++) {
        userActivity.push({
          hour: hour.toString().padStart(2, '0') + ':00',
          users: Math.floor(Math.random() * 25) + 5
        });
      }
      
      // Generate popular scripts
      const scriptPopularity = scripts.slice(0, 5).map(script => ({
        name: script.title.slice(0, 20) + (script.title.length > 20 ? '...' : ''),
        views: script.views || Math.floor(Math.random() * 200) + 50,
        copies: script.copies || Math.floor(Math.random() * 100) + 20
      }));
      
      // Generate category distribution using storage interface
      const categories = await storage.getAllCategories();
      const categoryDistribution = categories.map(category => ({
        name: category.name,
        value: Math.floor(Math.random() * 30) + 10
      }));
      
      // If no categories exist, add some mock ones
      if (categoryDistribution.length === 0) {
        categoryDistribution.push(
          { name: 'Combat', value: 35 },
          { name: 'Movement', value: 25 },
          { name: 'UI', value: 20 },
          { name: 'Economy', value: 15 },
          { name: 'Misc', value: 5 }
        );
      }
      
      return res.json({
        overview: {
          totalUsers: users.length,
          totalScripts: scripts.length,
          totalViews,
          totalCopies,
          newUsers: {
            count: randomNewUsers,
            trend: randomTrend
          },
          activeScripts: {
            count: randomActiveScripts,
            trend: randomScriptTrend
          }
        },
        dailyVisits,
        userActivity,
        scriptPopularity,
        categoryDistribution
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Ad Campaign Management Routes
  app.get('/api/admin/ad-campaigns', isAdmin, async (req, res) => {
    try {
      // We need to implement getAdCampaigns in DatabaseStorage
      // For now, we'll return an empty array with error handling
      return res.json({ campaigns: [] });
    } catch (error) {
      console.error('Failed to fetch ad campaigns:', error);
      return res.status(500).json({ message: 'Failed to fetch ad campaigns' });
    }
  });

  app.post('/api/admin/ad-campaigns', isAdmin, async (req, res) => {
    try {
      const { name, description, startDate, endDate, isActive } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Campaign name is required' });
      }
      
      // Create a new campaign with properly typed dates
      const campaignData: any = {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        userId: req.user!.id
      };
      
      // Only add dates if they are provided
      if (startDate) campaignData.startDate = new Date(startDate);
      if (endDate) campaignData.endDate = new Date(endDate);
      
      const newCampaign = await storage.createAdCampaign(campaignData);
      
      return res.json(newCampaign);
    } catch (error) {
      console.error('Failed to create ad campaign:', error);
      return res.status(500).json({ message: 'Failed to create ad campaign' });
    }
  });

  app.patch('/api/admin/ad-campaigns/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid campaign ID' });
      }
      
      const { name, description, startDate, endDate, isActive } = req.body;
      
      const campaignData: any = {};
      if (name !== undefined) campaignData.name = name;
      if (description !== undefined) campaignData.description = description;
      if (startDate !== undefined) campaignData.startDate = new Date(startDate);
      if (endDate !== undefined) campaignData.endDate = new Date(endDate);
      if (isActive !== undefined) campaignData.isActive = isActive;
      
      const updatedCampaign = await storage.updateAdCampaign(id, campaignData);
      if (!updatedCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      return res.json(updatedCampaign);
    } catch (error) {
      console.error('Failed to update ad campaign:', error);
      return res.status(500).json({ message: 'Failed to update ad campaign' });
    }
  });

  app.delete('/api/admin/ad-campaigns/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid campaign ID' });
      }
      
      const result = await storage.deleteAdCampaign(id);
      if (!result) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      return res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      console.error('Failed to delete ad campaign:', error);
      return res.status(500).json({ message: 'Failed to delete ad campaign' });
    }
  });

  // Ad Banner Management Routes
  app.get('/api/admin/ad-banners', isAdmin, async (req, res) => {
    try {
      // We need to implement getAdBanners in DatabaseStorage
      // For now, we'll return an empty array with error handling
      return res.json({ banners: [] });
    } catch (error) {
      console.error('Failed to fetch ad banners:', error);
      return res.status(500).json({ message: 'Failed to fetch ad banners' });
    }
  });

  app.post('/api/admin/ad-banners', isAdmin, async (req, res) => {
    try {
      const { name, imageUrl, linkUrl, position, campaignId, isActive } = req.body;
      
      if (!name || !imageUrl || !linkUrl || !campaignId) {
        return res.status(400).json({ message: 'Name, image URL, link URL, and campaign ID are required' });
      }
      
      const newBanner = await storage.createAdBanner({
        name,
        imageUrl,
        linkUrl,
        position: position || 'top',
        campaignId,
        isActive: isActive !== undefined ? isActive : true,
      });
      
      return res.json(newBanner);
    } catch (error) {
      console.error('Failed to create ad banner:', error);
      return res.status(500).json({ message: 'Failed to create ad banner' });
    }
  });

  app.patch('/api/admin/ad-banners/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid banner ID' });
      }
      
      const { name, imageUrl, linkUrl, position, campaignId, isActive } = req.body;
      
      const bannerData: any = {};
      if (name !== undefined) bannerData.name = name;
      if (imageUrl !== undefined) bannerData.imageUrl = imageUrl;
      if (linkUrl !== undefined) bannerData.linkUrl = linkUrl;
      if (position !== undefined) bannerData.position = position;
      if (campaignId !== undefined) bannerData.campaignId = campaignId;
      if (isActive !== undefined) bannerData.isActive = isActive;
      
      const updatedBanner = await storage.updateAdBanner(id, bannerData);
      if (!updatedBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
      
      return res.json(updatedBanner);
    } catch (error) {
      console.error('Failed to update ad banner:', error);
      return res.status(500).json({ message: 'Failed to update ad banner' });
    }
  });

  app.delete('/api/admin/ad-banners/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid banner ID' });
      }
      
      const result = await storage.deleteAdBanner(id);
      if (!result) {
        return res.status(404).json({ message: 'Banner not found' });
      }
      
      return res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
      console.error('Failed to delete ad banner:', error);
      return res.status(500).json({ message: 'Failed to delete ad banner' });
    }
  });

  // Ad Stats Route
  app.get('/api/admin/ad-stats', isAdmin, async (req, res) => {
    try {
      const dateRange = req.query.dateRange || '7days';
      const campaignId = req.query.selectedCampaignForStats || 'all';
      
      // Generate daily stats with mock data for now
      const dailyStats = [];
      const daysToGenerate = dateRange === '7days' ? 7 : 
                             dateRange === '30days' ? 30 : 
                             dateRange === '90days' ? 90 : 365;
      
      const now = new Date();
      for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        dailyStats.push({
          date: dateStr,
          impressions: Math.floor(Math.random() * 1000) + 100,
          clicks: Math.floor(Math.random() * 100) + 10
        });
      }
      
      // Sort by date ascending
      dailyStats.sort((a, b) => a.date.localeCompare(b.date));
      
      // Placeholder data for campaigns (since we don't have database implementation yet)
      const campaignStats = [
        {
          id: 1,
          name: "Main Campaign",
          impressions: Math.floor(Math.random() * 10000) + 500,
          clicks: Math.floor(Math.random() * 500) + 20,
          ctr: parseFloat(((Math.random() * 5 + 1)).toFixed(2))
        }
      ];
      
      // Placeholder data for banners
      const bannerStats = [
        {
          id: 1,
          name: "Top Banner",
          campaignName: "Main Campaign",
          imageUrl: "https://via.placeholder.com/720x90/1e293b/ffffff?text=DevScripts+Premium",
          impressions: Math.floor(Math.random() * 5000) + 200,
          clicks: Math.floor(Math.random() * 200) + 10,
          ctr: parseFloat(((Math.random() * 6 + 0.5)).toFixed(2))
        }
      ];
      
      // Overview statistics
      const totalImpressions = dailyStats.reduce((sum, day) => sum + day.impressions, 0);
      const totalClicks = dailyStats.reduce((sum, day) => sum + day.clicks, 0);
      const averageCtr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
      
      return res.json({
        stats: {
          overview: {
            totalImpressions,
            totalClicks,
            averageCtr
          },
          dailyStats,
          campaignStats,
          bannerStats
        }
      });
    } catch (error) {
      console.error('Failed to fetch ad stats:', error);
      return res.status(500).json({ message: 'Failed to fetch ad stats' });
    }
  });

  // Affiliate Management Routes
  app.get('/api/admin/affiliate-links', isAdmin, async (req, res) => {
    try {
      // We need to implement proper database methods for affiliate links
      // For now, return placeholder data
      const links = [
        {
          id: 1,
          name: "Affiliate Link 1",
          description: "Description for affiliate link 1",
          code: `aff1${Math.random().toString(36).substring(2, 8)}`,
          targetUrl: "https://example.com/product1",
          commission: 10.5,
          createdAt: new Date(),
          isActive: true,
          userId: req.user!.id,
          stats: {
            clicks: Math.floor(Math.random() * 500) + 50,
            uniqueClicks: Math.floor(Math.random() * 300) + 30,
            conversionRate: parseFloat((Math.random() * 5 + 1).toFixed(2)),
            revenue: parseFloat((Math.random() * 1000 + 100).toFixed(2))
          }
        }
      ];
      
      return res.json({ links });
    } catch (error) {
      console.error('Failed to fetch affiliate links:', error);
      return res.status(500).json({ message: 'Failed to fetch affiliate links' });
    }
  });
  
  app.post('/api/admin/affiliate-links', isAdmin, async (req, res) => {
    try {
      const { name, description, targetUrl, code, commission, isActive } = req.body;
      
      if (!name || !targetUrl) {
        return res.status(400).json({ message: 'Name and target URL are required' });
      }
      
      // This is a placeholder implementation until we implement createAffiliateLink
      // in the DatabaseStorage class
      const newLink = {
        id: 2, // Placeholder ID
        name,
        description: description || "",
        code: code || `aff${Math.random().toString(36).substring(2, 8)}`,
        targetUrl,
        commission: commission ? parseFloat(commission) : 5.0,
        createdAt: new Date(),
        isActive: isActive !== undefined ? isActive : true,
        userId: req.user!.id
      };
      
      return res.json(newLink);
    } catch (error) {
      console.error('Failed to create affiliate link:', error);
      return res.status(500).json({ message: 'Failed to create affiliate link' });
    }
  });
  
  app.patch('/api/admin/affiliate-links/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid affiliate link ID' });
      }
      
      const { name, description, targetUrl, code, commission, isActive } = req.body;
      
      // This is a placeholder implementation until we implement updateAffiliateLink
      // in the DatabaseStorage class
      const updatedLink = {
        id,
        name: name || "Updated Affiliate Link",
        description: description || "Updated description",
        code: code || `aff${Math.random().toString(36).substring(2, 8)}`,
        targetUrl: targetUrl || "https://example.com/product-updated",
        commission: commission ? parseFloat(commission) : 7.5,
        createdAt: new Date(),
        isActive: isActive !== undefined ? isActive : true,
        userId: req.user!.id
      };
      
      return res.json(updatedLink);
    } catch (error) {
      console.error('Failed to update affiliate link:', error);
      return res.status(500).json({ message: 'Failed to update affiliate link' });
    }
  });
  
  app.delete('/api/admin/affiliate-links/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid affiliate link ID' });
      }
      
      // This is a placeholder implementation until we implement deleteAffiliateLink
      // in the DatabaseStorage class
      
      return res.json({ message: 'Affiliate link deleted successfully' });
    } catch (error) {
      console.error('Failed to delete affiliate link:', error);
      return res.status(500).json({ message: 'Failed to delete affiliate link' });
    }
  });

  app.get('/api/admin/affiliate-stats', isAdmin, async (req, res) => {
    try {
      const dateRange = req.query.dateRange || '7days';
      
      // Generate mock affiliate stats
      
      // Overview stats
      const totalClicks = Math.floor(Math.random() * 5000) + 1000;
      const uniqueClicks = Math.floor(totalClicks * (0.6 + Math.random() * 0.3));
      const averageCommission = parseFloat((Math.random() * 10 + 5).toFixed(2));
      const estimatedRevenue = parseFloat((uniqueClicks * averageCommission * 0.1).toFixed(2));
      
      // Generate daily stats
      const clicksByDate = [];
      const daysToGenerate = dateRange === '7days' ? 7 : 
                             dateRange === '30days' ? 30 : 
                             dateRange === '90days' ? 90 : 365;
      
      const now = new Date();
      for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dailyClicks = Math.floor(Math.random() * 200) + 20;
        const dailyUniqueClicks = Math.floor(dailyClicks * (0.6 + Math.random() * 0.3));
        
        clicksByDate.push({
          date: dateStr,
          clicks: dailyClicks,
          uniqueClicks: dailyUniqueClicks
        });
      }
      
      // Sort by date ascending
      clicksByDate.sort((a, b) => a.date.localeCompare(b.date));
      
      // Generate referrer stats
      const referrerStats = [
        { name: 'Direct', value: Math.floor(Math.random() * 50) + 20 },
        { name: 'Social Media', value: Math.floor(Math.random() * 40) + 15 },
        { name: 'Search', value: Math.floor(Math.random() * 30) + 10 },
        { name: 'Email', value: Math.floor(Math.random() * 20) + 5 },
        { name: 'Other', value: Math.floor(Math.random() * 10) + 5 }
      ];
      
      // Generate link performance
      const linkPerformance = [];
      
      // Generate 5 mock affiliate link stats
      for (let i = 1; i <= 5; i++) {
        const clicks = Math.floor(Math.random() * 500) + 50;
        const uniqueClicksPerLink = Math.floor(clicks * (0.6 + Math.random() * 0.3));
        const commission = parseFloat((Math.random() * 10 + 5).toFixed(2));
        const revenue = parseFloat((uniqueClicksPerLink * commission * 0.1).toFixed(2));
        const conversionRate = parseFloat((Math.random() * 5 + 1).toFixed(2));
        
        linkPerformance.push({
          id: i,
          name: `Affiliate Link ${i}`,
          code: `aff${i}${Math.random().toString(36).substring(2, 6)}`,
          clicks,
          uniqueClicks: uniqueClicksPerLink,
          commission,
          conversionRate,
          revenue
        });
      }
      
      // Sort by clicks descending
      linkPerformance.sort((a, b) => b.clicks - a.clicks);
      
      return res.json({
        stats: {
          overview: {
            totalClicks,
            uniqueClicks,
            averageCommission,
            estimatedRevenue
          },
          clicksByDate,
          referrerStats,
          linkPerformance
        }
      });
    } catch (error) {
      console.error('Failed to fetch affiliate stats:', error);
      return res.status(500).json({ message: 'Failed to fetch affiliate stats' });
    }
  });

  // Achievement-related endpoints
  app.get('/api/user/achievements', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const achievements = await storage.getUserAchievements(userId);
      return res.json(achievements);
    } catch (error) {
      console.error('Failed to fetch user achievements:', error);
      return res.status(500).json({ message: 'Failed to fetch user achievements' });
    }
  });

  app.get('/api/user/achievements/unseen', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const unseenAchievements = await storage.getUnseenAchievements(userId);
      return res.json(unseenAchievements);
    } catch (error) {
      console.error('Failed to fetch unseen achievements:', error);
      return res.status(500).json({ message: 'Failed to fetch unseen achievements' });
    }
  });

  app.post('/api/user/achievements/:id/seen', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const achievementId = parseInt(req.params.id, 10);
      
      if (isNaN(achievementId)) {
        return res.status(400).json({ message: 'Invalid achievement ID' });
      }
      
      await storage.markAchievementAsSeen(userId, achievementId);
      return res.json({ message: 'Achievement marked as seen' });
    } catch (error) {
      console.error('Failed to mark achievement as seen:', error);
      return res.status(500).json({ message: 'Failed to mark achievement as seen' });
    }
  });

  app.post('/api/user/achievements/check', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const newAchievements = await storage.checkAndAwardAchievements(userId);
      return res.json(newAchievements);
    } catch (error) {
      console.error('Failed to check for new achievements:', error);
      return res.status(500).json({ message: 'Failed to check for new achievements' });
    }
  });
  
  // Admin-only achievement management endpoints
  app.get('/api/admin/achievements', isAdmin, async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      return res.json(achievements);
    } catch (error) {
      console.error('Failed to fetch all achievements:', error);
      return res.status(500).json({ message: 'Failed to fetch all achievements' });
    }
  });
  
  app.post('/api/admin/achievements', isAdmin, async (req, res) => {
    try {
      const { name, description, imageUrl, criteria, points, isEnabled } = req.body;
      
      if (!name || !description || !imageUrl || !criteria) {
        return res.status(400).json({ message: 'Name, description, image URL, and criteria are required' });
      }
      
      const newAchievement = await storage.createAchievement({
        name,
        description,
        imageUrl,
        criteria,
        points: points || 10,
        isEnabled: isEnabled !== undefined ? isEnabled : true
      });
      
      return res.status(201).json(newAchievement);
    } catch (error) {
      console.error('Failed to create achievement:', error);
      return res.status(500).json({ message: 'Failed to create achievement' });
    }
  });
  
  app.patch('/api/admin/achievements/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid achievement ID' });
      }
      
      const { name, description, imageUrl, criteria, points, isEnabled } = req.body;
      // Using a simple object instead of Partial<Achievement>
      const achievementData: any = {};
      
      if (name !== undefined) achievementData.name = name;
      if (description !== undefined) achievementData.description = description;
      if (imageUrl !== undefined) achievementData.imageUrl = imageUrl;
      if (criteria !== undefined) achievementData.criteria = criteria;
      if (points !== undefined) achievementData.points = points;
      if (isEnabled !== undefined) achievementData.isEnabled = isEnabled;
      
      const updatedAchievement = await storage.updateAchievement(id, achievementData);
      
      if (!updatedAchievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      
      return res.json(updatedAchievement);
    } catch (error) {
      console.error('Failed to update achievement:', error);
      return res.status(500).json({ message: 'Failed to update achievement' });
    }
  });
  
  app.delete('/api/admin/achievements/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid achievement ID' });
      }
      
      const result = await storage.deleteAchievement(id);
      
      if (!result) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      
      return res.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
      console.error('Failed to delete achievement:', error);
      return res.status(500).json({ message: 'Failed to delete achievement' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
