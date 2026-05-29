import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore } from "../stores/toastStore";

export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="fixed bottom-5 right-5 z-[60] grid w-[min(380px,calc(100%-32px))] gap-3">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`flex items-start gap-3 rounded-card border bg-white p-4 shadow-[0_18px_60px_rgba(36,43,79,0.22)] animate-toast-in ${toneClass(toast.type)}`}
        >
          <span className="mt-0.5">{toastIcon(toast.type)}</span>
          <div className="min-w-0 flex-1">
            <strong className="block">{toast.title}</strong>
            {toast.description && <p className="muted mt-1 text-sm">{toast.description}</p>}
          </div>
          <button className="grid size-7 place-items-center rounded-full hover:bg-[#eef1ff]" type="button" onClick={() => dismissToast(toast.id)} aria-label="Đóng thông báo">
            <X size={16} />
          </button>
        </article>
      ))}
    </div>
  );
}

function toastIcon(type) {
  if (type === "error") return <XCircle size={22} />;
  if (type === "info") return <Info size={22} />;
  return <CheckCircle2 size={22} />;
}

function toneClass(type) {
  if (type === "error") return "border-[#d94d4d] text-[#a33a3a]";
  if (type === "info") return "border-quiz-blue text-quiz-blue";
  return "border-[#18ae79] text-[#0d7d56]";
}
