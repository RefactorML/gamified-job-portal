"use strict";
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Seed initial tasks if they don't exist
// Changed to mutation for easier client-side trigger during development.
// In production, this should be an admin action or a one-time script.
export const seedInitialTasks = mutation({
  handler: async (ctx) => {
    const existingTasks = await ctx.db.query("tasks").collect();
    if (existingTasks.length > 0) {
      console.log("Tasks already seeded.");
      return "Tasks already seeded.";
    }

    const initialTasksData: Omit<Doc<"tasks">, "_id" | "_creationTime">[] = [
      {
        name: "Daily Sign-In",
        description: "Check in once per day",
        points: 10,
        taskType: "DAILY_SIGN_IN",
        isActive: true,
      },
      {
        name: "Complete Your Profile",
        description: "Fill out all profile fields (education, skills)",
        points: 50,
        taskType: "COMPLETE_PROFILE",
        isActive: true,
      },
      {
        name: "Refer a Peer",
        description: "Unique referral link generates points on signup",
        points: 200,
        taskType: "REFER_PEER",
        isActive: true,
      },
      {
        name: "Apply for a Job",
        description: "Click “Apply” on a job listing via portal",
        points: 5,
        taskType: "APPLY_JOB",
        isActive: true,
      },
      {
        name: "Upload Resume",
        description: "Add or update resume PDF/profile document",
        points: 20,
        taskType: "UPLOAD_RESUME",
        isActive: true,
      },
    ];

    for (const taskData of initialTasksData) {
      await ctx.db.insert("tasks", taskData);
    }
    console.log("Initial tasks seeded.");
    return "Initial tasks seeded successfully.";
  },
});


// Query to list all active tasks for students
export const listActiveTasks = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return []; // Or throw error if auth is strictly required
    }

    const activeTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // For each task, check if the user has completed it today (for daily tasks)
    // or ever (for one-time tasks like 'COMPLETE_PROFILE')
    const tasksWithCompletionStatus = await Promise.all(
      activeTasks.map(async (task) => {
        let isCompleted = false;
        let canComplete = true;

        const completedTaskEntry = await ctx.db
          .query("userCompletedTasks")
          .withIndex("by_user_task", (q) =>
            q.eq("userId", userId).eq("taskId", task._id),
          )
          .order("desc") // Get the latest completion first
          .first();

        if (completedTaskEntry) {
          if (task.taskType === "DAILY_SIGN_IN") {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today
            if (completedTaskEntry.completedAt >= today.getTime()) {
              isCompleted = true; // Completed today
              canComplete = false;
            }
          } else if (
            task.taskType === "COMPLETE_PROFILE" ||
            task.taskType === "UPLOAD_RESUME" // Assuming these are one-time or can be re-done for points after a while (not implemented yet)
          ) {
            isCompleted = true; // Considered completed if any entry exists
            // For now, let's assume complete profile is one time.
            // UPLOAD_RESUME could be repeatable, but we'll mark as completed if done once.
            if (task.taskType === "COMPLETE_PROFILE") {
              canComplete = false;
            }
          }
          // APPLY_JOB and REFER_PEER are handled differently (triggered by other actions)
        }
        
        // Tasks like APPLY_JOB and REFER_PEER are not directly completable from a list
        if (task.taskType === "APPLY_JOB" || task.taskType === "REFER_PEER") {
            canComplete = false;
        }


        return {
          ...task,
          isCompleted, // True if completed based on task type logic
          canComplete, // True if the user can click a button to complete it now
        };
      }),
    );
    return tasksWithCompletionStatus;
  },
});

