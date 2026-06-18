import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, LoaderCircle, RotateCcw, Save } from "lucide-react";
import Header from "../components/Header";
import Button from "../components/Button";
import VerdictBadge from "../components/VerdictBadge";
import TamuCounts from "../components/TamuCounts";
import DetectionRow from "../components/DetectionRow";
import { useDraft } from "../lib/draft";
import { useAuth } from "../lib/auth";
import { saveInspection, loadThreshold } from "../lib/storage";
import { genId } from "../lib/format";
import { MODEL_VERSION } from "../constants";
import type { Inspection } from "../types";

// Rung phản hồi theo verdict (iOS Safari bỏ qua êm vì không hỗ trợ Vibration API).
const VIBRATE: Record<string, number[]> = {
  PASS: [60],
  "RE-CHECK": [40, 40, 40],
  REJECT: [120, 60, 120],
};

export default function Result() {
  const { result, clearDraft } = useDraft();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verdict = result?.summary.verdict;
  useEffect(() => {
    if (verdict && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(VIBRATE[verdict] ?? []);
    }
  }, [verdict]);

  // Không có dữ liệu (vd reload trang) -> quay về màn Kiểm tra.
  if (!result) return <Navigate to="/" replace />;

  const s = result.summary;

  function retake() {
    clearDraft();
    navigate("/");
  }

  // Lưu = upload ảnh lên Supabase Storage + insert hàng inspections (async).
  async function save() {
    if (saving || saved || !user || !result) return;
    setError(null);
    setSaving(true);
    const item: Inspection = {
      id: genId(),
      createdAt: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      verdict: s.verdict,
      counts: s.counts,
      nDefects: s.n_defects,
      detections: result.detections,
      annotatedImage: result.annotated_image,
      modelVersion: MODEL_VERSION,
      confThreshold: loadThreshold(),
      inferenceMs: s.inference_ms,
      imageSize: s.image_size,
    };
    try {
      await saveInspection(item);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại. Thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Header title="Kết quả" onBack={retake} />
      <div className="p-4 lg:mx-auto lg:max-w-2xl lg:p-6">
        {/* Verdict lớn */}
        <div className="flex flex-col items-center">
          <VerdictBadge verdict={s.verdict} size="lg" />
          <p className="mt-2 text-xs text-gray-400">
            Phát hiện trong {Math.round(s.inference_ms)}ms
          </p>
        </div>

        {/* Ảnh annotate */}
        <img
          src={result.annotated_image}
          alt="Ảnh đã đánh dấu lỗi"
          className="mt-4 w-full rounded-xl border border-line bg-surface object-contain"
        />

        {/* TAMU */}
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-medium text-gray-600">Đếm theo TAMU</h2>
          <TamuCounts counts={s.counts} />
        </div>

        {/* Danh sách lỗi */}
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-medium text-gray-600">Chi tiết lỗi ({s.n_defects})</h2>
          {result.detections.length === 0 ? (
            <p className="rounded-lg bg-surface p-3 text-sm text-gray-500">Không phát hiện lỗi nào.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {result.detections.map((d, i) => (
                <DetectionRow key={i} d={d} />
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-reject/30 bg-reject/5 p-2.5 text-sm text-reject">
            {error}
          </div>
        )}

        {/* Nút */}
        <div className="mt-5 flex gap-2.5">
          <Button variant="outline" className="flex-1" onClick={retake} disabled={saving}>
            <RotateCcw size={18} /> Chụp lại
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving || saved}>
            {saved ? (
              <Check size={18} />
            ) : saving ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {saved ? "Đã lưu" : saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
        {saved && (
          <button
            type="button"
            onClick={() => navigate("/history")}
            className="mt-3 w-full text-center text-sm text-navy-600"
          >
            Xem trong Lịch sử →
          </button>
        )}
      </div>
    </div>
  );
}
