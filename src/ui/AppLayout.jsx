import { NavLink, Outlet } from "react-router-dom";
import { Library, RotateCcw, UserRound } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import ToastViewport from "./ToastViewport";

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const resetProgress = useProgressStore((state) => state.resetProgress);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-quiz-line bg-white/90 px-6 backdrop-blur-xl max-lg:static max-lg:px-4">
        <div className="mx-auto grid min-h-[72px] w-[min(1220px,100%)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 max-lg:grid-cols-1 max-lg:py-4">
        <NavLink to="/" className="flex items-center gap-3 font-black no-underline">
          <span className="grid size-11 place-items-center rounded-card bg-quiz-blue text-white shadow-[0_12px_28px_rgba(66,85,255,0.3)]">IV</span>
          <span>
            <span className="block leading-tight">IELTS Vocab</span>
            <small className="block text-xs font-bold text-quiz-muted">Study sets</small>
          </span>
        </NavLink>

        <nav className="flex gap-2 overflow-x-auto">
          <NavLink className={navClass} to="/"><Library size={18} /> Thư viện</NavLink>
          <NavLink className={navClass} to="/thong-ke"><UserRound size={18} /> Thống kê</NavLink>
        </nav>

        <div className="flex items-center gap-3 font-extrabold text-quiz-muted">
          <button className="ghost-btn" type="button" onClick={resetProgress}><RotateCcw size={17} /> Reset</button>
          <span className="grid size-10 place-items-center rounded-full bg-[#eef1ff] text-quiz-blue">{user?.display_name?.[0] || "U"}</span>
          <span>{user?.display_name || "Guest"}</span>
        </div>
        </div>
      </header>

      <main className="page page-motion">
        <Outlet />
      </main>
      <ToastViewport />
    </>
  );
}

function navClass({ isActive }) {
  return `inline-flex min-h-10 items-center gap-2 rounded-card px-3 font-black no-underline ${
    isActive ? "bg-[#eef1ff] text-quiz-blue" : "text-quiz-muted hover:bg-[#eef1ff] hover:text-quiz-blue"
  }`;
}
