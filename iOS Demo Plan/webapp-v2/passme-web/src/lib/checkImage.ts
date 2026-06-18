export type CheckLabel = "GOOD" | "NG";
export type QcDecision = "accept_image" | "edit_image";

export type MockBox = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CheckImageItem = {
  id: string;
  imageUrl: string;
  actualLabel: CheckLabel;
  predictedLabel: CheckLabel;
  confidence: number;
  status: "pending";
  boxes: MockBox[];
};

export type CheckImageReview = {
  id: string;
  imageUrl: string;
  actualLabel: CheckLabel;
  predictedLabel: CheckLabel;
  confidence: number;
  decision: QcDecision;
  boxes: MockBox[];
  note: string;
  finalStatus: "completed";
  reviewedAt: string;
};

const K_REVIEWS = "passme.checkImage.reviews";

export const QC_DECISION_LABEL: Record<QcDecision, string> = {
  accept_image: "Accept Image",
  edit_image: "Edit Image",
};

const DATASET_FILES: { label: CheckLabel; path: string }[] = [
  { label: "GOOD", path: "Good samples/2aOboQbNYSkSPUQeCHu6E2VWyiANyDOABaWfzpKq.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYSl0SzbxFC8m2l9sJrIcq8m19l9Gp2xc.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYY7UNYiKcmpbL20dLMn2teCOxRNkgdpQ.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYY7UNYiKcmpbL22k0SDMW0MVLV4oMSUS.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYY7UNYiKcmpbL23kIpVWb0HmJOycZ76e.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYstfjbGUaDbeLUFfBYd3rlmt7jhQ6l60.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYwPp1uYDCjJnnYf9wfSOXyMrzPh7r0im.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYwPp1uYDCjJnnYfUmHktRSs2xG3ZK4wq.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYwPp1uYDCjJnnYiwSWXOjlEiXSWZ0jlw.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNYwQ3cqCUDyYwrZwPx9yRXDdXygt6sQYC.jpg" },
  { label: "GOOD", path: "Good samples/2aOboQbNanvlpN3U2nagi2G1Z8tWcenFuWCnfhw0.jpg" },
  { label: "GOOD", path: "Good samples/Image (11).jpg" },
  { label: "GOOD", path: "Good samples/Image (12).jpg" },
  { label: "GOOD", path: "Good samples/Image (13).jpg" },
  { label: "GOOD", path: "Good samples/Image (9).jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUsN1qptLoIELPkF5HurDPyWDiYrbjwHo.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUsV4XGv3zrPVSqK959ODmT5BKV9iGDKK.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUt2Zyx2nrBqeMhCiQaVsMIFf9c5YQvtQ.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUt3x7i04TSRKuUdMluU6ou66oNNHZhdA.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUt4mCxm22onLdZQf5gQQ82NMs947EmQq.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUtXvdRNh26DHq0ZxUXj59V7VZ6eoIWSe.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUtebB7S8bOnlLJFNDDlCTXwcQkVVj3z6.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUu7A7Gw72Z6psgtaLvTcveQf5ZTMxOEK.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUu7A7Gw72Z6psguA65CKY54MNlNMWKWm.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUvcEGCPIz6LyCCmu8F41lSRxk5oikpvM.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUvcEGCPIz6LyCCoeFr37gN7I1Mhbl7MO.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUvihdllr2MZUTosIzdbLlCC4VHGlPnHs.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUxIF6MaGMZSP1lBg1LENxAP3skq5CKqe.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUxIW87Aut1Zjw7RBwBSpxdeJY27HNwfo.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUyLUWkSgQt05qIOwPbZKI6oVXuOn3Fsu.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNUydm7dFKzeJ7DMiSRLqi0Xh3blZHgtxw.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNV100RsaByXt6LbEowHpH3mzBrbCLyOOW.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNV102shWZTklIBwDTXL3VmcLfjkUje7Ky.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNV10Om5zz0cd0myI7ZvpPwm6SqvKHZTea.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNV10Tdjsk12NOTe2QE1WkenaBamcf0Sqe.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNV12HXXCBAaaBJ9NBpoGDaJK5qgTxs0fo.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNV1ACvVOkqX8lpElEI30Un5qxm9KdgbR2.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNV1AMenAGrMdXCaMCpY2ej6NqNJZ73FR2.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNW7I2NNGWtF8Dh5LcSlvDk1f3X13dKRI8.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNYRm4czJEXik65IqWvSAoS8LOYoqTjwRc.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNYRo9YXDKDj4DpAMMcj1lIczVkegin5vc.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNYT6T6QfJZmFGn8GOWuzUvBToIHvNMLNw.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNYT7RuyCn9y62tYhZDOuDFzjGmEFonaTo.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNYwQ3cqCUDyYwra4JBqlL0EG8i9Ykw5OC.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNanvlpN3U2nagi2OoAk5cyj3BKE1lY4uW.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNcNffYdwyoVZnF5OJGNWBfCWhd0dF7L1M.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNcQAgmwCkXuwZSp62x0Ko6BW6PdgIHXiy.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNeOTTjII6JCGUgdjQMxgWFsgPSXkMefyq.jpg" },
  { label: "NG", path: "NG samples/2aOboQbNeVlpFxyaQ9AvqdfN0t6w6zfIBvUDOCiO.jpg" },
];

