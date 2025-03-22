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
      // Simple implementation - in a real app, you'd have pagination
      const users = Array.from(storage['users'].values())
        .map(user => ({ 
          ...user, 
          password: '[HIDDEN]' // Never expose passwords
        }));
      return res.json(users);
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

      // In a real app, you would implement a delete user function
      // For now, we'll just return a success message
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
      
      // Get overview stats
      const users = Array.from(storage['users'].values());
      const scripts = Array.from(storage['scripts'].values());
      
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
      
      // Generate category distribution
      const categories = Array.from(storage['categories'].values());
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
      // In a real app, you would fetch campaigns from the database
      const campaigns = Array.from(storage.adCampaigns.values()).map(campaign => {
        // Add mock stats for each campaign
        return {
          ...campaign,
          stats: {
            impressions: Math.floor(Math.random() * 10000) + 500,
            clicks: Math.floor(Math.random() * 500) + 50,
            ctr: parseFloat((Math.random() * 5 + 1).toFixed(2)),
            banners: Array.from(storage.adBanners.values()).filter(b => b.campaignId === campaign.id).length
          }
        };
      });
      
      return res.json({ campaigns });
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
      
      const newCampaign = await storage.createAdCampaign({
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive: isActive !== undefined ? isActive : true,
        userId: req.user!.id
      });
      
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
      // In a real app, you would fetch banners from the database
      const banners = Array.from(storage.adBanners.values()).map(banner => {
        // Add mock stats for each banner
        return {
          ...banner,
          stats: {
            impressions: Math.floor(Math.random() * 5000) + 200,
            clicks: Math.floor(Math.random() * 300) + 20,
            ctr: parseFloat((Math.random() * 6 + 0.5).toFixed(2))
          }
        };
      });
      
      return res.json({ banners });
    } catch (error) {
      console.error('Failed to fetch ad banners:', error);
      return res.status(500).json({ message: 'Failed to fetch ad banners' });
    }
  });

  app.post('/api/admin/ad-banners', isAdmin, async (req, res) => {
    try {
      const { name, imageUrl, linkUrl, position, campaignId, altText, isActive } = req.body;
      
      if (!name || !imageUrl || !linkUrl || !campaignId) {
        return res.status(400).json({ message: 'Name, image URL, link URL, and campaign ID are required' });
      }
      
      const newBanner = await storage.createAdBanner({
        name,
        imageUrl,
        linkUrl,
        position: position || 'top',
        campaignId,
        altText,
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
      
      const { name, imageUrl, linkUrl, position, campaignId, altText, isActive } = req.body;
      
      const bannerData: any = {};
      if (name !== undefined) bannerData.name = name;
      if (imageUrl !== undefined) bannerData.imageUrl = imageUrl;
      if (linkUrl !== undefined) bannerData.linkUrl = linkUrl;
      if (position !== undefined) bannerData.position = position;
      if (campaignId !== undefined) bannerData.campaignId = campaignId;
      if (altText !== undefined) bannerData.altText = altText;
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
      
      // Mock stats for ad performance
      const campaigns = Array.from(storage.adCampaigns.values());
      
      // Generate daily stats
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
      
      // Campaign stats
      const campaignStats = campaigns.map(campaign => {
        const impressions = Math.floor(Math.random() * 10000) + 500;
        const clicks = Math.floor(Math.random() * 500) + 20;
        return {
          id: campaign.id,
          name: campaign.name,
          impressions,
          clicks,
          ctr: parseFloat(((clicks / impressions) * 100).toFixed(2))
        };
      });
      
      // Banner stats
      const banners = Array.from(storage.adBanners.values());
      const bannerStats = banners.map(banner => {
        const impressions = Math.floor(Math.random() * 5000) + 200;
        const clicks = Math.floor(Math.random() * 200) + 10;
        const campaign = campaigns.find(c => c.id === banner.campaignId);
        
        return {
          id: banner.id,
          name: banner.name,
          campaignName: campaign ? campaign.name : 'Unknown',
          imageUrl: banner.imageUrl,
          impressions,
          clicks,
          ctr: parseFloat(((clicks / impressions) * 100).toFixed(2))
        };
      });
      
      // Sort by CTR descending
      bannerStats.sort((a, b) => b.ctr - a.ctr);
      
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
      // In a real app, you would fetch affiliate links from a proper database
      // For now, we'll create a static array of affiliate links if it doesn't exist
      if (!storage.affiliateLinks) {
        storage.affiliateLinks = new Map();
        
        // Add a sample affiliate link
        storage.affiliateLinks.set(1, {
          id: 1,
          name: "Affiliate Link 1",
          description: "Description for affiliate link 1",
          code: `aff1${Math.random().toString(36).substring(2, 8)}`,
          targetUrl: "https://example.com/product1",
          commission: 10.5,
          createdAt: new Date(),
          isActive: true,
          userId: req.user!.id
        });
        
        // Initialize counters
        storage.affiliateLinkId = 1;
      }
      
      // Get all affiliate links
      const links = Array.from(storage.affiliateLinks.values()).map(link => {
        // Add mock stats for each link (these would come from database in a real app)
        return {
          ...link,
          stats: {
            clicks: Math.floor(Math.random() * 500) + 50,
            uniqueClicks: Math.floor(Math.random() * 300) + 30,
            conversionRate: parseFloat((Math.random() * 5 + 1).toFixed(2)),
            revenue: parseFloat((Math.random() * 1000 + 100).toFixed(2))
          }
        };
      });
      
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
      
      // Initialize the affiliate links Map if it doesn't exist
      if (!storage.affiliateLinks) {
        storage.affiliateLinks = new Map();
        storage.affiliateLinkId = 0;
      }
      
      // Generate a new ID
      const id = ++storage.affiliateLinkId;
      
      // Create the affiliate link
      const newLink = {
        id,
        name,
        description: description || "",
        code: code || `aff${id}${Math.random().toString(36).substring(2, 8)}`,
        targetUrl,
        commission: commission ? parseFloat(commission) : 5.0,
        createdAt: new Date(),
        isActive: isActive !== undefined ? isActive : true,
        userId: req.user!.id
      };
      
      // Save the affiliate link
      storage.affiliateLinks.set(id, newLink);
      
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
      
      // Check if the affiliate links Map exists
      if (!storage.affiliateLinks) {
        return res.status(404).json({ message: 'Affiliate link not found' });
      }
      
      // Get the existing affiliate link
      const link = storage.affiliateLinks.get(id);
      if (!link) {
        return res.status(404).json({ message: 'Affiliate link not found' });
      }
      
      const { name, description, targetUrl, code, commission, isActive } = req.body;
      
      // Update the affiliate link
      const updatedLink = {
        ...link,
        name: name !== undefined ? name : link.name,
        description: description !== undefined ? description : link.description,
        targetUrl: targetUrl !== undefined ? targetUrl : link.targetUrl,
        code: code !== undefined ? code : link.code,
        commission: commission !== undefined ? parseFloat(commission) : link.commission,
        isActive: isActive !== undefined ? isActive : link.isActive
      };
      
      // Save the updated affiliate link
      storage.affiliateLinks.set(id, updatedLink);
      
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
      
      // Check if the affiliate links Map exists
      if (!storage.affiliateLinks) {
        return res.status(404).json({ message: 'Affiliate link not found' });
      }
      
      // Check if the affiliate link exists
      if (!storage.affiliateLinks.has(id)) {
        return res.status(404).json({ message: 'Affiliate link not found' });
      }
      
      // Delete the affiliate link
      storage.affiliateLinks.delete(id);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
