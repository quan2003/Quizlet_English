import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { CheckCircle2, ClipboardCheck, FileQuestion, RotateCcw, XCircle, X } from "lucide-react";
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
  const [showSetup, setShowSetup] = useState(true);
  const [config, setConfig] = useState({
    questionCount: 16,
    answerWith: "both",
    types: { trueFalse: false, multipleChoice: true, matching: false, written: true }
  });
  const startedAt = useMemo(() => Date.now(), [seed]);
  
  const items = useMemo(() => {
    if (!cards.length) return [];
    const activeTypes = Object.entries(config.types)
      .filter(([_, isActive]) => isActive)
      .map(([type]) => type);
    if (activeTypes.length === 0) activeTypes.push("multipleChoice");

    let count = Math.min(config.questionCount, cards.length);
    const selectedCards = cards.slice().sort(() => Math.random() - 0.5).slice(0, count);

    return selectedCards.map((card, index) => {
      const typeStr = activeTypes[index % activeTypes.length];
      
      let askFor = config.answerWith;
      if (askFor === "both") {
        askFor = Math.random() > 0.5 ? "term" : "definition";
      }

      if (typeStr === "trueFalse") {
        const isTrue = Math.random() > 0.5;
        const falseCard = cards.filter(c => c.id !== card.id)[Math.floor(Math.random() * (cards.length - 1))] || card;
        return { card, type: "trueFalse", matchCard: isTrue ? card : falseCard, isTrue, askFor };
      }
      return {
        card,
        type: typeStr === "written" ? "write" : typeStr === "matching" ? "matching" : "choice",
        options: makeOptions(card, cards, askFor === "term" ? "term" : "definition"),
        askFor
      };
    });
  }, [cards, seed, config]);
  if (!set) return <section className="panel">Không tìm thấy set.</section>;

  const answeredCount = items.filter((_, index) => normalize(answers[`q${index}`])).length;
  const progress = items.length ? Math.round((answeredCount / items.length) * 100) : 0;

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let score = 0;
    const review = items.map((item, index) => {
      const value = form.get(`q${index}`);
      let correct = false;
      let expectedAnswer = "";
      
      if (item.type === "choice" || item.type === "matching") {
        const expected = item.askFor === "term" ? item.card.term : item.card.definition;
        correct = value === expected;
        expectedAnswer = expected;
      } else if (item.type === "trueFalse") {
        correct = (value === "Đúng" && item.isTrue) || (value === "Sai" && !item.isTrue);
        expectedAnswer = item.isTrue ? "Đúng" : "Sai";
      } else {
        const expected = item.askFor === "term" ? item.card.term : item.card.definition;
        correct = normalize(value) === normalize(expected);
        expectedAnswer = expected;
      }

      if (correct) score += 1;
      updateCardProgress(user.id, item.card.id, correct);
      return { term: item.card.term, correct, answer: expectedAnswer };
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
    <>
      <section className="grid grid-cols-[minmax(0,1fr)_320px] gap-5 max-lg:grid-cols-1">
        <div className="glass-panel">
        <div className="mb-6 flex items-end justify-between gap-4 max-lg:grid">
          <div>
            <p className="eyebrow">Test mode</p>
            <h1 className="mb-3 text-3xl md:text-4xl font-black leading-none">Bài kiểm tra từ vựng</h1>
            <p className="muted">Gồm trắc nghiệm 4 đáp án và điền từ. Nộp bài để xem review chi tiết.</p>
          </div>
          <button className="ghost-btn" type="button" onClick={() => setShowSetup(true)}>
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
                      ? item.askFor === "term" ? `Chọn thuật ngữ tiếng Anh cho: “${item.card.definition}”` : `Chọn nghĩa đúng của: “${item.card.term}”`
                      : item.type === "matching"
                      ? item.askFor === "term" ? `Ghép thẻ: Chọn thuật ngữ của “${item.card.definition}”` : `Ghép thẻ: Chọn nghĩa của “${item.card.term}”`
                      : item.type === "trueFalse"
                      ? item.askFor === "term" 
                        ? `Thuật ngữ này của “${item.card.definition}” là Đúng hay Sai?`
                        : `Định nghĩa này của “${item.card.term}” là Đúng hay Sai?`
                      : item.askFor === "term"
                        ? `Điền từ tiếng Anh tương ứng với nghĩa: ${item.card.definition}`
                        : `Điền nghĩa tiếng Việt tương ứng với từ: ${item.card.term}`}
                  </h2>
                </div>
                <span className="icon-tile">{item.type === "write" ? <ClipboardCheck size={20} /> : <FileQuestion size={20} />}</span>
              </div>

              {item.type === "trueFalse" ? (
                <div className="grid gap-3">
                  <div className="mb-4 rounded-card bg-[#f8f9ff] p-4 text-center text-xl font-bold border border-quiz-line">
                    {item.askFor === "term" ? item.matchCard.term : item.matchCard.definition}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {["Đúng", "Sai"].map((option) => {
                      const checked = answers[`q${index}`] === option;
                      return (
                        <label
                          key={option}
                          className={`flex min-h-[58px] cursor-pointer items-center justify-center gap-3 rounded-card border px-4 font-extrabold transition hover:-translate-y-0.5 hover:border-quiz-blue hover:bg-[#f8f9ff] ${
                            checked ? "border-quiz-blue bg-[#eef1ff] shadow-[0_0_0_4px_rgba(66,85,255,0.10)] text-quiz-blue" : "border-quiz-line bg-white"
                          }`}
                        >
                          <input
                            className="hidden"
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
                </div>
              ) : item.type === "matching" ? (
                <div className="grid gap-3">
                  <select 
                    className="input min-h-[54px] text-lg font-bold cursor-pointer"
                    name={`q${index}`}
                    value={answers[`q${index}`] || ""}
                    onChange={(event) => setAnswers((state) => ({ ...state, [`q${index}`]: event.target.value }))}
                  >
                    <option value="" disabled>-- Chọn {item.askFor === "term" ? "thuật ngữ" : "định nghĩa"} phù hợp --</option>
                    {item.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ) : item.type === "choice" ? (
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
                  placeholder={item.askFor === "term" ? "Nhập từ tiếng Anh..." : "Nhập nghĩa tiếng Việt..."}
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
      <TestSetupModal
        open={showSetup}
        set={set}
        maxQuestions={cards.length}
        onClose={() => setShowSetup(false)}
        onStart={(newConfig) => {
          setConfig(newConfig);
          setSeed(Date.now());
          setResult(null);
          setAnswers({});
          setShowSetup(false);
        }}
      />
    </>
  );
}

function TestSetupModal({ open, onClose, onStart, set, maxQuestions }) {
  const [questionCount, setQuestionCount] = useState(Math.min(16, maxQuestions));
  const [answerWith, setAnswerWith] = useState("both");
  const [types, setTypes] = useState({
    trueFalse: false,
    multipleChoice: true,
    matching: false,
    written: true,
  });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05051a]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[24px] bg-[#0a0a2a] p-8 text-white shadow-2xl border border-white/10 animate-scale-in">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-base font-bold text-gray-300">{set.title}</p>
            <h2 className="mt-1 text-4xl font-black">Thiết lập bài kiểm tra</h2>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Câu hỏi (tối đa {maxQuestions})</span>
            <input 
              type="number" 
              className="w-24 rounded-lg bg-white/10 p-3 text-center text-lg font-bold text-white outline-none transition focus:bg-white/20 focus:ring-2 focus:ring-quiz-blue"
              value={questionCount}
              min={1}
              max={maxQuestions}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Trả lời bằng</span>
            <select 
              className="rounded-lg bg-white/10 p-3 text-lg font-bold text-white outline-none transition focus:bg-white/20 focus:ring-2 focus:ring-quiz-blue appearance-none min-w-[120px] text-center"
              value={answerWith}
              onChange={(e) => setAnswerWith(e.target.value)}
            >
              <option className="text-black" value="both">Cả hai</option>
              <option className="text-black" value="term">Tiếng Anh</option>
              <option className="text-black" value="definition">Tiếng Việt</option>
            </select>
          </div>

          <hr className="border-white/10 my-6" />

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Đúng/Sai</span>
            <Toggle checked={types.trueFalse} onChange={(v) => setTypes({...types, trueFalse: v})} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Trắc nghiệm</span>
            <Toggle checked={types.multipleChoice} onChange={(v) => setTypes({...types, multipleChoice: v})} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Ghép thẻ</span>
            <Toggle checked={types.matching} onChange={(v) => setTypes({...types, matching: v})} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Tự luận</span>
            <Toggle checked={types.written} onChange={(v) => setTypes({...types, written: v})} />
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              className="rounded-xl bg-quiz-blue px-8 py-4 text-lg font-bold text-white transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-quiz-blue/30"
              onClick={() => onStart({ questionCount, answerWith, types })}
            >
              Bắt đầu làm kiểm tra
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-quiz-blue' : 'bg-gray-500'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}
