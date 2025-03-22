import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
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
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
});

export const insertScriptSchema = createInsertSchema(scripts)
  .omit({
    id: true,
    userId: true,
    isApproved: true,
  })
  .extend({
    // Allow ISO string format for dates
    lastUpdated: z.string().or(z.date()).optional(),
    // Make gameType optional since we now prefer gameLink
    gameType: z.string().optional(),
    // Add validation for gameLink if provided
    gameLink: z.string().url("Please enter a valid Roblox game URL").optional(),
  })
  .refine(data => data.gameType || data.gameLink, {
    message: "Either Game Type or Game Link must be provided",
    path: ["gameLink"],
  });

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;
