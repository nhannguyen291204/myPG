import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { DetectResponse } from "../types";

// Giữ tạm kết quả /detect để chuyển từ màn Kiểm tra -> Kết quả (không qua localStorage).
type Draft = {
  result: DetectResponse | null;
  sourcePreview: string | null; // objectURL ảnh gốc (chỉ để xem lại, không lưu)
};

type DraftValue = Draft & {
  setDraft: (d: Draft) => void;
  clearDraft: () => void;
};

const DraftContext = createContext<DraftValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>({ result: null, sourcePreview: null });

  function setDraft(d: Draft) {
    setDraftState(d);
  }
  function clearDraft() {
    setDraftState({ result: null, sourcePreview: null });
  }

  return (
    <DraftContext.Provider value={{ ...draft, setDraft, clearDraft }}>
      {children}
    </DraftContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDraft(): DraftValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft phải nằm trong <DraftProvider>");
  return ctx;
}
