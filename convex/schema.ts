import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  profiles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("student"),
      v.literal("recruiter"),
      v.literal("admin"),
    ),
    points: v.number(),
    referralCode: v.optional(v.string()),
    // Optional: badges, milestones
  })
    .index("by_userId", ["userId"])
    .index("by_referralCode", ["referralCode"]),

  tasks: defineTable({
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
    // Optional: frequency (once, daily, weekly)
  }),

  userCompletedTasks: defineTable({
    userId: v.id("users"),
    taskId: v.id("tasks"),
    completedAt: v.number(), // timestamp
    // Optional: specific data related to completion, e.g., job ID for APPLY_JOB
  }).index("by_user_task", ["userId", "taskId"]),

  jobs: defineTable({
    recruiterId: v.id("users"), // User ID from profiles table with 'recruiter' role
    title: v.string(),
    company: v.string(),
    location: v.string(),
    description: v.string(), // Rich text or markdown
    requirements: v.string(), // Rich text or markdown
    status: v.union(
      v.literal("active"),
      v.literal("inactive"), // e.g., filled or expired
      v.literal("pending_approval"),
      v.literal("rejected"),
    ),
    isPremium: v.boolean(),
    // Optional: salary range, job type (full-time, part-time, contract)
  })
    .index("by_recruiter", ["recruiterId"])
    .index("by_status", ["status"]),

  applications: defineTable({
    studentId: v.id("users"), // User ID from profiles table with 'student' role
    jobId: v.id("jobs"),
    appliedAt: v.number(), // timestamp
    status: v.string(), // e.g., "applied", "viewed", "shortlisted", "rejected", "hired"
    // Optional: resume/cover letter snapshot or link (if not using a central resume)
  })
    .index("by_student_job", ["studentId", "jobId"])
    .index("by_job", ["jobId"]),

  referrals: defineTable({
    referrerId: v.id("users"), // Student who made the referral
    referralCodeUsed: v.string(),
    referredUserId: v.optional(v.id("users")), // New user who signed up using the code
    status: v.union(v.literal("pending_signup"), v.literal("completed_signup")), // completed_signup when referredUserId is set
    // Optional: pointsAwardedAt
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referralCodeUsed", ["referralCodeUsed"]),
  
  // More tables can be added later e.g. for resumes, notifications
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
