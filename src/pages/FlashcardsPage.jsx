import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, RotateCw, Shuffle, Volume2, X } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useStudyStore } from "../stores/studyStore";
import { speak } from "../utils/study";

export default function FlashcardsPage() {
  const { slug } = useParams();
  const user = useAuthStore((state) => state.user);
  const set = useSetsStore((state) => state.getSetBySlug(slug));
  const cards = useSetsStore((state) => set ? state.getCardsBySetId(set.id) : []);
  const updateCardProgress = useProgressStore((state) => state.updateCardProgress);
  const flashcard = useStudyStore((state) => state.flashcard);
  const setFlashcard = useStudyStore((state) => state.setFlashcard);

  if (!set || !cards.length) return <section className="panel">Không có card để học.</section>;

  const index = Math.min(flashcard.index, cards.length - 1);
  const card = cards[index];
  const progress = Math.round(((index + 1) / cards.length) * 100);

  function move(offset) {
    setFlashcard({ index: (index + offset + cards.length) % cards.length, flipped: false });
  }

  function mark(correct) {
    updateCardProgress(user.id, card.id, correct);
    move(1);
  }

  return (
    <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
      <aside className="glass-panel">
        <p className="eyebrow">Flashcard mode</p>
        <h1 className="text-4xl font-black">{index + 1} / {cards.length}</h1>
        <div className="my-5 h-3 overflow-hidden rounded-full bg-[#eef1ff]">
          <span className="block h-full rounded-full bg-quiz-blue transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="muted mb-4">Lật thẻ, nghe phát âm, đánh dấu biết/chưa biết để cập nhật tiến độ.</p>
        <div className="mb-4 flex gap-2">
          <button
            className={`icon-btn ${flashcard.shuffled ? "icon-btn-active" : ""}`}
            type="button"
            onClick={() => setFlashcard({ shuffled: !flashcard.shuffled })}
            title={flashcard.shuffled ? "Tắt shuffle" : "Bật shuffle"}
            aria-label={flashcard.shuffled ? "Tắt shuffle" : "Bật shuffle"}
          >
            <Shuffle size={19} />
          </button>
          <button className="icon-btn" type="button" onClick={() => speak(card.term)} title="Phát âm" aria-label="Phát âm">
            <Volume2 size={20} />
          </button>
        </div>
        <button className="primary-btn mb-2 w-full" type="button" onClick={() => mark(true)}><Check size={18} /> Biết</button>
        <button className="danger-btn mb-2 w-full" type="button" onClick={() => mark(false)}><X size={18} /> Chưa biết</button>
        <Link className="ghost-btn w-full" to={`/study/${set.share_slug}`}>Quay lại set</Link>
      </aside>

      <section>
        <article
          className="glass-panel flip-scene grid min-h-[540px] cursor-pointer place-items-center overflow-hidden"
          onClick={() => setFlashcard({ flipped: !flashcard.flipped })}
        >
          <div className={`flip-card relative min-h-[390px] w-[min(760px,100%)] rounded-card ${flashcard.flipped ? "is-flipped" : ""}`}>
            <div className="flip-face absolute inset-0 grid place-items-center content-center gap-5 rounded-card border border-quiz-line bg-gradient-to-br from-white via-white to-[#f1f3ff] p-7 text-center shadow-[0_20px_70px_rgba(36,43,79,0.10)] hover:shadow-[0_24px_80px_rgba(36,43,79,0.15)]">
              <span className="badge">{card.phonetic || "Term"}</span>
              <h2 className="text-[clamp(2.7rem,8vw,6rem)] font-black leading-none">{card.term}</h2>
              <small className="muted">Nhấn để lật thẻ</small>
            </div>
            <div className="flip-face flip-back absolute inset-0 grid place-items-center content-center gap-5 rounded-card border border-quiz-line bg-gradient-to-br from-[#eef1ff] via-white to-white p-7 text-center shadow-[0_20px_70px_rgba(36,43,79,0.10)]">
              <span className="badge">Definition</span>
              <p className="max-w-2xl text-[clamp(1.55rem,5vw,3rem)] font-black leading-tight">{card.definition}</p>
              {card.example_sentence && <small className="muted">{card.example_sentence}</small>}
            </div>
          </div>
        </article>
        <div className="mt-4 flex justify-center gap-3">
          <button className="icon-btn" type="button" onClick={() => move(-1)} aria-label="Thẻ trước" title="Thẻ trước"><ArrowLeft size={20} /></button>
          <button className="ghost-btn" type="button" onClick={() => setFlashcard({ flipped: !flashcard.flipped })}><RotateCw size={18} /> Lật thẻ</button>
          <button className="icon-btn" type="button" onClick={() => move(1)} aria-label="Thẻ sau" title="Thẻ sau"><ArrowRight size={20} /></button>
        </div>
      </section>
    </div>
  );
}
