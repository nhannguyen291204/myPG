import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Images,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Header from "../components/Header";
import Button from "../components/Button";
import {
  CHECK_IMAGE_QUEUE,
  QC_DECISION_LABEL,
  clearCheckImageReviews,
  createUploadedCheckItems,
  loadCheckImageReviews,
  saveCheckImageReview,
} from "../lib/checkImage";
import type { CheckImageItem, CheckLabel, MockBox, QcDecision } from "../lib/checkImage";

const labelClass: Record<CheckLabel, string> = {
  GOOD: "border-pass/30 bg-pass/10 text-pass",
  NG: "border-reject/30 bg-reject/10 text-reject",
};

const decisionClass: Record<QcDecision, string> = {
  accept_image: "border-pass bg-pass/10 text-pass",
  edit_image: "border-recheck bg-recheck/10 text-recheck",
};

const decisionIcon: Record<QcDecision, typeof Check> = {
  accept_image: Check,
  edit_image: PencilLine,
};

function LabelBadge({ label }: { label: CheckLabel }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${labelClass[label]}`}>
      {label}
    </span>
  );
}

function cloneBoxes(boxes: MockBox[]): MockBox[] {
  return boxes.map((box) => ({ ...box }));
}

function nextDecision(boxes: MockBox[]): QcDecision {
  return boxes.length > 0 ? "edit_image" : "accept_image";
}

const folderUploadProps = {
  webkitdirectory: "",
  directory: "",
} as InputHTMLAttributes<HTMLInputElement>;

export default function CheckImage() {
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadedUrlsRef = useRef<string[]>([]);
  const [queue, setQueue] = useState<CheckImageItem[]>(CHECK_IMAGE_QUEUE);
  const [sourceName, setSourceName] = useState("Repository dataset");
  const [index, setIndex] = useState(0);
  const [boxes, setBoxes] = useState<MockBox[]>(() => cloneBoxes(CHECK_IMAGE_QUEUE[0].boxes));
  const [decision, setDecision] = useState<QcDecision>(() => nextDecision(CHECK_IMAGE_QUEUE[0].boxes));
  const [note, setNote] = useState("");
  const [reviews, setReviews] = useState(() => loadCheckImageReviews());
  const item = queue[index];

  const reviewedIds = useMemo(() => new Set(reviews.map((r) => r.id)), [reviews]);
  const savedCurrent = reviewedIds.has(item.id);
  const completedCount = queue.filter((it) => reviewedIds.has(it.id)).length;
  const progress = Math.round((completedCount / queue.length) * 100);
  const isLastImage = index >= queue.length - 1;

  function releaseUploadedUrls() {
    uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    uploadedUrlsRef.current = [];
  }

  function goTo(nextIndex: number, nextQueue = queue) {
    const safeIndex = Math.min(Math.max(nextIndex, 0), nextQueue.length - 1);
    const next = nextQueue[safeIndex];
    if (!next) return;
    setIndex(safeIndex);
    setBoxes(cloneBoxes(next.boxes));
    setDecision(nextDecision(next.boxes));
    setNote("");
  }

  function loadQueue(nextQueue: CheckImageItem[], nextSourceName: string) {
    if (!nextQueue.length) return;
    clearCheckImageReviews();
    setReviews([]);
    setQueue(nextQueue);
    setSourceName(nextSourceName);
    goTo(0, nextQueue);
  }

  function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const uploaded = createUploadedCheckItems(files);
    if (!uploaded.length) return;
    releaseUploadedUrls();
    uploadedUrlsRef.current = uploaded.map((it) => it.imageUrl);
    loadQueue(uploaded, `Uploaded dataset (${uploaded.length} images)`);
  }

  function save() {
    saveCheckImageReview({
      id: item.id,
      imageUrl: item.imageUrl,
      actualLabel: item.actualLabel,
      predictedLabel: item.predictedLabel,
      confidence: item.confidence,
      decision,
      boxes,
      note: note.trim(),
      finalStatus: "completed",
      reviewedAt: new Date().toISOString(),
    });
    setReviews(loadCheckImageReviews());
  }

  function next() {
    if (!isLastImage) goTo(index + 1);
  }

  function resetDemo() {
    releaseUploadedUrls();
    clearCheckImageReviews();
    loadQueue(CHECK_IMAGE_QUEUE, "Repository dataset");
  }

  function removeBox(id: string) {
    setBoxes((current) => current.filter((box) => box.id !== id));
    setDecision("edit_image");
  }

  function addBox() {
    const offset = boxes.length * 5;
    setBoxes((current) => [
      ...current,
      {
        id: `${item.id}-manual-${Date.now()}`,
        label: "defect",
        x: Math.min(68, 34 + offset),
        y: Math.min(62, 30 + offset),
        w: 22,
        h: 18,
      },
    ]);
    setDecision("edit_image");
  }

  return (
    <div>
      <Header
        title="Check Image"
        subtitle="Pending annotation review"
        right={
          <button
            type="button"
            onClick={resetDemo}
            aria-label="Reset demo"
            className="rounded-lg p-2 active:bg-white/10"
          >
            <RotateCcw size={18} />
          </button>
        }
      />

      <div className="p-4 lg:mx-auto lg:max-w-5xl lg:p-6">
        <div className="mb-4 rounded-xl border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Check progress</span>
            <span className="text-gray-400">
              {completedCount}/{queue.length} completed
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-navy-600" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="mb-4 rounded-xl border border-line bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Images size={17} className="text-navy-600" />
                Dataset Source
              </div>
              <p className="mt-1 truncate text-xs text-gray-400">
                {sourceName} · image {index + 1}/{queue.length}
              </p>
            </div>
            <Button variant="outline" onClick={() => uploadRef.current?.click()}>
              <UploadCloud size={18} />
              Upload folder
            </Button>
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            {...folderUploadProps}
            onChange={onUpload}
          />
        </section>

        <div className="lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-start lg:gap-6">
          <section className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p className="text-xs text-gray-400">
                  Pending image · {index + 1}/{queue.length}
                </p>
                <h2 className="text-sm font-medium text-gray-800">{item.id}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-recheck/10 px-2.5 py-1 text-xs font-medium text-recheck">
                  Pending
                </span>
                {savedCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pass/10 px-2.5 py-1 text-xs font-medium text-pass">
                    <Check size={13} />
                    Completed
                  </span>
                )}
              </div>
            </div>

            <div className="relative flex aspect-[4/3] items-center justify-center bg-surface">
              <img src={item.imageUrl} alt={item.id} className="h-full w-full object-contain" />
              {boxes.map((box) => (
                <div
                  key={box.id}
                  className="absolute border-2 border-reject bg-reject/10"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 rounded bg-reject px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {box.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <aside className="mt-4 space-y-4 lg:mt-0">
            <section className="rounded-xl border border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardCheck size={18} className="text-navy-600" />
                <h2 className="text-sm font-medium text-gray-800">Annotation Result</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface p-3">
                  <p className="mb-1 text-xs text-gray-400">Model Label</p>
                  <LabelBadge label={item.predictedLabel} />
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <p className="mb-1 text-xs text-gray-400">Dataset Label</p>
                  <LabelBadge label={item.actualLabel} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-gray-400">Bounding Boxes</p>
                  <p className="mt-1 text-lg font-medium text-gray-800">{boxes.length}</p>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-gray-400">Confidence</p>
                  <p className="mt-1 text-lg font-medium text-gray-800">
                    {Math.round(item.confidence * 100)}%
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-gray-800">QC Action</h2>
              <div className="grid gap-2">
                {(Object.keys(QC_DECISION_LABEL) as QcDecision[]).map((value) => {
                  const Icon = decisionIcon[value];
                  const selected = decision === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDecision(value)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        selected ? decisionClass[value] : "border-line hover:bg-surface"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon size={17} />
                        {QC_DECISION_LABEL[value]}
                      </span>
                      {selected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>

              {decision === "edit_image" && (
                <div className="mt-4 rounded-lg border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Remove / Add boxes</span>
                    <button
                      type="button"
                      onClick={addBox}
                      className="inline-flex items-center gap-1 rounded-lg bg-navy-600 px-2.5 py-1.5 text-xs font-medium text-white"
                    >
                      <Plus size={13} />
                      Add
                    </button>
                  </div>
                  {boxes.length === 0 ? (
                    <p className="rounded-lg bg-surface p-2 text-xs text-gray-400">
                      No bounding boxes in finalised image.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {boxes.map((box, idx) => (
                        <div
                          key={box.id}
                          className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-2"
                        >
                          <span className="text-xs text-gray-600">
                            Box {idx + 1} · {box.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeBox(box.id)}
                            className="rounded-md p-1 text-reject active:bg-reject/10"
                            aria-label={`Remove box ${idx + 1}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <label className="mt-4 block text-xs font-medium text-gray-500">QC note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Optional note for finalised image"
                className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-navy-600"
              />

              <div className="mt-4 flex gap-2.5">
                <Button className="flex-1" onClick={save}>
                  <Save size={18} />
                  Submit
                </Button>
                <Button variant="outline" className="flex-1" onClick={next} disabled={isLastImage}>
                  {isLastImage ? "Last image" : "Next"}
                  <ArrowRight size={18} />
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
