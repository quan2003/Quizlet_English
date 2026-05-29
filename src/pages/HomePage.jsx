import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileUp, LibraryBig, Play, Sparkles } from "lucide-react";
import SetCard from "../ui/SetCard";
import { useAuthStore } from "../stores/authStore";
import { useProgressStore } from "../stores/progressStore";
import { useSetsStore } from "../stores/setsStore";
import { useToastStore } from "../stores/toastStore";
import { extractPdfText, inferSetTitle, parseCards } from "../utils/study";

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const sets = useSetsStore((state) => state.sets);
  const cards = useSetsStore((state) => state.cards);
  const createSet = useSetsStore((state) => state.createSet);
  const progress = useProgressStore((state) => state.progress);
  const pushToast = useToastStore((state) => state.pushToast);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const visibleSets = sets.filter((set) => set.owner_id === user.id || set.is_public || !set.owner_id);
  const visibleSetIds = new Set(visibleSets.map((set) => set.id));
  const visibleCards = cards.filter((card) => visibleSetIds.has(card.set_id));
  const visibleCardIds = new Set(visibleCards.map((card) => card.id));
  const mastered = progress.filter((item) => visibleCardIds.has(item.card_id) && item.mastery_level === 2).length;
  const recentSet = visibleSets[0];
  const recentCards = recentSet ? visibleCards.filter((card) => card.set_id === recentSet.id).slice(0, 5) : [];

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMessage(`Đang đọc ${file.name}...`);

    try {
      const text = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
        ? await extractPdfText(file)
        : await file.text();
      const rows = parseCards(text);
      if (!rows.length) {
        setMessage("Chưa parse được card nào. Hãy thử export Quizlet dạng TSV/CSV hoặc PDF có text.");
        pushToast({
          title: "Không đọc được thẻ",
          description: "File chưa có dữ liệu hợp lệ. Hãy thử PDF có text hoặc CSV/TSV.",
          type: "error"
        });
        return;
      }
      const title = inferSetTitle(text, file.name.replace(/\.[^.]+$/, "") || "Quizlet Import");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `quizlet-import-${Date.now()}`;
      const created = createSet({
        title,
        description: `${rows.length} thẻ từ file Quizlet`,
        share_slug: slug,
        is_public: false,
        rows,
        owner_id: user.id
      });
      pushToast({
        title: "Import thành công",
        description: `Đã tạo bộ "${title}" với ${rows.length} thẻ.`,
        type: "success"
      });
      navigate(`/study/${created.share_slug}`);
    } catch (error) {
      setMessage(`Không đọc được file: ${error.message}`);
      pushToast({
        title: "Import thất bại",
        description: error.message,
        type: "error"
      });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <section className="grid grid-cols-[minmax(0,1.35fr)_390px] gap-5 max-lg:grid-cols-1">
        <div className="glass-panel">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Thư viện học tập</p>
              <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-none tracking-normal">Ôn IELTS bằng flashcard, test và match</h1>
              <p className="muted mt-3 max-w-2xl text-lg">Upload file Quizlet PDF, mở bộ thẻ, học ngay bằng các chế độ luyện tập.</p>
            </div>
          </div>

          {recentSet ? (
            <div className="rounded-card border border-quiz-line bg-gradient-to-br from-[#f8f9ff] to-white p-4">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="badge"><Sparkles size={14} /> Đang học</span>
                  <h2 className="mt-3 line-clamp-2 text-3xl font-black leading-tight">{recentSet.title}</h2>
                  <p className="muted line-clamp-2">{recentSet.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link className="ghost-btn" to={`/study/${recentSet.share_slug}/flashcards`}>Flashcard</Link>
                  <Link className="primary-btn" to={`/study/${recentSet.share_slug}/test`}><Play size={17} /> Test</Link>
                </div>
              </div>
              <div className="grid gap-2 rounded-card border border-quiz-line bg-white/70 p-2">
                {recentCards.map((card) => (
                  <div key={card.id} className="grid grid-cols-[1fr_1.2fr] gap-4 rounded-card bg-white p-3 shadow-[0_1px_0_rgba(36,43,79,0.05)] max-md:grid-cols-1">
                    <strong>{card.term}</strong>
                    <span className="muted">{card.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[300px] place-items-center rounded-card border border-dashed border-quiz-line bg-gradient-to-br from-[#f8f9ff] to-white p-6 text-center">
              <div>
                <span className="mx-auto mb-4 grid size-16 place-items-center rounded-card bg-[#eef1ff] text-quiz-blue"><LibraryBig size={32} /></span>
                <h2 className="text-3xl font-black">Chưa có bộ thẻ nào</h2>
                <p className="muted mt-2">Upload PDF export từ Quizlet hoặc tạo set mới để bắt đầu ôn tập.</p>
              </div>
            </div>
          )}
        </div>

        <aside className="glass-panel">
          <p className="eyebrow">Import từ Quizlet</p>
          <h2 className="text-2xl font-black">Upload PDF, CSV hoặc TSV</h2>
          <p className="muted mb-4">Chọn file export từ Quizlet. App sẽ đọc text và tạo set mới để bạn ôn ngay.</p>
          <label className="grid min-h-[190px] cursor-pointer place-items-center rounded-card border-2 border-dashed border-quiz-blue/30 bg-[#eef1ff] p-5 text-center font-black transition hover:-translate-y-0.5 hover:border-quiz-blue hover:bg-white">
            <input className="sr-only" type="file" accept=".pdf,.csv,.tsv,.txt,application/pdf,text/*" onChange={handleFile} />
            <span className="grid justify-items-center gap-3">
              <span className="grid size-14 place-items-center rounded-full bg-white text-quiz-blue shadow-[0_8px_22px_rgba(66,85,255,0.15)]"><FileUp size={28} /></span>
              <span>{importing ? "Đang xử lý..." : "Bấm để upload file"}</span>
              <small className="muted block">PDF có text, CSV hoặc TSV</small>
            </span>
          </label>
          {message && <p className="mt-3 text-sm font-bold text-quiz-muted">{message}</p>}
        </aside>
      </section>

      {visibleSets.length > 0 && (
        <>
          <section className="mt-5 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
            <Stat value={visibleSets.length} label="bộ thẻ" />
            <Stat value={visibleCards.length} label="thẻ" />
            <Stat value={mastered} label="đã thuộc" />
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Tất cả bộ thẻ</h2>
                <p className="muted">Mở bộ thẻ để học Flashcard, Learn, Test hoặc Match.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
              {visibleSets.map((set) => <SetCard key={set.id} set={set} />)}
            </div>
          </section>
        </>
      )}

      {visibleSets.length === 0 && (
        <section className="mt-5 rounded-card border border-quiz-line bg-white/70 p-4 text-center text-sm font-bold text-quiz-muted">
          Sau khi upload file Quizlet, thống kê và danh sách bộ thẻ sẽ xuất hiện tại đây.
        </section>
      )}
    </>
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
