import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("chat router", () => {
  it("should create a conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.createConversation({
      title: "Test Conversation",
    });

    expect(result).toHaveProperty("conversationId");
    expect(typeof result.conversationId).toBe("number");
  });

  it("should get user conversations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversations = await caller.chat.getConversations();

    expect(Array.isArray(conversations)).toBe(true);
  });
});

describe("files router", () => {
  it("should get user files", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const files = await caller.files.getFiles();

    expect(Array.isArray(files)).toBe(true);
  });
});

describe("galleries router", () => {
  it("should get user galleries", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const galleries = await caller.galleries.getGalleries();

    expect(Array.isArray(galleries)).toBe(true);
  });
});

describe("youtube router", () => {
  it("should get active channels", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const channels = await caller.youtube.getChannels();

    expect(Array.isArray(channels)).toBe(true);
  });
});

describe("notifications router", () => {
  it("should get user notifications", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const notifications = await caller.notifications.getNotifications();

    expect(Array.isArray(notifications)).toBe(true);
  });
});
