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
  const allCards = useSetsStore((state) => state.cards);
  const cards = useMemo(
    () => set ? allCards.filter((card) => card.set_id === set.id).sort((a, b) => a.position - b.position) : [],
    [allCards, set]
  );
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
  const [direction, setDirection] = useState("term-to-definition");
  const [segmentCards, setSegmentCards] = useState([]);
  const [showReviewBreak, setShowReviewBreak] = useState(false);
  const [questionOptions, setQuestionOptions] = useState([]);

  useEffect(() => {
    if (set && cards.length && learnSession?.setId !== set.id) {
      startLearn(set.id, cards, (cardId) => getProgress(user.id, cardId));
    }
  }, [cards, getProgress, learnSession?.setId, set, startLearn, user.id]);

  useEffect(() => {
    if (learnSession && !learnSession.current && !learnSession.completed) popLearnCard();
  }, [learnSession, popLearnCard]);

  const current = learnSession?.current;
  const correctOption = current ? answerFor(current.card, direction) : "";
  const totalTarget = cards.length * 2;
  const totalProgress = Math.min(learnSession?.correct || 0, totalTarget);

  useEffect(() => {
    if (!current) {
      setQuestionOptions([]);
      return;
    }
    setQuestionOptions(makeDirectionalOptions(current.card, cards, direction));
  }, [cards, current?.card.id, direction]);

  if (!set) return <section className="panel">Không tìm thấy set.</section>;
  if (!current && learnSession?.completed) {
    const stats = statsForCards(user.id, cards);
    return (
      <section className="panel">
        <p className="eyebrow">Learn complete</p>
        <h1 className="hero-title">{stats.percent}% đã thuộc</h1>
        <p className="max-w-3xl text-lg leading-8 text-quiz-muted">Vòng học kết thúc. Thẻ sai đã quay lại hàng đợi cho đến khi đúng 2 lần liên tiếp.</p>
        <div className="flex gap-3">
          <button className="primary-btn" type="button" onClick={() => restartLearn()}>Học lại</button>
          <Link className="ghost-btn" to={`/study/${set.share_slug}`}>Về set</Link>
        </div>
      </section>
    );
  }
  if (!current) return <section className="panel">Đang tạo session học...</section>;

  if (showReviewBreak) {
    return (
      <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
        <aside className="glass-panel">
          <p className="eyebrow">Nghỉ giữa nhịp</p>
          <h2 className="text-4xl font-black">{segmentCards.length}</h2>
          <p className="muted mb-5">thẻ vừa trả lời đúng. Xem lại nhanh rồi tiếp tục với chiều hỏi ngược lại.</p>
        </aside>

        <section className="glass-panel">
          <p className="eyebrow">Ôn lại 7 câu vừa đúng</p>
          <h1 className="mb-5 text-[clamp(2rem,5vw,4rem)] font-black leading-none">Bạn đang giữ nhịp rất tốt</h1>
          <div className="grid gap-3">
            {segmentCards.map((card) => (
              <article key={card.id} className="grid grid-cols-[1fr_1.2fr] gap-4 rounded-card border border-quiz-line bg-white p-4 max-md:grid-cols-1">
                <strong>{card.term}</strong>
                <span className="muted">{card.definition}</span>
              </article>
            ))}
          </div>
          <button className="primary-btn mt-5" type="button" onClick={continueAfterBreak}>Tiếp tục học</button>
        </section>
      </div>
    );
  }

  function choose(option) {
    if (answered) return;
    const correct = option === correctOption;
    updateCardProgress(user.id, current.card.id, correct);
    const result = answerLearn(correct);
    if (correct) {
      setSegmentCards((items) => [...items, current.card]);
    }
    setAnswered(true);
    setSelectedOption(option);
    setFeedback(feedbackMessage({
      correct,
      mastered: result.correctCount >= 2,
      answer: correctOption
    }));
  }

  function next() {
    if (segmentCards.length >= 7) {
      setAnswered(false);
      setFeedback("");
      setSelectedOption("");
      setShowReviewBreak(true);
      return;
    }

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

  function continueAfterBreak() {
    setShowReviewBreak(false);
    setSegmentCards([]);
    setDirection(randomDirection());
    advanceLearn();
  }

  function restartLearn() {
    setAnswered(false);
    setFeedback("");
    setSelectedOption("");
    setSegmentCards([]);
    setShowReviewBreak(false);
    setDirection(randomDirection());
    startLearn(set.id, cards, (cardId) => getProgress(user.id, cardId));
  }

  return (
    <section className="mx-auto max-w-6xl -mt-2">
      <LearnSegmentBar totalProgress={totalProgress} totalTarget={totalTarget} segmentSize={7} />

      <div className="glass-panel mt-4 grid min-h-[calc(100vh-250px)] content-between bg-[#303a58] text-white">
        <div className="mb-8">
          <p className="mb-8 text-sm font-black text-white/85">{direction === "term-to-definition" ? "Từ vựng" : "Định nghĩa"}</p>
          <h1 className="mb-3 text-[clamp(2.2rem,5.8vw,4.6rem)] font-black leading-none">{promptFor(current.card, direction)}</h1>
          <p className="text-white/70">{direction === "term-to-definition" ? current.card.phonetic || "" : ""}</p>
        </div>

        <div>
          <p className="mb-4 font-black text-white/90">Chọn đáp án đúng</p>
          <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
            {questionOptions.map((option) => (
              <button
                key={option}
                className={answerClass({ answered, option, selectedOption, correctOption })}
                type="button"
                onClick={() => choose(option)}
              >
                <span>{option}</span>
                {answered && option === correctOption && <CheckCircle2 className="text-[#18ae79]" size={22} />}
                {answered && option === selectedOption && option !== correctOption && <XCircle className="text-[#d94d4d]" size={22} />}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-5 min-h-14 rounded-card border p-4 font-black transition-all duration-300 ${
          answered
            ? selectedOption === correctOption
              ? "border-[#18ae79] bg-[#e7f8f2] text-[#0d7d56]"
              : "border-[#d94d4d] bg-[#ffecec] text-[#a33a3a]"
            : "border-transparent"
        }`}>
          {feedback}
        </div>
        <div className="mt-5 flex justify-between gap-3">
          <button className="ghost-btn" type="button" onClick={restartLearn}>
            <RotateCcw size={17} /> Làm lại
          </button>
          {answered && <button className="primary-btn" type="button" onClick={next}>Câu tiếp theo</button>}
        </div>
      </div>
    </section>
  );
}

function LearnSegmentBar({ totalProgress, totalTarget, segmentSize }) {
  const segments = buildSegments(totalTarget, segmentSize);
  let remainingProgress = totalProgress;

  return (
    <div className="flex items-center gap-2">
      {segments.map((segment, index) => {
        const filled = Math.min(segment, Math.max(0, remainingProgress));
        remainingProgress -= filled;
        const percent = segment ? (filled / segment) * 100 : 0;
        return (
          <div key={index} className="relative h-4 flex-1 rounded-full bg-[#c9d0e6]">
            <span
              className={`block h-full rounded-full transition-all duration-500 ${percent >= 100 ? "bg-[#18ae79]" : "bg-quiz-blue"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        );
      })}
      <span className="flex h-10 shrink-0 items-center rounded-full bg-[#59627d] px-4 font-black text-white">
        {totalProgress}<span className="ml-1 text-white/75">/{totalTarget}</span>
      </span>
    </div>
  );
}

