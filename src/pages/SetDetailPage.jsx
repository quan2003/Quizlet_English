import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useStudyStore } from "../stores/studyStore";
import { useToastStore } from "../stores/toastStore";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function SetDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const user = useAuthStore((state) => state.user);
  const set = useSetsStore((state) => state.getSetBySlug(slug));
  const cards = useSetsStore((state) => set ? state.getCardsBySetId(set.id) : []);
  const deleteSet = useSetsStore((state) => state.deleteSet);
  const getProgress = useProgressStore((state) => state.getProgress);
  const deleteProgressForCards = useProgressStore((state) => state.deleteProgressForCards);
  const stats = useProgressStore((state) => set ? state.statsForCards(user.id, cards) : null);
  const deleteSessionsForSet = useStudyStore((state) => state.deleteSessionsForSet);
  const pushToast = useToastStore((state) => state.pushToast);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!set) return <NotFound />;

  function removeSet() {
    deleteProgressForCards(cards.map((card) => card.id));
    deleteSessionsForSet(set.id);
    deleteSet(set.id);
    pushToast({
      title: "Đã xóa bộ thẻ",
      description: `"${set.title}" đã được xóa khỏi thư viện.`,
      type: "success"
    });
    navigate("/");
  }

  return (
    <>
      <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 max-lg:grid-cols-1">
        <div className="panel">
          <p className="eyebrow">Study set</p>
          <h1 className="mb-3 text-4xl font-black">{set.title}</h1>
          <p className="text-lg leading-8 text-quiz-muted">{set.description}</p>
          <div className="mt-5 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
            <Mode set={set} mode="flashcards" index="01" title="Flashcard" copy="Ôn thẻ" />
            <Mode set={set} mode="learn" index="02" title="Learn" copy="Hỏi lại thông minh" />
            <Mode set={set} mode="test" index="03" title="Test" copy="Kiểm tra" />
            <Mode set={set} mode="match" index="04" title="Match" copy="Ghép cặp" />
          </div>
        </div>

        <aside className="panel">
          <h2 className="text-xl font-black">Tiến độ</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat value={cards.length} label="cards" />
          <Stat value={stats.mastered} label="mastered" />
          <Stat value={stats.learning} label="learning" />
          </div>
          <button
            className="ghost-btn mt-4 w-full"
            type="button"
            onClick={async () => {
              await navigator.clipboard?.writeText(window.location.href);
              pushToast({ title: "Đã copy link", description: "Link bộ thẻ đã được sao chép.", type: "success" });
            }}
          >
            Copy share link
          </button>
          <button className="danger-btn mt-2 w-full" type="button" onClick={() => setConfirmOpen(true)}>Xóa bộ thẻ</button>
        </aside>
      </section>

      {cards[0] && (
        <section className="mt-5 grid grid-cols-[minmax(0,1fr)_240px] gap-5 max-lg:grid-cols-1">
          <button
            className="panel grid min-h-[260px] place-items-center text-center"
            type="button"
            onClick={() => setPreviewFlipped(!previewFlipped)}
          >
            <div>
              <span className="badge">{previewFlipped ? "Definition" : "Term"}</span>
              <h2 className="mt-5 text-5xl font-black">{previewFlipped ? cards[0].definition : cards[0].term}</h2>
              <p className="muted mt-4">Bấm để lật thẻ xem nhanh</p>
            </div>
          </button>
          <div className="panel">
            <h2 className="text-xl font-black">Bắt đầu học</h2>
            <div className="mt-4 grid gap-2">
              <Link className="primary-btn w-full" to={`/study/${set.share_slug}/flashcards`}>Flashcard</Link>
              <Link className="ghost-btn w-full" to={`/study/${set.share_slug}/learn`}>Learn</Link>
              <Link className="ghost-btn w-full" to={`/study/${set.share_slug}/test`}>Test</Link>
              <Link className="ghost-btn w-full" to={`/study/${set.share_slug}/match`}>Match</Link>
            </div>
          </div>
        </section>
      )}

      <section className="panel mt-6">
        <h2 className="mb-4 text-3xl font-black">Danh sách cards</h2>
        <div className="grid gap-3">
          {cards.map((card, index) => {
            const progress = getProgress(user.id, card.id);
            const label = progress.mastery_level === 2 ? "Mastered" : progress.mastery_level === 1 ? "Learning" : "New";
            return (
              <article key={card.id} className="grid min-h-[76px] grid-cols-[44px_1fr_1.3fr_auto] items-center gap-4 rounded-card border border-quiz-line bg-white p-3 max-lg:grid-cols-1">
                <span className="font-black text-quiz-muted">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="font-black">{card.term}</div>
                  <div className="muted">{card.phonetic}</div>
                </div>
                <div className="muted">{card.definition}<br /><small>{card.example_sentence}</small></div>
                <span className="badge">{label}</span>
              </article>
            );
          })}
        </div>
      </section>
      <ConfirmDialog
        open={confirmOpen}
        title={`Xóa bộ thẻ "${set.title}"?`}
        description="Hành động này sẽ xóa toàn bộ cards, tiến độ học và lịch sử phiên liên quan đến bộ thẻ này."
        confirmLabel="Xóa bộ thẻ"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={removeSet}
      />
    </>
  );
}

function Mode({ set, mode, index, title, copy }) {
  return (
    <Link className="panel grid min-h-[150px] content-start gap-3 text-quiz-ink no-underline transition hover:-translate-y-0.5 hover:border-quiz-blue hover:shadow-soft" to={`/study/${set.share_slug}/${mode}`}>
      <span className="font-black text-quiz-blue">{index}</span>
      <strong className="text-xl">{title}</strong>
      <small className="muted">{copy}</small>
    </Link>
  );
}

function Stat({ value, label }) {
  return (
    <div className="panel min-h-[106px]">
      <strong className="block text-4xl font-black">{value}</strong>
      <span className="muted">{label}</span>
    </div>
  );
}

function NotFound() {
  return <section className="panel"><h1 className="hero-title">Không tìm thấy set</h1><Link className="primary-btn" to="/">Về Home</Link></section>;
}
