import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  accentColor: text("accent_color").default("#e6be8c"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const haircuts = pgTable("haircuts", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  imageUrl: text("image_url").notNull(),
  beforeImageUrl: text("before_image_url"),
  afterImageUrl: text("after_image_url"),
  category: text("category").notNull(), // 'degrade', 'social', 'barba', etc.
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const queueStatus = pgTable("queue_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull().unique(),
  status: text("status").notNull(), // 'empty', 'normal', 'full', 'paused', 'closed'
  estimatedMinutes: integer("estimated_minutes").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
