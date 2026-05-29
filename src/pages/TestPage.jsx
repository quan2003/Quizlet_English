import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, ClipboardCheck, FileQuestion, RotateCcw, XCircle } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useStudyStore } from "../stores/studyStore";
import { useToastStore } from "../stores/toastStore";
import { makeOptions, normalize, sessionRecord } from "../utils/study";

export default function TestPage() {
  const { slug } = useParams();
  const user = useAuthStore((state) => state.user);
  const set = useSetsStore((state) => state.getSetBySlug(slug));
  const allCards = useSetsStore((state) => state.cards);
  const cards = useMemo(
    () => set ? allCards.filter((card) => card.set_id === set.id).sort((a, b) => a.position - b.position) : [],
    [allCards, set]
  );
  const updateCardProgress = useProgressStore((state) => state.updateCardProgress);
  const addSession = useStudyStore((state) => state.addSession);
  const pushToast = useToastStore((state) => state.pushToast);
  const [seed, setSeed] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const startedAt = useMemo(() => Date.now(), [seed]);
  const items = useMemo(() => cards.slice().sort(() => Math.random() - 0.5).slice(0, 6).map((card, index) => ({
    card,
    type: index % 2 === 0 ? "choice" : "write",
    options: makeOptions(card, cards)
  })), [cards, seed]);

  if (!set) return <section className="panel">Không tìm thấy set.</section>;

  const answeredCount = items.filter((_, index) => normalize(answers[`q${index}`])).length;
  const progress = items.length ? Math.round((answeredCount / items.length) * 100) : 0;

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let score = 0;
    const review = items.map((item, index) => {
      const value = form.get(`q${index}`);
      const correct = item.type === "choice"
        ? value === item.card.definition
        : normalize(value) === normalize(item.card.term);
      if (correct) score += 1;
      updateCardProgress(user.id, item.card.id, correct);
      return { term: item.card.term, correct, answer: item.type === "choice" ? item.card.definition : item.card.term };
    });
    addSession(sessionRecord({ userId: user.id, setId: set.id, mode: "test", score, total: items.length, startedAt }));
    setResult({ score, total: items.length, review });
    pushToast({
      title: "Đã nộp bài",
      description: `Kết quả của bạn: ${score}/${items.length}. Review đã hiển thị bên phải.`,
      type: "success"
    });
  }

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_320px] gap-5 max-lg:grid-cols-1">
      <div className="glass-panel">
        <div className="mb-6 flex items-end justify-between gap-4 max-lg:grid">
          <div>
            <p className="eyebrow">Test mode</p>
            <h1 className="mb-3 text-[clamp(2.4rem,6vw,4.8rem)] font-black leading-none">Bài kiểm tra từ vựng</h1>
            <p className="muted">Gồm trắc nghiệm 4 đáp án và điền từ. Nộp bài để xem review chi tiết.</p>
          </div>
          <button className="ghost-btn" type="button" onClick={() => { setSeed(Date.now()); setResult(null); setAnswers({}); }}>
            <RotateCcw size={17} /> Tạo đề mới
          </button>
        </div>

        <form className="grid gap-4" onSubmit={submit}>
          {items.map((item, index) => (
            <article key={`${item.card.id}-${index}`} className="rounded-card border border-quiz-line bg-white p-5 shadow-[0_1px_0_rgba(36,43,79,0.04)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="badge">Câu {index + 1}</span>
                  <h2 className="mt-3 text-2xl font-black">
                    {item.type === "choice"
                      ? `Chọn nghĩa đúng của “${item.card.term}”`
                      : `Điền từ tiếng Anh tương ứng với nghĩa: ${item.card.definition}`}
                  </h2>
                </div>
                <span className="icon-tile">{item.type === "choice" ? <FileQuestion size={20} /> : <ClipboardCheck size={20} />}</span>
              </div>

              {item.type === "choice" ? (
                <div className="grid gap-3">
                  {item.options.map((option) => {
                    const checked = answers[`q${index}`] === option;
                    return (
                      <label
                        key={option}
                        className={`flex min-h-[58px] cursor-pointer items-center gap-3 rounded-card border px-4 font-extrabold transition hover:-translate-y-0.5 hover:border-quiz-blue hover:bg-[#f8f9ff] ${
                          checked ? "border-quiz-blue bg-[#eef1ff] shadow-[0_0_0_4px_rgba(66,85,255,0.10)]" : "border-quiz-line bg-white"
                        }`}
                      >
                        <input
                          className="size-4"
                          type="radio"
                          name={`q${index}`}
                          value={option}
                          checked={checked}
                          onChange={() => setAnswers((state) => ({ ...state, [`q${index}`]: option }))}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  className="input min-h-[54px] text-lg font-bold"
                  name={`q${index}`}
                  autoComplete="off"
                  value={answers[`q${index}`] || ""}
                  onChange={(event) => setAnswers((state) => ({ ...state, [`q${index}`]: event.target.value }))}
                  placeholder="Nhập từ tiếng Anh..."
                />
              )}
            </article>
          ))}
          <button className="primary-btn w-fit" type="submit"><ClipboardCheck size={18} /> Nộp bài</button>
        </form>
      </div>

      <aside className="glass-panel h-fit">
        <p className="eyebrow">Tiến độ bài làm</p>
        <h2 className="text-3xl font-black">{answeredCount}/{items.length}</h2>
        <p className="muted mb-4">câu đã trả lời</p>
        <div className="mb-5 h-3 overflow-hidden rounded-full bg-[#eef1ff]">
          <span className="block h-full rounded-full bg-quiz-blue transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {result ? (
          <div className="rounded-card border border-quiz-line bg-white p-4">
            <div className="mb-4 rounded-card bg-[#eef1ff] p-4 text-center">
              <p className="text-sm font-black uppercase text-quiz-blue">Kết quả</p>
              <strong className="text-4xl">{result.score}/{result.total}</strong>
            </div>
            <div className="grid gap-2">
              {result.review.map((item) => (
                <div key={item.term} className="flex items-center justify-between gap-3 rounded-card border border-quiz-line p-3">
                  <span className="font-bold">{item.term}</span>
                  <span className={item.correct ? "text-[#18ae79]" : "text-[#d94d4d]"}>
                    {item.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-quiz-line bg-[#f8f9ff] p-4 text-sm font-bold text-quiz-muted">
            Review đáp án sẽ xuất hiện sau khi bạn nộp bài.
          </div>
        )}
      </aside>
    </section>
  );
}
