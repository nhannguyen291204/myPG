import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import Header from "../components/Header";
import VerdictBadge from "../components/VerdictBadge";
import TamuCounts from "../components/TamuCounts";
import DetectionRow from "../components/DetectionRow";
import { getInspection } from "../lib/storage";
import { dateLabel, timeLabel } from "../lib/format";
import type { Inspection } from "../types";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right text-gray-800">{value}</span>
    </div>
  );
}

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // undefined = đang tải; null = không tìm thấy / không có quyền (RLS chặn)
  const [item, setItem] = useState<Inspection | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return; // không có id -> để render xử lý (không setState đồng bộ trong effect)
    let alive = true;
    getInspection(id)
      .then((x) => {
        if (alive) setItem(x ?? null);
      })
      .catch(() => {
        if (alive) setItem(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!id || item === null) {
    return (
      <div>
        <Header title="Chi tiết" onBack={() => navigate(-1)} />
        <p className="p-6 text-center text-sm text-gray-500">
          Không tìm thấy bản ghi, hoặc bạn không có quyền xem.
        </p>
      </div>
    );
  }

  if (item === undefined) {
    return (
      <div>
        <Header title="Chi tiết kiểm tra" onBack={() => navigate(-1)} />
        <div className="mt-16 flex justify-center">
          <LoaderCircle className="animate-spin text-navy-600" size={28} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Chi tiết kiểm tra" onBack={() => navigate(-1)} />
      <div className="p-4 lg:mx-auto lg:max-w-2xl lg:p-6">
        <div className="flex items-center justify-between">
          <VerdictBadge verdict={item.verdict} size="lg" />
          <span className="text-xs text-gray-400">{Math.round(item.inferenceMs)}ms</span>
        </div>

        <img
          src={item.annotatedImage}
          alt="Ảnh đã đánh dấu lỗi"
          className="mt-4 w-full rounded-xl border border-line bg-surface object-contain"
        />

        <div className="mt-4">
          <h2 className="mb-2 text-sm font-medium text-gray-600">Đếm theo TAMU</h2>
          <TamuCounts counts={item.counts} />
        </div>

        <div className="mt-4">
          <h2 className="mb-2 text-sm font-medium text-gray-600">Chi tiết lỗi ({item.nDefects})</h2>
          {item.detections.length === 0 ? (
            <p className="rounded-lg bg-surface p-3 text-sm text-gray-500">Không phát hiện lỗi nào.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {item.detections.map((d, i) => (
                <DetectionRow key={i} d={d} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-white p-3">
          <MetaRow label="Người kiểm" value={item.userName} />
          <MetaRow
            label="Thời gian"
            value={`${dateLabel(item.createdAt)} ${timeLabel(item.createdAt)}`}
          />
          <MetaRow label="Model" value={item.modelVersion} />
          <MetaRow label="Ngưỡng lúc chạy" value={item.confThreshold.toFixed(2)} />
          <MetaRow label="Kích thước ảnh" value={`${item.imageSize.w}×${item.imageSize.h}`} />
        </div>
      </div>
    </div>
  );
}
