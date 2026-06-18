import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, FileArchive, LoaderCircle, TriangleAlert, UploadCloud } from "lucide-react";
import Header from "../components/Header";
import Button from "../components/Button";
import { advanceJobs, listModels, startTraining } from "../lib/training";
import type { ModelJob } from "../types";

const BASE_MODELS = ["yolov8n", "yolov8s", "yolov8m"];

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function CustomModel() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [models, setModels] = useState<ModelJob[]>(() => listModels());
  // Job vừa tạo (để hiện tiến trình inline). Khi quay lại màn, bắt lại job đang chạy dở nếu có.
  const [currentJobId, setCurrentJobId] = useState<string | null>(
    () => listModels().find((j) => j.status === "queued" || j.status === "running")?.id ?? null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [epochs, setEpochs] = useState(100);
  const [baseModel, setBaseModel] = useState("yolov8n");
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Mô phỏng tiến trình: 1 interval cho cả trang, no-op khi không có job đang chạy.
  useEffect(() => {
    const timer = setInterval(() => {
      setModels((prev) => {
        if (!prev.some((j) => j.status === "queued" || j.status === "running")) return prev;
        return advanceJobs(prev);
      });
    }, 600);
    return () => clearInterval(timer);
  }, []);

  function pickFile(f: File | undefined) {
    setFileError(null);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".zip")) {
      setFileError("Chỉ nhận file .zip (dataset YOLO export từ Roboflow).");
      return;
    }
    setFile(f);
    if (!name.trim()) setName(f.name.replace(/\.zip$/i, "")); // gợi ý tên model
  }

  function onInput(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0]);
    e.target.value = "";
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  const canTrain = !!file && name.trim().length > 0;

  function train() {
    if (!canTrain || !file) return;
    const id = startTraining(file, { name, epochs, baseModel });
    setCurrentJobId(id);
    setModels(listModels());
    setFile(null);
    setName("");
  }

  const currentJob = currentJobId ? (models.find((j) => j.id === currentJobId) ?? null) : null;

  return (
    <div>
      <Header
        title="Model tùy chỉnh"
        onBack={() => navigate(-1)}
        subtitle="Train mô phỏng · backend nối sau"
      />
      <div className="p-4 lg:mx-auto lg:max-w-4xl lg:p-6">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          {/* Cột trái: Tải dataset */}
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-700">1. Tải dataset</h2>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragOver ? "border-navy-600 bg-navy-600/5" : "border-line bg-surface"
              }`}
            >
              {file ? (
                <>
                  <FileArchive size={28} className="text-navy-600" />
                  <div className="mt-1.5 text-sm font-medium text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-400">{fmtSize(file.size)}</div>
                </>
              ) : (
                <>
                  <UploadCloud size={28} className="text-gray-400" />
                  <div className="mt-1.5 text-sm text-gray-600">Kéo-thả hoặc bấm chọn file .zip</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".zip" hidden onChange={onInput} />
            {fileError && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-reject">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                {fileError}
              </div>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
              Dataset phải đã gán nhãn (export từ Roboflow, định dạng YOLOv8: <code>images/</code> +{" "}
              <code>labels/</code> + <code>data.yaml</code>).
            </p>
          </section>

          {/* Cột phải: Cấu hình train + tiến trình inline */}
          <div className="mt-4 space-y-4 lg:mt-0">
            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-gray-700">2. Cấu hình train</h2>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tên model *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: bottle-defect-v1"
                className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-navy-600"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Epochs</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={epochs}
                    onChange={(e) => setEpochs(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-navy-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Base model</label>
                  <select
                    value={baseModel}
                    onChange={(e) => setBaseModel(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-navy-600"
                  >
                    {BASE_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={train} disabled={!canTrain}>
                Bắt đầu train
              </Button>
              {!canTrain && (
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  Cần chọn file .zip và đặt tên model.
                </p>
              )}
            </section>

            {/* Tiến trình train inline (job vừa tạo) */}
            {currentJob && (
              <section className="rounded-xl border border-line bg-white p-4">
                {currentJob.status === "done" ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-pass" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800">
                        Đã train xong: {currentJob.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        mAP@50 {currentJob.map50?.toFixed(3)}
                        {currentJob.durationSec != null ? ` · ${currentJob.durationSec}s` : ""}
                      </div>
                      <Link to="/" className="mt-1 inline-block text-xs font-medium text-navy-600">
                        Chọn dùng model ở màn Kiểm tra →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-gray-800">
                        Đang train: {currentJob.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-navy-600">
                        <LoaderCircle size={12} className="animate-spin" /> {currentJob.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-navy-600 transition-all"
                        style={{ width: `${currentJob.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-gray-400">
          * Train đang ở chế độ mô phỏng (frontend). Giai đoạn sau nối backend train YOLO thật. Model
          đã train được chọn để chạy ở màn Kiểm tra.
        </p>
      </div>
    </div>
  );
}
