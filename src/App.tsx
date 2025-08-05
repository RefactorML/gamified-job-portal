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
import {
  CheckCircle,
  Circle,
  Gift,
  Briefcase,
  UserPlus,
  FileText,
  Edit3,
} from "lucide-react";
import { Id } from "../convex/_generated/dataModel";

/* ------------------------------------------------------------------ */
/* constants                                                           */
/* ------------------------------------------------------------------ */
const APPLY_JOB_XP = 5; // bonus per click
const LOCAL_KEY = "static_job_bonus_points";

/* ------------------------------------------------------------------ */
/* root component                                                      */
/* ------------------------------------------------------------------ */
export default function App() {
  const seedTasks = useMutation(api.tasks.seedInitialTasks);

  useEffect(() => {
    const doSeed = async () => {
      try {
        if (!localStorage.getItem("tasks_seeded_flag")) {
          const result = await seedTasks({});
          if (
            result === "Initial tasks seeded successfully." ||
            result === "Tasks already seeded."
          ) {
            localStorage.setItem("tasks_seeded_flag", "true");
          }
        }
      } catch (error) {
        console.error("Failed to seed tasks:", error);
        toast.error("Could not initialize platform tasks.");
      }
    };
    doSeed();
  }, [seedTasks]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 flex items-start justify-center p-4 md:p-8 mt-4">
        <div className="w-full max-w-3xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* header component shows sign-out & title                             */
/* ------------------------------------------------------------------ */
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-gray-200 shadow-sm px-4 md:px-8">
      <h2 className="text-2xl font-bold text-primary">Gamified Job Portal</h2>
      <SignOutButton />
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* page body                                                           */
/* ------------------------------------------------------------------ */
function Content() {
  const authState = useQuery(api.auth.loggedInUser);
  const userProfileData = useQuery(api.users.getMyUserProfile);
  const ensureProfile = useMutation(api.users.ensureUserProfile);

  /* local bonus points that come from static job applications ------- */
  const [bonus, setBonus] = useState<number>(
    Number(localStorage.getItem(LOCAL_KEY) || 0),
  );

  /* helper to bump the bonus from the dashboard --------------------- */
  const addBonus = (pts: number) => {
    const newTotal = bonus + pts;
    setBonus(newTotal);
    localStorage.setItem(LOCAL_KEY, String(newTotal));
  };

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

        {/* ─────────────────────────────────────────────────────────── */}
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
                </span>{" "}
                | Points:{" "}
                <span className="font-semibold text-green-600">
                  {userProfileData.profile.points + bonus}
                </span>
              </div>

              {userProfileData.profile.role === "student" && (
                <StudentDashboard addBonus={addBonus} />
              )}
              {userProfileData.profile.role === "recruiter" && (
                <RecruiterDashboard />
              )}
              {userProfileData.profile.role === "admin" && (
                <AdminDashboard />
              )}
            </>
          ) : (
            <ProfileInit handleEnsureProfile={handleEnsureProfile} />
          )}
        </Authenticated>

        {/* ─────────────────────────────────────────────────────────── */}
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

/* small component for first-time profile setup ---------------------- */
function ProfileInit({
  handleEnsureProfile,
}: {
  handleEnsureProfile: (role: "student" | "recruiter") => void;
}) {
  return (
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
  );
}

/* ------------------------------------------------------------------ */
/* Student dashboard with static job cards                            */
/* ------------------------------------------------------------------ */
function StudentDashboard({ addBonus }: { addBonus: (n: number) => void }) {
  const referralCode = useQuery(api.users.getMyReferralCode);
  const tasks = useQuery(api.tasks.listActiveTasks);
  const completeTaskMutation = useMutation(api.tasks.completeTask);

  /* static job list ------------------------------------------------ */
  const staticJobs = [
    {
      id: "static-ds",
      title: "Data Scientist",
      company: "Acme Analytics",
      location: "Remote (US)",
    },
    {
      id: "static-se",
      title: "Software Engineer",
      company: "Beta Tech",
      location: "San Francisco, CA",
    },
  ];

  /* handlers ------------------------------------------------------- */
  const handleApply = (jobId: string) => {
    addBonus(APPLY_JOB_XP);
    toast.success(`Applied! +${APPLY_JOB_XP} XP`);
    console.log(`Applied for job ${jobId}`);
  };

  const handleCompleteTask = async (taskId: Id<"tasks">) => {
    try {
      const result = await completeTaskMutation({ taskId });
      toast.success(`Task completed! You earned ${result.pointsAwarded} points.`);
    } catch (error: any) {
      toast.error(
        error.data?.message || error.message || "Failed to complete task.",
      );
    }
  };

  /* helper icons --------------------------------------------------- */
  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "DAILY_SIGN_IN":
        return <Gift className="w-5 h-5 text-yellow-500" />;
      case "COMPLETE_PROFILE":
        return <Edit3 className="w-5 h-5 text-blue-500" />;
      case "REFER_PEER":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "APPLY_JOB":
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "UPLOAD_RESUME":
        return <FileText className="w-5 h-5 text-indigo-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  /* ---------------------------------------------------------------- */
  return (
    <div className="mt-8 p-4 md:p-6 border-t border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        Student Dashboard
      </h3>

      {/* referral code ------------------------------------------------ */}
      {referralCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            Your referral code:{" "}
            <strong className="text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
              {referralCode}
            </strong>
          </p>
        </div>
      )}

      {/* tasks ------------------------------------------------------- */}
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-700 mb-3">
          Available Tasks
        </h4>
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
                  <span className="font-semibold text-gray-800">
                    {task.name}
                  </span>
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
                  <span className="text-xs text-gray-400 italic">
                    Auto-triggered
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* featured jobs ---------------------------------------------- */}
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-700 mb-3">
          Featured Jobs
        </h4>
        {staticJobs.map((job) => (
          <div
            key={job.id}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:shadow-md transition-shadow"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {job.title} •{" "}
                <span className="text-sm text-gray-500">{job.company}</span>
              </p>
              <p className="text-sm text-gray-500">{job.location}</p>
            </div>
            <button
              onClick={() => handleApply(job.id)}
              className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-md shadow-sm transition-colors"
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* trivial placeholders for other roles                               */
/* ------------------------------------------------------------------ */
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
  const allTasks = useQuery(api.tasks.listActiveTasks);

  return (
    <div className="mt-8 p-4 md:p-6 border-t border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        Admin Dashboard
      </h3>
      <p className="text-gray-600 mb-4">
        User Management, Task Configuration, Job Management, Analytics will
        appear here.
      </p>
      <div>
        <h4 className="text-xl font-semibold text-gray-700 mb-3">
          Manage Tasks
        </h4>
        {allTasks === undefined && <p>Loading tasks...</p>}
        <ul className="space-y-2">
          {allTasks?.map((task) => (
            <li
              key={task._id}
              className="p-3 bg-gray-50 rounded border flex justify-between items-center"
            >
              <span>
                {task.name} ({task.points} pts) -{" "}
                {task.isActive ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