function itemId(path: string, index: number): string {
  const name = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "image";
  return `${String(index + 1).padStart(2, "0")}-${name}`;
}

function mockBoxes(label: CheckLabel, id: string, index: number): MockBox[] {
  if (label === "GOOD") return [];
  return [
    {
      id: `${id}-box-1`,
      label: "defect",
      x: 28 + ((index * 7) % 34),
      y: 24 + ((index * 5) % 28),
      w: 18 + (index % 4),
      h: 16 + (index % 5),
    },
  ];
}

function mockConfidence(index: number): number {
  return Math.round((0.82 + ((index % 9) * 0.015)) * 100) / 100;
}

function makeItem(path: string, label: CheckLabel, index: number, imageUrl: string): CheckImageItem {
  const id = itemId(path, index);
  return {
    id,
    imageUrl,
    actualLabel: label,
    predictedLabel: label,
    confidence: mockConfidence(index),
    status: "pending",
    boxes: mockBoxes(label, id, index),
  };
}

export const CHECK_IMAGE_QUEUE: CheckImageItem[] = DATASET_FILES.map((file, index) =>
  makeItem(
    file.path,
    file.label,
    index,
    encodeURI(`/check-image-dataset/${file.path}`),
  ),
);

export function createUploadedCheckItems(files: File[]): CheckImageItem[] {
  return files
    .filter((file) => file.type.startsWith("image/"))
    .map((file, index) => {
      const path = file.webkitRelativePath || file.name;
      const lower = path.toLowerCase();
      const label: CheckLabel =
        lower.includes("ng") || lower.includes("bad") || lower.includes("defect") ? "NG" : "GOOD";
      return makeItem(path, label, index, URL.createObjectURL(file));
    });
}

export function loadCheckImageReviews(): CheckImageReview[] {
  try {
    const raw = localStorage.getItem(K_REVIEWS);
    return raw ? (JSON.parse(raw) as CheckImageReview[]) : [];
  } catch {
    return [];
  }
}

export function saveCheckImageReview(review: CheckImageReview): void {
  const list = loadCheckImageReviews();
  const next = [review, ...list.filter((it) => it.id !== review.id)];
  try {
    localStorage.setItem(K_REVIEWS, JSON.stringify(next));
  } catch (e) {
    console.warn("[check-image] không ghi được review", e);
  }
}

export function clearCheckImageReviews(): void {
  try {
    localStorage.removeItem(K_REVIEWS);
  } catch {
    /* bỏ qua */
  }
}
