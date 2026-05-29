import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({ open, title, description, confirmLabel = "Xóa", cancelLabel = "Hủy", onConfirm, onCancel }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-quiz-ink/35 p-4 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="w-[min(440px,100%)] rounded-card border border-quiz-line bg-white p-5 shadow-[0_28px_90px_rgba(36,43,79,0.28)] animate-scale-in">
        <div className="mb-4 flex items-start justify-between gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-card bg-[#ffe9e9] text-[#d94d4d]">
            <AlertTriangle size={24} />
          </span>
          <button className="icon-btn" type="button" onClick={onCancel} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="muted mt-2 leading-7">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="ghost-btn" type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className="danger-btn" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
