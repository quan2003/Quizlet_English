import { Link } from "react-router-dom";
import { useState } from "react";
import { BookOpen, Play, Trash2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useStudyStore } from "../stores/studyStore";
import { useToastStore } from "../stores/toastStore";
import ConfirmDialog from "./ConfirmDialog";

export default function SetCard({ set }) {
  const user = useAuthStore((state) => state.user);
  const cards = useSetsStore((state) => state.getCardsBySetId(set.id));
  const deleteSet = useSetsStore((state) => state.deleteSet);
  const stats = useProgressStore((state) => state.statsForCards(user.id, cards));
  const deleteProgressForCards = useProgressStore((state) => state.deleteProgressForCards);
  const deleteSessionsForSet = useStudyStore((state) => state.deleteSessionsForSet);
  const pushToast = useToastStore((state) => state.pushToast);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function removeSet(event) {
    event.preventDefault();
    event.stopPropagation();
    setConfirmOpen(true);
  }

  function confirmDelete() {
    deleteProgressForCards(cards.map((card) => card.id));
    deleteSessionsForSet(set.id);
    deleteSet(set.id);
    setConfirmOpen(false);
    pushToast({
      title: "Đã xóa bộ thẻ",
      description: `"${set.title}" đã được xóa khỏi thư viện.`,
      type: "success"
    });
  }

  return (
    <>
      <Link to={`/study/${set.share_slug}`} className="glass-panel group relative grid min-h-[230px] gap-5 overflow-hidden text-quiz-ink no-underline transition duration-300 hover:-translate-y-1 hover:border-quiz-blue hover:shadow-[0_24px_70px_rgba(36,43,79,0.16)]">
        <div className="absolute right-[-42px] top-[-42px] size-32 rounded-full bg-[#eef1ff] transition duration-500 group-hover:scale-125" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="icon-tile transition duration-300 group-hover:scale-105"><BookOpen size={21} /></span>
            <span className="badge">{set.is_public ? "Public" : "Private"}</span>
          </div>
          <button className="danger-btn relative z-10 min-h-9 px-3" type="button" onClick={removeSet} aria-label="Xóa bộ thẻ">
            <Trash2 size={16} />
          </button>
        </div>
        <div>
          <h2 className="mb-2 line-clamp-2 text-2xl font-black leading-tight">{set.title}</h2>
          <p className="muted line-clamp-2">{set.description}</p>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm font-black text-quiz-muted">
            <span>{cards.length} cards</span>
            <span>{stats.percent}% mastered</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#eef1ff]">
            <span className="block h-full rounded-full bg-quiz-blue transition-all duration-700" style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-quiz-line pt-3">
          <span>{stats.mastered}/{stats.total} mastered</span>
          <span className="inline-flex items-center gap-2 font-black text-quiz-blue"><Play size={16} /> Study</span>
        </div>
      </Link>
      <ConfirmDialog
        open={confirmOpen}
        title={`Xóa bộ thẻ "${set.title}"?`}
        description="Hành động này sẽ xóa toàn bộ cards, tiến độ học và lịch sử phiên liên quan đến bộ thẻ này."
        confirmLabel="Xóa bộ thẻ"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
