import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull(),
  imageUrl: text("image_url").notNull(),
  discordLink: text("discord_link"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  gameType: text("game_type").notNull(),
});

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
});

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;
