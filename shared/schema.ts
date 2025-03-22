import { pgTable, text, serial, integer, timestamp, boolean, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url").default("/images/default-avatar.png"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  bio: text("bio").default(""),
  discordUsername: text("discord_username"),
  role: text("role").default("user").notNull(), // Role can be "user", "moderator", "admin"
  lastLoginAt: timestamp("last_login_at"),
  reputation: integer("reputation").default(0),
  isBanned: boolean("is_banned").default(false),
  banReason: text("ban_reason"),
  banExpiresAt: timestamp("ban_expires_at"),
  ipAddress: text("ip_address"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
  reputation: true,
  isBanned: true,
  banReason: true,
  banExpiresAt: true,
  ipAddress: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Tags schema
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

// Scripts schema with user relation
export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull(),
  imageUrl: text("image_url").notNull(),
  discordLink: text("discord_link"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  gameType: text("game_type"), // Keep this for backward compatibility
  gameLink: text("game_link"),
  userId: integer("user_id").references(() => users.id),
  isApproved: boolean("is_approved").default(true),
  categoryId: integer("category_id").references(() => categories.id),
  featuredRank: integer("featured_rank"), // Null if not featured, lower number = higher ranking
  views: integer("views").default(0),
  copies: integer("copies").default(0),
  avgRating: integer("avg_rating").default(0),
  ratingCount: integer("rating_count").default(0),
});

// Script tags relation (many-to-many)
export const scriptTags = pgTable("script_tags", {
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
}, (t) => ({
  pk: primaryKey(t.scriptId, t.tagId),
}));

// Script favorites (bookmarks)
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueUserScript: primaryKey(t.userId, t.scriptId),
}));

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Comments on scripts
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isApproved: boolean("is_approved").default(true),
  parentId: integer("parent_id"), // For nested comments
  isDeleted: boolean("is_deleted").default(false)
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  isApproved: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Ratings for scripts
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  value: integer("value").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueUserScript: primaryKey(t.userId, t.scriptId),
}));

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

// User activity logs for analytics
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // e.g., 'login', 'view_script', 'copy_script'
  details: json("details"), // Additional data about the action
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Affiliate links
export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Admin who created it
  code: text("code").notNull().unique(),
  description: text("description"),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  clicks: integer("clicks").default(0),
});

export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;

// Affiliate tracking
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").notNull().references(() => affiliateLinks.id),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  convertedToSignup: boolean("converted_to_signup").default(false),
  userId: integer("user_id").references(() => users.id), // If they signed up
});

// Ad campaign data
export const adCampaigns = pgTable("ad_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertAdCampaignSchema = createInsertSchema(adCampaigns).omit({
  id: true,
  createdAt: true,
});

export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;

// Ad banners for campaigns
export const adBanners = pgTable("ad_banners", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => adCampaigns.id),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url").notNull(),
  position: text("position").default("top"), // top, sidebar, etc.
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdBannerSchema = createInsertSchema(adBanners).omit({
  id: true,
  impressions: true,
  clicks: true,
  createdAt: true,
});

export type InsertAdBanner = z.infer<typeof insertAdBannerSchema>;
export type AdBanner = typeof adBanners.$inferSelect;

export const insertScriptSchema = createInsertSchema(scripts)
  .omit({
    id: true,
    userId: true,
    isApproved: true,
    views: true,
    copies: true,
    avgRating: true,
    ratingCount: true,
    featuredRank: true,
  })
  .extend({
    // Allow ISO string format for dates
    lastUpdated: z.string().or(z.date()).optional(),
    // Make gameType optional since we now prefer gameLink
    gameType: z.string().optional(),
    // Add validation for gameLink if provided
    gameLink: z.string().url("Please enter a valid Roblox game URL").optional(),
    // Make categoryId optional in the schema but validate in the application
    categoryId: z.number().optional(),
  })
  .refine(data => data.gameType || data.gameLink, {
    message: "Either Game Type or Game Link must be provided",
    path: ["gameLink"],
  });

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect & {
  // Added for backward compatibility with components that expect createdAt
  createdAt?: Date;
};
