import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, MousePointer2, RotateCcw, XCircle } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useStudyStore } from "../stores/studyStore";
import { sessionRecord } from "../utils/study";

export default function MatchPage() {
  const { slug } = useParams();
  const user = useAuthStore((state) => state.user);
  const set = useSetsStore((state) => state.getSetBySlug(slug));
  const cards = useSetsStore((state) => set ? state.getCardsBySetId(set.id) : []);
  const updateCardProgress = useProgressStore((state) => state.updateCardProgress);
  const matchSession = useStudyStore((state) => state.matchSession);
  const startMatch = useStudyStore((state) => state.startMatch);
  const selectMatchTile = useStudyStore((state) => state.selectMatchTile);
  const addSession = useStudyStore((state) => state.addSession);
  const recordedRef = useRef(false);
  const [feedback, setFeedback] = useState("Chọn một ô term hoặc definition để bắt đầu.");
  const [feedbackType, setFeedbackType] = useState("idle");

  useEffect(() => {
    if (set && cards.length && matchSession?.setId !== set.id) startMatch(set.id, cards);
  }, [cards, matchSession?.setId, set, startMatch]);

  useEffect(() => {
    if (!set || !matchSession) return;
    if (!matchSession.completed) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    addSession(sessionRecord({ userId: user.id, setId: set.id, mode: "match", score: 6, total: 6, startedAt: matchSession.startedAt }));
  }, [addSession, matchSession, set, user.id]);

  if (!set || !matchSession) return <section className="panel">Đang tạo Match game...</section>;

  function select(tileId) {
    const result = selectMatchTile(tileId);
    if (!result) return;
    if (result.status === "selected") {
      setFeedback(`Đã chọn: ${result.tile.text}. Chọn ô còn lại để ghép cặp.`);
      setFeedbackType("selected");
      return;
    }
    if (result.status === "match") {
      updateCardProgress(user.id, result.cardId, true);
      setFeedback(result.completed ? "Hoàn thành. Tất cả cặp đã được ghép đúng." : "Ghép đúng. Cặp này đã biến mất khỏi bàn.");
      setFeedbackType("match");
      return;
    }
    setFeedback("Hai ô này chưa khớp. Thử chọn lại một cặp khác.");
    setFeedbackType("miss");
  }

  function finishIfComplete() {
    if (!matchSession.completed) return null;
    const seconds = Math.floor((Date.now() - matchSession.startedAt) / 1000);
    return <div className="mt-4 rounded-card border border-[#18ae79] bg-[#e7f8f2] p-4 font-black text-[#0d7d56]">Hoàn thành Match trong {seconds}s</div>;
  }

  return (
    <section className="glass-panel">
      <div className="mb-5 flex items-end justify-between gap-4 max-lg:grid">
        <div>
          <p className="eyebrow">Match game</p>
          <h1 className="hero-title">Ghép từ với nghĩa</h1>
          <p className="muted">Click 1 ô, rồi chọn ô còn lại. Cặp đúng sẽ sáng xanh và biến mất.</p>
        </div>
        <button className="ghost-btn" type="button" onClick={() => { startMatch(set.id, cards); setFeedback("Chọn một ô term hoặc definition để bắt đầu."); setFeedbackType("idle"); }}>
          <RotateCcw size={17} /> Chơi lại
        </button>
      </div>

      <div className={feedbackClass(feedbackType)}>
        {feedbackType === "match" && <CheckCircle2 size={20} />}
        {feedbackType === "miss" && <XCircle size={20} />}
        {(feedbackType === "idle" || feedbackType === "selected") && <MousePointer2 size={20} />}
        <span>{feedback}</span>
      </div>

      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        {matchSession.tiles.map((tile) => (
          <button
            key={tile.id}
            className={tileClass({ tile, selected: matchSession.selected.includes(tile.id) })}
            type="button"
            onClick={() => select(tile.id)}
          >
            <span>{tile.text}</span>
          </button>
        ))}
      </div>
      {finishIfComplete()}
    </section>
  );
}

function feedbackClass(type) {
  const base = "mb-4 flex min-h-12 items-center gap-3 rounded-card border px-4 font-black transition-all duration-300";
  if (type === "match") return `${base} border-[#18ae79] bg-[#e7f8f2] text-[#0d7d56]`;
  if (type === "miss") return `${base} border-[#d94d4d] bg-[#ffecec] text-[#a33a3a]`;
  if (type === "selected") return `${base} border-quiz-blue bg-[#eef1ff] text-quiz-blue`;
  return `${base} border-quiz-line bg-white text-quiz-muted`;
}

function tileClass({ tile, selected }) {
  const base = "min-h-[128px] rounded-card border p-4 text-left font-black transition duration-200 hover:-translate-y-0.5 hover:border-quiz-blue hover:bg-[#f8f9ff] hover:shadow-[0_12px_34px_rgba(36,43,79,0.10)]";
  if (tile.matched) return `${base} pointer-events-none scale-95 border-[#18ae79] bg-[#e7f8f2] opacity-0`;
  if (selected) return `${base} border-quiz-blue bg-[#eef1ff] shadow-[0_0_0_4px_rgba(66,85,255,0.12)]`;
  return `${base} border-quiz-line bg-white`;
}