function buildSegments(totalTarget, segmentSize) {
  const count = Math.max(1, Math.ceil(totalTarget / segmentSize));
  return Array.from({ length: count }, (_, index) => {
    const remaining = totalTarget - index * segmentSize;
    return Math.min(segmentSize, remaining);
  });
}

function promptFor(card, direction) {
  return direction === "term-to-definition" ? card.term : card.definition;
}

function answerFor(card, direction) {
  return direction === "term-to-definition" ? card.definition : card.term;
}

function makeDirectionalOptions(correctCard, cards, direction) {
  if (direction === "term-to-definition") return makeOptions(correctCard, cards);
  const wrong = cards
    .filter((card) => card.id !== correctCard.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((card) => card.term);
  return [...wrong, correctCard.term].sort(() => Math.random() - 0.5);
}

function feedbackMessage({ correct, mastered, answer }) {
  if (correct && mastered) {
    return pick([
      "Chính xác. Từ này đã được đưa vào nhóm đã thuộc.",
      "Rất tốt. Bạn đã trả lời đúng đủ lượt cho từ này.",
      "Chuẩn rồi. Từ này tạm thời đã an toàn trong trí nhớ.",
      "Hoàn hảo. Thẻ này đã đạt mức đã thuộc."
    ]);
  }

  if (correct) {
    return pick([
      "Đúng rồi. Gặp lại một lần nữa là từ này sẽ được đánh dấu đã thuộc.",
      "Chính xác. Mình sẽ hỏi lại để chắc bạn nhớ bền.",
      "Tốt. Bạn đang tiến gần hơn tới trạng thái đã thuộc.",
      "Đúng đáp án. Tiếp tục giữ nhịp này nhé."
    ]);
  }

  return pick([
    `Chưa khớp. Đáp án đúng là: ${answer}`,
    `Gần rồi. Nghĩa đúng cần nhớ là: ${answer}`,
    `Chưa đúng lần này. Từ này sẽ quay lại hàng đợi. Đáp án: ${answer}`,
    `Không sao, mình sẽ hỏi lại sau. Đáp án đúng: ${answer}`
  ]);
}

function pick(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function randomDirection() {
  return Math.random() > 0.5 ? "term-to-definition" : "definition-to-term";
}

function answerClass({ answered, option, selectedOption, correctOption }) {
  const base = "flex min-h-[58px] items-center justify-between gap-3 rounded-card border px-6 text-left font-extrabold transition duration-200 hover:-translate-y-0.5";
  if (!answered) return `${base} border-white/25 bg-transparent text-white hover:border-white/60 hover:bg-white/5`;
  if (option === correctOption) return `${base} border-[#18ae79] bg-[#e7f8f2] text-[#0d7d56]`;
  if (option === selectedOption) return `${base} border-[#d94d4d] bg-[#ffecec] text-[#a33a3a]`;
  return `${base} border-white/20 bg-transparent text-white/45`;
}
