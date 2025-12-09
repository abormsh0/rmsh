import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { transcribeAudio } from "./_core/voiceTranscription";
import { generateImage } from "./_core/imageGeneration";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    // Get all conversations for the current user
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    // Create a new conversation
    createConversation: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await db.createConversation({
          userId: ctx.user.id,
          title: input.title || "محادثة جديدة",
        });
        return { conversationId };
      }),

    // Get messages for a specific conversation
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getConversationMessages(input.conversationId);
      }),

    // Send a message and get AI response
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        const userMessageId = await db.createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
          imageUrl: input.imageUrl,
        });

        // Get conversation history
        const history = await db.getConversationMessages(input.conversationId);
        
        // Prepare messages for AI
        type MessageContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
        const aiMessages: Array<{
          role: "system" | "user" | "assistant";
          content: MessageContent;
        }> = [
          {
            role: "system",
            content: "أنت مساعد ذكي ومفيد. تجيب على الأسئلة باللغة العربية بشكل واضح ومفصل. يمكنك أيضاً فهم الصور والتعليق عليها.",
          },
        ];

        // Add history (limit to last 10 messages to avoid token limits)
        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
          if (msg.role === "system") continue;
          
          if (msg.imageUrl) {
            aiMessages.push({
              role: msg.role as "user" | "assistant",
              content: [
                { type: "text", text: msg.content },
                { type: "image_url", image_url: { url: msg.imageUrl } },
              ],
            });
          } else {
            aiMessages.push({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            });
          }
        }

        // Get AI response
        const aiResponse = await invokeLLM({
          messages: aiMessages,
        });

        const aiContent = aiResponse.choices[0]?.message?.content || "عذراً، لم أتمكن من الرد.";
        const contentText = typeof aiContent === 'string' ? aiContent : JSON.stringify(aiContent);

        // Save AI response
        await db.createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: contentText,
        });

        return {
          userMessageId,
          aiResponse: aiContent,
        };
      }),

    // Delete a conversation
    deleteConversation: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteConversation(input.conversationId);
        return { success: true };
      }),

    // Update conversation title
    updateConversationTitle: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        title: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateConversation(input.conversationId, input.title);
        return { success: true };
      }),
  }),

  files: router({
    // Upload a file
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        base64Data: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64Data, 'base64');
        const fileKey = `${ctx.user.id}/files/${nanoid()}-${input.filename}`;
        
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        
        const fileId = await db.createFile({
          userId: ctx.user.id,
          fileKey,
          url,
          filename: input.filename,
          mimeType: input.contentType,
          size: buffer.length,
        });

        return { fileId, url };
      }),

    // Get user's files
    getFiles: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserFiles(ctx.user.id);
    }),

    // Delete a file
    deleteFile: protectedProcedure
      .input(z.object({
        fileId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteFile(input.fileId);
        return { success: true };
      }),
  }),

  galleries: router({
    // Create a protected gallery
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        password: z.string(),
        coverImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const galleryId = await db.createGallery({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          password: input.password,
          coverImageUrl: input.coverImageUrl,
        });
        return { galleryId };
      }),

    // Get user's galleries
    getGalleries: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserGalleries(ctx.user.id);
    }),

    // Verify gallery password
    verifyPassword: protectedProcedure
      .input(z.object({
        galleryId: z.number(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const gallery = await db.getGalleryById(input.galleryId);
        if (!gallery) {
          throw new Error("Gallery not found");
        }
        return { valid: gallery.password === input.password };
      }),

    // Get gallery images
    getImages: protectedProcedure
      .input(z.object({
        galleryId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getGalleryImages(input.galleryId);
      }),

    // Add image to gallery
    addImage: protectedProcedure
      .input(z.object({
        galleryId: z.number(),
        fileId: z.number(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const imageId = await db.addImageToGallery({
          galleryId: input.galleryId,
          fileId: input.fileId,
          caption: input.caption,
        });
        return { imageId };
      }),

    // Delete gallery
    delete: protectedProcedure
      .input(z.object({
        galleryId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteGallery(input.galleryId);
        return { success: true };
      }),
  }),

  youtube: router({
    // Add YouTube channel
    addChannel: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        channelName: z.string(),
        channelUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createYoutubeChannel({
          channelId: input.channelId,
          channelName: input.channelName,
          channelUrl: input.channelUrl,
          thumbnailUrl: input.thumbnailUrl,
          description: input.description,
        });
        return { id };
      }),

    // Get active channels
    getChannels: publicProcedure.query(async () => {
      return db.getActiveYoutubeChannels();
    }),
  }),

  notifications: router({
    // Get user notifications
    getNotifications: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserNotifications(ctx.user.id);
    }),

    // Mark notification as read
    markAsRead: protectedProcedure
      .input(z.object({
        notificationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
  }),

  voice: router({
    // Transcribe audio
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language || "ar",
        });
        
        if ('error' in result) {
          throw new Error(result.error);
        }
        
        return { text: result.text };
      }),
  }),

  imageGen: router({
    // Generate image from prompt
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await generateImage({
          prompt: input.prompt,
        });
        return { url: result.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
