import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, ImageDown, Images, LoaderCircle, TriangleAlert } from "lucide-react";
import Header from "../components/Header";
import Button from "../components/Button";
import { detect, ApiError } from "../lib/api";
import { useDraft } from "../lib/draft";
import { loadThreshold } from "../lib/storage";
import { getActiveSelection, listModels, setActiveSelection } from "../lib/training";
import type { ActiveSelection } from "../lib/training";

// className thẻ chọn model (1 trong nhiều)
const cardCls = (selected: boolean) =>
  `flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors ${
    selected ? "border-navy-600 bg-navy-600/5" : "border-line hover:bg-surface"
  }`;

export default function Inspect() {
  const navigate = useNavigate();
  const { setDraft } = useDraft();
  const camRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selection, setSelection] = useState<ActiveSelection>(() => getActiveSelection());
  const threshold = loadThreshold();

  // Model đã train xong (mọi vai trò đều chọn được). "Global (best.pt)" luôn có sẵn.
  const trainedModels = useMemo(() => listModels().filter((m) => m.status === "done"), []);

  function pickModel(sel: "global" | string) {
    setActiveSelection(sel);
    setSelection(getActiveSelection());
  }

  async function run(file: Blob, filename?: string) {
    setError(null);
    setLoading(true);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    try {
      // /detect KHÔNG đổi: luôn gửi ảnh tới backend chạy best.pt.
      // TODO: Khi backend train thật + swap model — gửi kèm model đã chọn (selection)
      //       tới /detect để backend chạy đúng model. Hiện chọn model chỉ là UI.
      const result = await detect(file, filename);
      setDraft({ result, sourcePreview: objectUrl });
      navigate("/result");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Có lỗi không xác định khi gửi ảnh.";
      setError(msg);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setLoading(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset để chọn lại cùng 1 file vẫn trigger onChange
    if (file) void run(file, file.name);
  }

  async function loadSample() {
    setError(null);
    try {
      const res = await fetch("/sample.jpg");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      void run(blob, "sample.jpg");
    } catch {
      setError("Không nạp được ảnh mẫu (thiếu public/sample.jpg).");
    }
  }

  const activeName = selection.type === "global" ? "Global (best.pt)" : selection.model.name;

  return (
    <div>
      <Header title="Kiểm tra" />
      <div className="p-4 lg:mx-auto lg:max-w-4xl lg:p-6">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          {/* Khu chọn model */}
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-700">Model đang dùng</h2>
            <div className="space-y-2">
              {/* Global */}
              <button type="button" onClick={() => pickModel("global")} className={cardCls(selection.type === "global")}>
                <span>
                  <span className="block text-sm font-medium text-gray-800">Global (best.pt)</span>
                  <span className="block text-[11px] text-gray-400">Model gốc — phát hiện nứt</span>
                </span>
                {selection.type === "global" && (
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-navy-600">
                    <Check size={13} /> Đang dùng
                  </span>
                )}
              </button>

              {/* Model đã train */}
              {trainedModels.map((m) => {
                const sel = selection.type === "model" && selection.model.id === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => pickModel(m.id)} className={cardCls(sel)}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800">{m.name}</span>
                      <span className="block text-[11px] text-gray-400">mAP@50 {m.map50?.toFixed(3)}</span>
                    </span>
                    {sel && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-navy-600">
                        <Check size={13} /> Đang dùng
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Đang dùng: <span className="text-gray-600">{activeName}</span> · ngưỡng tin cậy{" "}
              {threshold.toFixed(2)}
            </p>
          </section>

          {/* Khu chụp ảnh */}
          <div className="mt-4 lg:mt-0">
            {/* Khung camera / placeholder */}
            <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-white">
              {preview ? (
                <img src={preview} alt="Ảnh đã chọn" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Camera size={40} />
                  <span className="text-sm">Chụp hoặc chọn ảnh sản phẩm</span>
                </div>
              )}
            </div>

            {/* Lỗi */}
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-reject/30 bg-reject/5 p-3 text-sm text-reject">
                <TriangleAlert size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Nút */}
            <div className="mt-4 flex flex-col gap-2.5">
              <Button onClick={() => camRef.current?.click()} disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Camera size={18} />}
                {loading ? "Đang phân tích…" : "Chụp ảnh"}
              </Button>
              <Button variant="outline" onClick={() => libRef.current?.click()} disabled={loading}>
                <Images size={18} /> Chọn từ thư viện
              </Button>
              <Button variant="secondary" onClick={() => void loadSample()} disabled={loading}>
                <ImageDown size={18} /> Dùng ảnh mẫu
              </Button>
            </div>

            {/* input ẩn — capture=environment mở camera sau trên điện thoại */}
            <input
              ref={camRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={onFile}
            />
            <input ref={libRef} type="file" accept="image/*" hidden onChange={onFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