// Mutation to complete a task (e.g., Daily Sign-In, Complete Profile button click)
export const completeTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated.");
    }

    const taskToComplete = await ctx.db.get(args.taskId);
    if (!taskToComplete || !taskToComplete.isActive) {
      throw new Error("Task not found or is not active.");
    }

    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile) {
      throw new Error("User profile not found.");
    }

    // Check if task can be completed (e.g., daily sign-in only once per day)
    const now = Date.now();
    if (taskToComplete.taskType === "DAILY_SIGN_IN") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const latestCompletion = await ctx.db
        .query("userCompletedTasks")
        .withIndex("by_user_task", (q) =>
          q.eq("userId", userId).eq("taskId", args.taskId),
        )
        .order("desc")
        .first();
      if (latestCompletion && latestCompletion.completedAt >= today.getTime()) {
        throw new Error("Daily sign-in already completed today.");
      }
    } else if (taskToComplete.taskType === "COMPLETE_PROFILE") {
      // Check if profile is actually complete - this is a simplification.
      // A more robust check would verify profile fields.
      // For now, we assume clicking the button means they assert it's complete.
      const existingCompletion = await ctx.db
        .query("userCompletedTasks")
        .withIndex("by_user_task", (q) =>
          q.eq("userId", userId).eq("taskId", args.taskId),
        )
        .first();
      if (existingCompletion) {
        throw new Error("Profile completion task already recorded.");
      }
    } else if (taskToComplete.taskType === "UPLOAD_RESUME") {
        // Similar to complete profile, for now we assume clicking means they did it.
        // A real implementation would link this to an actual file upload action.
        // We can allow this to be "completed" multiple times, maybe with a cooldown.
        // For now, just record it.
    }
     else {
      // For other task types like APPLY_JOB or REFER_PEER, completion is typically
      // triggered by another specific action (applying to a job, successful referral).
      // This generic 'completeTask' might not be suitable for them.
      throw new Error(`Task type ${taskToComplete.taskType} cannot be completed this way.`);
    }


    // Record task completion
    await ctx.db.insert("userCompletedTasks", {
      userId,
      taskId: args.taskId,
      completedAt: now,
    });

    // Award points
    await ctx.db.patch(userProfile._id, {
      points: userProfile.points + taskToComplete.points,
    });

    return { success: true, pointsAwarded: taskToComplete.points };
  },
});

// Internal mutation to award points for specific event-driven tasks
export const internalAwardPointsForTask = internalMutation({
  args: {
    userId: v.id("users"),
    taskType: v.union(
      v.literal("REFER_PEER"),
      v.literal("APPLY_JOB"),
      // Potentially others like UPLOAD_RESUME if triggered by file upload success
    ),
    // Optional: relatedId if needed, e.g., jobId for APPLY_JOB
    // relatedId: v.optional(v.id("jobs")), 
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("taskType"), args.taskType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!task) {
      console.warn(`No active task found for type: ${args.taskType}`);
      return { success: false, message: "Task not found or inactive." };
    }

    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!userProfile) {
      console.warn(`User profile not found for userId: ${args.userId}`);
      return { success: false, message: "User profile not found." };
    }
    
    // For APPLY_JOB, we might want to limit points per job or per day.
    // For now, we'll allow it every time it's triggered.
    if (args.taskType === "APPLY_JOB") {
        // Check if already applied for this specific job? (Needs jobId in args)
        // Or limit applications per day? (More complex tracking)
        // For now, simple award.
    }


    await ctx.db.insert("userCompletedTasks", {
      userId: args.userId,
      taskId: task._id,
      completedAt: Date.now(),
      // ...(args.relatedId ? { relatedId: args.relatedId } : {}), // If we pass relatedId
    });

    await ctx.db.patch(userProfile._id, {
      points: userProfile.points + task.points,
    });

    return { success: true, pointsAwarded: task.points, taskName: task.name };
  },
});


// Admin: Create a new task
export const createTask = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    points: v.number(),
    taskType: v.union(
      v.literal("DAILY_SIGN_IN"),
      v.literal("REFER_PEER"),
      v.literal("APPLY_JOB"),
      v.literal("UPLOAD_RESUME"),
      v.literal("COMPLETE_PROFILE"),
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Admin check
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (adminProfile?.role !== "admin") throw new Error("Not an admin.");

    return await ctx.db.insert("tasks", args);
  },
});

// Admin: Update a task
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    points: v.optional(v.number()),
    taskType: v.optional(v.union(
      v.literal("DAILY_SIGN_IN"),
      v.literal("REFER_PEER"),
      v.literal("APPLY_JOB"),
      v.literal("UPLOAD_RESUME"),
      v.literal("COMPLETE_PROFILE"),
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Admin check
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const adminProfile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (adminProfile?.role !== "admin") throw new Error("Not an admin.");

    const { taskId, ...updates } = args;
    return await ctx.db.patch(taskId, updates);
  },
});
