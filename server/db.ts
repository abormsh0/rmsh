import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  conversations, 
  messages, 
  files, 
  galleries, 
  galleryImages, 
  youtubeChannels, 
  notifications,
  InsertConversation,
  InsertMessage,
  InsertFile,
  InsertGallery,
  InsertGalleryImage,
  InsertYoutubeChannel,
  InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Conversations
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values(data);
  return result[0].insertId;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateConversation(id: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(conversations).set({ title, updatedAt: new Date() }).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// Messages
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data);
  
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, data.conversationId));
  
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// Files
export async function createFile(data: InsertFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(files).values(data);
  return result[0].insertId;
}

export async function getUserFiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(files).where(eq(files.userId, userId)).orderBy(desc(files.createdAt));
}

export async function deleteFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(files).where(eq(files.id, id));
}

// Galleries
export async function createGallery(data: InsertGallery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(galleries).values(data);
  return result[0].insertId;
}

export async function getUserGalleries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(galleries).where(eq(galleries.userId, userId)).orderBy(desc(galleries.createdAt));
}

export async function getGalleryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(galleries).where(eq(galleries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteGallery(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(galleryImages).where(eq(galleryImages.galleryId, id));
  await db.delete(galleries).where(eq(galleries.id, id));
}

// Gallery Images
export async function addImageToGallery(data: InsertGalleryImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(galleryImages).values(data);
  return result[0].insertId;
}

export async function getGalleryImages(galleryId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(galleryImages).where(eq(galleryImages.galleryId, galleryId)).orderBy(galleryImages.order);
}

// YouTube Channels
export async function createYoutubeChannel(data: InsertYoutubeChannel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(youtubeChannels).values(data);
  return result[0].insertId;
}

export async function getActiveYoutubeChannels() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(youtubeChannels).where(eq(youtubeChannels.isActive, true)).orderBy(desc(youtubeChannels.createdAt));
}

// Notifications
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}
