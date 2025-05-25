import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

// Query to get the current user's auth data and their profile
export const getMyUserProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      // This should not happen if userId is valid
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return {
      ...user, // Auth user data (email, name if set during signup)
      profile, // Profile data (role, points, etc.)
    };
  },
});

// Mutation to ensure a user profile exists, creates one with a default role if not.
export const ensureUserProfile = mutation({
  args: {
    role: v.optional(
      v.union(
        v.literal("student"),
        v.literal("recruiter"),
        v.literal("admin"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      // Optionally update role if provided and allowed, or just return existing
      // For now, we don't update role here. Role changes will be admin-controlled.
      return existingProfile;
    }

    // Create a new profile
    const defaultRole = args.role || "student";
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();


    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: defaultRole,
      points: 0, // Initial points
      referralCode: referralCode,
    });

    return await ctx.db.get(profileId);
  },
});

// Example of how an admin might change a user's role (simplified)
export const adminUpdateUserRole = mutation({
  args: {
    targetUserId: v.id("users"),
    newRole: v.union(
      v.literal("student"),
      v.literal("recruiter"),
      v.literal("admin"),
    ),
  },
  handler: async (ctx, args) => {
    // Step 1: Check if the current user is an admin
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    const currentUserProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", currentUserId))
      .unique();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      throw new Error("Not authorized to change roles (requires admin privileges)");
    }

    // Step 2: Find the target user's profile
    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    if (!targetProfile) {
      throw new Error("Target user profile not found.");
    }

    // Step 3: Update the role
    await ctx.db.patch(targetProfile._id, { role: args.newRole });
    return { success: true, message: `User role updated to ${args.newRole}` };
  },
});

// Function for students to get their referral code
export const getMyReferralCode = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return profile?.referralCode ?? null;
  },
});
