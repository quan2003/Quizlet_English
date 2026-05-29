import { Activity, BarChart3, BookOpen, CalendarDays, Clock3, Flame, Trophy } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useStudyStore } from "../stores/studyStore";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const sets = useSetsStore((state) => state.sets);
  const cards = useSetsStore((state) => state.cards);
  const progress = useProgressStore((state) => state.progress);
  const quizSessions = useStudyStore((state) => state.quizSessions);
  const mastered = progress.filter((item) => item.mastery_level === 2).length;
  const learning = progress.filter((item) => item.mastery_level === 1).length;
  const ownedSets = sets.filter((set) => set.owner_id === user.id).length;
  const totalReviews = progress.reduce((sum, item) => sum + item.correct_streak, 0);
  const masteryPercent = cards.length ? Math.round((mastered / cards.length) * 100) : 0;
  const recentSessions = quizSessions.slice().reverse().slice(0, 6);

  return (
    <>
      <section className="grid grid-cols-[minmax(0,1fr)_520px] gap-5 max-lg:grid-cols-1">
        <div className="glass-panel relative overflow-hidden">
          <div className="absolute right-[-60px] top-[-60px] size-44 rounded-full bg-[#eef1ff]" />
          <div className="relative flex items-start gap-4">
            <span className="grid size-20 place-items-center rounded-card bg-quiz-blue text-3xl font-black text-white shadow-[0_18px_42px_rgba(66,85,255,0.28)]">
              {user.display_name?.[0] || "G"}
            </span>
            <div>
              <p className="eyebrow">Thống kê học tập</p>
              <h1 className="mb-2 text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-none">{user.display_name}</h1>
              <p className="text-lg text-quiz-muted">{user.email}</p>
            </div>
          </div>
          <div className="relative mt-8">
            <div className="mb-2 flex justify-between text-sm font-black text-quiz-muted">
              <span>Mức độ thành thạo</span>
              <span>{masteryPercent}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-[#eef1ff]">
              <span className="block h-full rounded-full bg-quiz-blue transition-all duration-700" style={{ width: `${masteryPercent}%` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
          <Stat icon={<Trophy size={20} />} value={mastered} label="đã thuộc" />
          <Stat icon={<Activity size={20} />} value={learning} label="đang học" />
          <Stat icon={<Flame size={20} />} value="7" label="ngày streak" />
          <Stat icon={<BookOpen size={20} />} value={ownedSets} label="bộ thẻ" />
        </div>
      </section>

      <section className="mt-5 grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-lg:grid-cols-1">
        <div className="glass-panel">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Hoạt động gần đây</p>
              <h2 className="text-3xl font-black">Lịch sử học</h2>
            </div>
            <span className="icon-tile"><CalendarDays size={21} /></span>
          </div>
          <div className="grid gap-3">
            {recentSessions.length ? recentSessions.map((session) => (
              <article key={session.id} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-card border border-quiz-line bg-white p-3 max-md:grid-cols-1">
                <span className="icon-tile"><Clock3 size={18} /></span>
                <div>
                  <strong className="capitalize">{modeLabel(session.mode)}</strong>
                  <p className="muted text-sm">{session.completed_at}</p>
                </div>
                <strong>{session.score}/{session.total} · {session.duration_seconds}s</strong>
              </article>
            )) : (
              <div className="grid min-h-[220px] place-items-center rounded-card border border-dashed border-quiz-line bg-[#f8f9ff] p-6 text-center">
                <div>
                  <span className="mx-auto mb-4 grid size-14 place-items-center rounded-card bg-[#eef1ff] text-quiz-blue"><BarChart3 size={28} /></span>
                  <h3 className="text-2xl font-black">Chưa có lịch sử học</h3>
                  <p className="muted mt-2">Hãy thử Learn, Test hoặc Match để thống kê bắt đầu có dữ liệu.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="glass-panel">
          <p className="eyebrow">Tổng quan</p>
          <h2 className="text-2xl font-black">Tiến độ hiện tại</h2>
          <div className="mt-5 grid gap-3">
            <Metric label="Tổng cards" value={cards.length} />
            <Metric label="Cards đã luyện" value={progress.length} />
            <Metric label="Correct streak cộng dồn" value={totalReviews} />
            <Metric label="Sessions" value={quizSessions.length} />
          </div>
        </aside>
      </section>
    </>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="glass-panel min-h-[128px]">
      <span className="icon-tile mb-4">{icon}</span>
      <strong className="block text-4xl font-black">{value}</strong>
      <span className="muted">{label}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-quiz-line bg-white p-4">
      <span className="muted font-bold">{label}</span>
      <strong className="text-2xl">{value}</strong>
    </div>
  );
}

function modeLabel(mode) {
  const labels = {
    learn: "Learn",
    test: "Test",
    match: "Match"
  };
  return labels[mode] || mode;
}
