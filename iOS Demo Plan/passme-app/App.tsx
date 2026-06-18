/**
 * PassME — Expo demo app (P&G AI Vision Inspection).
 * Chụp/chọn ảnh sản phẩm -> gửi về backend /detect -> hiển thị ảnh annotate
 * + verdict PASS / RE-CHECK / REJECT + đếm defect theo TAMU.
 *
 * Setup:
 *   npx create-expo-app passme-demo -t expo-template-blank-typescript
 *   cd passme-demo && npx expo install expo-image-picker expo-haptics
 *   (thay App.tsx bằng file này) -> npx expo start  -> mở Expo Go trên iPhone
 *
 * QUAN TRỌNG: đổi BACKEND_URL thành IP LAN của máy chạy backend (cùng hotspot).
 *   Tìm IP: macOS -> System Settings > Wi-Fi > Details, ví dụ 172.20.10.3
 */
import React, { useEffect, useState } from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

const BACKEND_URL = "http://192.168.100.7:8000/detect"; // <-- ĐỔI IP

// Demo safety net: nếu = true và fetch lỗi -> hiển thị kết quả giả (REJECT) thay vì báo lỗi,
// để buổi demo vẫn chạy tiếp dù backend trên Mac chết. Mặc định false để không che bug thật.
const DEMO_FALLBACK = false;

const FALLBACK_RESULT = {
  summary: {
    verdict: "REJECT",
    counts: { T: 0, A: 0, M: 0, U: 1 },
    n_defects: 1,
    image_size: { w: 1280, h: 960 },
    inference_ms: 87,
    total_ms: 142,
  },
  detections: [
    {
      class: "defect",
      confidence: 0.95,
      bbox: [520, 380, 240, 200],
      area: 48000,
      area_ratio: 0.039,
      tamu: "U",
      action: "REJECT",
      color: "#E53935",
    },
  ],
  // Ảnh placeholder 1x1 (fallback không có ảnh annotate thật).
  annotated_image:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
};

const TIMEOUT_MS = 30000;

const VERDICT_COLORS: Record<string, string> = {
  PASS: "#4CAF50", "RE-CHECK": "#FF9800", REJECT: "#E53935",
};

