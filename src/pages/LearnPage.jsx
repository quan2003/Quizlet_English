import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useStudyStore } from "../stores/studyStore";
import { makeOptions, sessionRecord } from "../utils/study";

export default function LearnPage() {
  const { slug } = useParams();
  const user = useAuthStore((state) => state.user);
  const set = useSetsStore((state) => state.getSetBySlug(slug));
  const cards = useSetsStore((state) => set ? state.getCardsBySetId(set.id) : []);
  const getProgress = useProgressStore((state) => state.getProgress);
  const updateCardProgress = useProgressStore((state) => state.updateCardProgress);
  const statsForCards = useProgressStore((state) => state.statsForCards);
  const learnSession = useStudyStore((state) => state.learnSession);
  const startLearn = useStudyStore((state) => state.startLearn);
  const popLearnCard = useStudyStore((state) => state.popLearnCard);
  const answerLearn = useStudyStore((state) => state.answerLearn);
  const advanceLearn = useStudyStore((state) => state.advanceLearn);
  const addSession = useStudyStore((state) => state.addSession);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    if (set && cards.length && learnSession?.setId !== set.id) {
      startLearn(set.id, cards, (cardId) => getProgress(user.id, cardId));
    }
  }, [cards, getProgress, learnSession?.setId, set, startLearn, user.id]);

  useEffect(() => {
    if (learnSession && !learnSession.current && !learnSession.completed) popLearnCard();
  }, [learnSession, popLearnCard]);

  const current = learnSession?.current;
  const options = useMemo(() => current ? makeOptions(current.card, cards) : [], [cards, current]);

  if (!set) return <section className="panel">Không tìm thấy set.</section>;
  if (!current && learnSession?.completed) {
    const stats = statsForCards(user.id, cards);
    return (
      <section className="panel">
        <p className="eyebrow">Learn complete</p>
        <h1 className="hero-title">{stats.percent}% mastered</h1>
        <p className="max-w-3xl text-lg leading-8 text-quiz-muted">Round kết thúc. Thẻ sai đã quay lại queue cho đến khi đúng 2 lần liên tiếp.</p>
        <div className="flex gap-3">
          <button className="primary-btn" type="button" onClick={() => startLearn(set.id, cards, (cardId) => getProgress(user.id, cardId))}>Học lại</button>
          <Link className="ghost-btn" to={`/study/${set.share_slug}`}>Về set</Link>
        </div>
      </section>
    );
  }
  if (!current) return <section className="panel">Đang tạo session học...</section>;

  function choose(option) {
    if (answered) return;
    const correct = option === current.card.definition;
    updateCardProgress(user.id, current.card.id, correct);
    const result = answerLearn(correct);
    setAnswered(true);
    setSelectedOption(option);
    setFeedback(correct
      ? result.correctCount >= 2 ? "Đúng. Card này đã mastered." : "Đúng. Cần đúng thêm một lần để mastered."
      : `Chưa đúng. Đáp án là: ${current.card.definition}`);
  }

  function next() {
    setAnswered(false);
    setFeedback("");
    setSelectedOption("");
    if (learnSession.queue.length === 0) {
      addSession(sessionRecord({
        userId: user.id,
        setId: set.id,
        mode: "learn",
        score: learnSession.correct,
        total: learnSession.correct + learnSession.wrong,
        startedAt: learnSession.startedAt
      }));
    }
    advanceLearn();
  }

  return (
    <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
      <aside className="glass-panel">
        <p className="eyebrow">Learn mode</p>
        <h2 className="text-4xl font-black">{learnSession.queue.length + 1}</h2>
        <p className="muted mb-5">cards còn trong queue. Trả lời sai sẽ quay lại cuối hàng đợi.</p>
        <div className="mb-5 h-3 overflow-hidden rounded-full bg-[#eef1ff]">
          <span
            className="block h-full rounded-full bg-quiz-blue transition-all duration-500"
            style={{ width: `${Math.max(8, ((learnSession.correct + learnSession.wrong) / Math.max(1, cards.length * 2)) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card border border-quiz-line bg-white p-4">
            <span className="text-sm font-black text-quiz-muted">Đúng</span>
            <strong className="mt-2 block text-3xl text-[#18ae79]">{learnSession.correct}</strong>
          </div>
          <div className="rounded-card border border-quiz-line bg-white p-4">
            <span className="text-sm font-black text-quiz-muted">Sai</span>
            <strong className="mt-2 block text-3xl text-[#d94d4d]">{learnSession.wrong}</strong>
          </div>
        </div>
        <button className="ghost-btn mt-4 w-full" type="button" onClick={() => startLearn(set.id, cards, (cardId) => getProgress(user.id, cardId))}>
          <RotateCcw size={17} /> Làm lại round
        </button>
      </aside>
      <section className="glass-panel min-h-[560px]">
        <div className="mb-6 rounded-card border border-quiz-line bg-gradient-to-br from-white to-[#f8f9ff] p-6">
          <p className="eyebrow">Chọn nghĩa đúng</p>
          <h1 className="mb-3 text-[clamp(3rem,8vw,6rem)] font-black leading-none">{current.card.term}</h1>
          <p className="muted">{current.card.phonetic || "Vocabulary"} {current.card.example_sentence ? `· ${current.card.example_sentence}` : ""}</p>
        </div>
        <div className="my-6 grid gap-3">
          {options.map((option) => (
            <button
              key={option}
              className={answerClass({ answered, option, selectedOption, correctOption: current.card.definition })}
              type="button"
              onClick={() => choose(option)}
            >
              <span>{option}</span>
              {answered && option === current.card.definition && <CheckCircle2 className="text-[#18ae79]" size={22} />}
              {answered && option === selectedOption && option !== current.card.definition && <XCircle className="text-[#d94d4d]" size={22} />}
            </button>
          ))}
        </div>
        <div className={`mb-4 min-h-14 rounded-card border p-4 font-black transition-all duration-300 ${
          answered
            ? selectedOption === current.card.definition
              ? "border-[#18ae79] bg-[#e7f8f2] text-[#0d7d56]"
              : "border-[#d94d4d] bg-[#ffecec] text-[#a33a3a]"
            : "border-transparent"
        }`}>
          {feedback}
        </div>
        {answered && <button className="primary-btn" type="button" onClick={next}>Câu tiếp theo</button>}
      </section>
    </div>
  );
}

function answerClass({ answered, option, selectedOption, correctOption }) {
  const base = "flex min-h-[68px] items-center justify-between gap-3 rounded-card border bg-white px-5 text-left font-extrabold shadow-[0_1px_0_rgba(36,43,79,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-quiz-blue hover:bg-[#f8f9ff]";
  if (!answered) return `${base} border-quiz-line`;
  if (option === correctOption) return `${base} border-[#18ae79] bg-[#e7f8f2]`;
  if (option === selectedOption) return `${base} border-[#d94d4d] bg-[#ffecec]`;
  return `${base} border-quiz-line opacity-55`;
}
