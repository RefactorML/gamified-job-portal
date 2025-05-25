import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useEffect, useState } from "react";
import { CheckCircle, Circle, Gift, Briefcase, UserPlus, FileText, Edit3 } from "lucide-react"; 
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const seedTasks = useMutation(api.tasks.seedInitialTasks);

  useEffect(() => {
    const doSeed = async () => {
      try {
        // Check if tasks have been seeded before to avoid multiple calls if not necessary
        // This is a client-side check, ideally seeding is an admin/backend process
        if (!localStorage.getItem("tasks_seeded_flag")) {
          const result = await seedTasks({});
          console.log("Attempted to seed initial tasks:", result);
          if (result === "Initial tasks seeded successfully." || result === "Tasks already seeded."){
            localStorage.setItem("tasks_seeded_flag", "true");
          }
        }
      } catch (error) {
        console.error("Failed to seed tasks:", error);
        // Avoid re-showing toast if it's just "already seeded"
        if (!(error as Error).message?.includes("already seeded")) {
            toast.error("Could not initialize platform tasks.");
        }
      }
    };
    doSeed();
  }, [seedTasks]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-gray-200 shadow-sm px-4 md:px-8">
        <h2 className="text-2xl font-bold text-primary">Gamified Job Portal</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-start justify-center p-4 md:p-8 mt-4">
        <div className="w-full max-w-3xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

function Content() {
  const authState = useQuery(api.auth.loggedInUser);
  const userProfileData = useQuery(api.users.getMyUserProfile);
  const ensureProfile = useMutation(api.users.ensureUserProfile);

  if (authState === undefined || userProfileData === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white shadow-xl rounded-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <span className="text-lg text-gray-600">Loading user data...</span>
      </div>
    );
  }

  const handleEnsureProfile = async (role: "student" | "recruiter") => {
    try {
      await ensureProfile({ role });
      toast.success(`Profile initialized as ${role}!`);
    } catch (error) {
      toast.error("Failed to initialize profile.");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 bg-white shadow-xl rounded-xl">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          Welcome to JobPortal Pro
        </h1>
        <Authenticated>
          {userProfileData && userProfileData.profile ? (
            <>
              <p className="text-lg text-gray-700">
                Hello,{" "}
                <span className="font-semibold text-primary-dark">
                  {userProfileData.email ?? "User"}
                </span>
                !
              </p>
              <div className="mt-2 text-md text-gray-600 bg-gray-50 p-3 rounded-md inline-block">
                Role:{" "}
                <span className="font-semibold capitalize text-indigo-600">
                  {userProfileData.profile.role}
                </span>
                {" | "}
                Points:{" "}
                <span className="font-semibold text-green-600">
                  {userProfileData.profile.points}
                </span>
              </div>

              {userProfileData.profile.role === "student" && (
                <StudentDashboard />
              )}
              {userProfileData.profile.role === "recruiter" && (
                <RecruiterDashboard />
              )}
              {userProfileData.profile.role === "admin" && <AdminDashboard />}
            </>
          ) : (
            <div className="mt-6">
              <p className="text-lg text-gray-700 mb-4">
                Please initialize your profile to continue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleEnsureProfile("student")}
                  className="auth-button bg-blue-500 hover:bg-blue-600 text-white"
                >
                  I'm a Student
                </button>
                <button
                  onClick={() => handleEnsureProfile("recruiter")}
                  className="auth-button bg-green-500 hover:bg-green-600 text-white"
                >
                  I'm a Recruiter
                </button>
              </div>
            </div>
          )}
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-gray-700 mb-6">
            Sign in or create an account to get started.
          </p>
          <SignInForm />
        </Unauthenticated>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const referralCode = useQuery(api.users.getMyReferralCode);
  const tasks = useQuery(api.tasks.listActiveTasks);
  const completeTaskMutation = useMutation(api.tasks.completeTask);

  const handleCompleteTask = async (taskId: Id<"tasks">) => {
    try {
      const result = await completeTaskMutation({ taskId });
      toast.success(
        `Task completed! You earned ${result.pointsAwarded} points.`,
      );
    } catch (error: any) {
      toast.error(error.data?.message || error.message || "Failed to complete task.");
      console.error(error);
    }
  };
  
  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "DAILY_SIGN_IN": return <Gift className="w-5 h-5 text-yellow-500" />;
      case "COMPLETE_PROFILE": return <Edit3 className="w-5 h-5 text-blue-500" />;
      case "REFER_PEER": return <UserPlus className="w-5 h-5 text-green-500" />;
      case "APPLY_JOB": return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "UPLOAD_RESUME": return <FileText className="w-5 h-5 text-indigo-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };


  return (
    <div className="mt-8 p-4 md:p-6 border-t border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        Student Dashboard
      </h3>
      
      {referralCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            Your referral code:{" "}
            <strong className="text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">{referralCode}</strong>
          </p>
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-700 mb-3">Available Tasks</h4>
        {tasks === undefined && <p>Loading tasks...</p>}
        {tasks && tasks.length === 0 && <p>No tasks available right now.</p>}
        <ul className="space-y-3">
          {tasks?.map((task) => (
            <li
              key={task._id}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                {getTaskIcon(task.taskType)}
                <div>
                  <span className="font-semibold text-gray-800">{task.name}</span>
                  <p className="text-sm text-gray-500">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +{task.points} pts
                </span>
                {task.isCompleted ? (
                  <span className="flex items-center text-green-500 text-sm">
                    <CheckCircle className="w-5 h-5 mr-1" /> Completed
                  </span>
                ) : task.canComplete ? (
                  <button
                    onClick={() => handleCompleteTask(task._id)}
                    className="px-3 py-1.5 text-sm bg-primary hover:bg-primary-hover text-white rounded-md shadow-sm transition-colors"
                  >
                    Complete Task
                  </button>
                ) : (
                   <span className="text-xs text-gray-400 italic">Auto-triggered</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Placeholder for Job Board, Referrals, etc. */}
    </div>
  );
}

function RecruiterDashboard() {
  return (
    <div className="mt-8 p-4 md:p-6 border-t border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        Recruiter Dashboard
      </h3>
      <p className="text-gray-600">
        Post Jobs, View Applicants will appear here.
      </p>
    </div>
  );
}

function AdminDashboard() {
  // Example: List all tasks for admin view
  const allTasks = useQuery(api.tasks.listActiveTasks); // Using this for now, could be a different query for admin

  return (
    <div className="mt-8 p-4 md:p-6 border-t border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        Admin Dashboard
      </h3>
      <p className="text-gray-600 mb-4">
        User Management, Task Configuration, Job Management, Analytics will appear here.
      </p>
      <div>
        <h4 className="text-xl font-semibold text-gray-700 mb-3">Manage Tasks</h4>
        {/* Add Task Form and Task List for Admin would go here */}
        {allTasks === undefined && <p>Loading tasks...</p>}
        <ul className="space-y-2">
        {allTasks?.map(task => (
          <li key={task._id} className="p-3 bg-gray-50 rounded border flex justify-between items-center">
            <span>{task.name} ({task.points} pts) - {task.isActive ? "Active" : "Inactive"}</span>
            {/* Add edit/disable buttons here */}
          </li>
        ))}
        </ul>
      </div>
    </div>
  );
}