const VERDICT_HAPTIC: Record<string, Haptics.NotificationFeedbackType> = {
  PASS: Haptics.NotificationFeedbackType.Success,
  "RE-CHECK": Haptics.NotificationFeedbackType.Warning,
  REJECT: Haptics.NotificationFeedbackType.Error,
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const verdict = result?.summary?.verdict;
  const counts = result?.summary?.counts ?? {};
  const summary = result?.summary;

  // Rung phản hồi khi có verdict mới (PASS=success, RE-CHECK=warning, REJECT=error).
  useEffect(() => {
    if (!verdict) return;
    const type = VERDICT_HAPTIC[verdict];
    if (type) Haptics.notificationAsync(type).catch(() => {});
  }, [verdict]);

  async function pick(useCamera: boolean) {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Cần quyền truy cập camera/ảnh"); return; }

    const res = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (res.canceled) return;
    await send(res.assets[0].uri);
  }

  async function send(uri: string) {
    setLoading(true); setResult(null);

    // Timeout 30s qua AbortController.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const form = new FormData();
      form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
      const r = await fetch(BACKEND_URL, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      const data = await r.json();

      // Backend báo lỗi (vd: decode ảnh thất bại) -> hiện lỗi, KHÔNG set result.
      if (data?.error) {
        Alert.alert("Lỗi", String(data.error));
        return;
      }
      // HTTP lỗi nhưng không kèm field error.
      if (!r.ok) {
        Alert.alert("Lỗi server", `Backend trả về mã ${r.status}`);
        return;
      }

      setResult(data);
    } catch (e: any) {
      // Lưới an toàn cho demo: thay vì báo lỗi, dùng kết quả giả để chạy tiếp.
      if (DEMO_FALLBACK) {
        setResult(FALLBACK_RESULT);
        return;
      }
      if (e?.name === "AbortError") {
        Alert.alert("Timeout — backend không phản hồi");
      } else {
        // Phân biệt lỗi mạng (không kết nối được) vs lỗi server.
        const msg = String(e?.message ?? e);
        const isNetwork =
          e?.name === "TypeError" || msg.includes("Network request failed");
        if (isNetwork) {
          Alert.alert(
            "Lỗi mạng",
            "Không kết nối được tới backend. Kiểm tra iPhone và Mac cùng Wi-Fi, và IP backend đúng."
          );
        } else {
          Alert.alert("Lỗi server", msg);
        }
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>PassME — Vision Inspection</Text>
      <Text style={styles.sub}>P&G AI Vision · demo</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => pick(true)}>
          <Text style={styles.btnText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={() => pick(false)}>
          <Text style={styles.btnText}>Chọn từ thư viện</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 24 }} />}

      {verdict && (
        <View style={[styles.badge, { backgroundColor: VERDICT_COLORS[verdict] ?? "#555" }]}>
          <Text style={styles.badgeText}>{verdict}</Text>
        </View>
      )}

      {summary?.inference_ms != null && (
        <Text style={styles.timeBadge}>Detected in {Math.round(summary.inference_ms)}ms</Text>
      )}

      {result?.annotated_image && (
        <Image source={{ uri: result.annotated_image }} style={styles.image} resizeMode="contain" />
      )}

      {summary && (
        <View style={styles.countBox}>
          <Text style={styles.countTitle}>Defect theo TAMU</Text>
          <Text style={styles.count}>
            T:{counts.T ?? 0}  ·  A:{counts.A ?? 0}  ·  M:{counts.M ?? 0}  ·  U:{counts.U ?? 0}
            {"  "}(tổng {summary.n_defects})
          </Text>
          {summary.image_size?.w != null && summary.image_size?.h != null && (
            <Text style={styles.imageHint}>
              Image {summary.image_size.w}×{summary.image_size.h}
            </Text>
          )}
        </View>
      )}

      {result?.detections?.map((d: any, i: number) => (
        <View key={i} style={[styles.detRow, { borderLeftColor: d.color }]}>
          <Text style={styles.detText}>
            {d.class} · {d.tamu} · {d.action} · conf {(d.confidence * 100).toFixed(0)}%
          </Text>
        </View>
      ))}

      {result && (
        <TouchableOpacity style={styles.retakeBtn} onPress={() => setResult(null)}>
          <Text style={styles.retakeText}>Chụp lại</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 64, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", color: "#1F3864" },
  sub: { color: "#777", marginBottom: 20 },
  row: { flexDirection: "row", gap: 12 },
  btn: { backgroundColor: "#2E5496", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  btnAlt: { backgroundColor: "#5A6B8C" },
  btnText: { color: "#fff", fontWeight: "600" },
  badge: { marginTop: 24, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 24 },
  badgeText: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  timeBadge: { marginTop: 6, fontSize: 12, color: "#999", fontStyle: "italic" },
  image: { width: "100%", height: 320, marginTop: 16, borderRadius: 10, backgroundColor: "#eee" },
  countBox: { marginTop: 16, alignItems: "center" },
  countTitle: { fontWeight: "700", color: "#333" },
  count: { marginTop: 4, fontSize: 16, color: "#333" },
  imageHint: { marginTop: 4, fontSize: 12, color: "#999" },
  detRow: { width: "100%", borderLeftWidth: 5, paddingLeft: 10, paddingVertical: 6, marginTop: 8, backgroundColor: "#f5f5f5", borderRadius: 6 },
  detText: { color: "#333" },
  retakeBtn: {
    marginTop: 20,
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2E5496",
    backgroundColor: "transparent",
  },
  retakeText: { color: "#2E5496", fontWeight: "700" },
});
