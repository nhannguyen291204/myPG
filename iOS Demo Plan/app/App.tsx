/**
 * PassME — Expo demo app (P&G AI Vision Inspection).
 * Chụp/chọn ảnh sản phẩm -> gửi về backend /detect -> hiển thị ảnh annotate
 * + verdict PASS / RE-CHECK / REJECT + đếm defect theo TAMU.
 *
 * Setup:
 *   npx create-expo-app passme-demo -t expo-template-blank-typescript
 *   cd passme-demo && npx expo install expo-image-picker
 *   (thay App.tsx bằng file này) -> npx expo start  -> mở Expo Go trên iPhone
 *
 * QUAN TRỌNG: đổi BACKEND_URL thành IP LAN của máy chạy backend (cùng hotspot).
 *   Tìm IP: macOS -> System Settings > Wi-Fi > Details, ví dụ 172.20.10.3
 */
import React, { useState } from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const BACKEND_URL = "http://172.20.10.3:8000/detect"; // <-- ĐỔI IP

const VERDICT_COLORS: Record<string, string> = {
  PASS: "#4CAF50", "RE-CHECK": "#FF9800", REJECT: "#E53935",
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function pick(useCamera: boolean) {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Cần quyền truy cập camera/ảnh"); return; }

    const res = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (res.canceled) return;
    await send(res.assets[0].uri);
  }

  async function send(uri: string) {
    setLoading(true); setResult(null);
    try {
      const form = new FormData();
      form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
      const r = await fetch(BACKEND_URL, { method: "POST", body: form });
      const data = await r.json();
      setResult(data);
    } catch (e: any) {
      Alert.alert("Lỗi gọi backend", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  const verdict = result?.summary?.verdict;
  const counts = result?.summary?.counts ?? {};

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

      {result?.annotated_image && (
        <Image source={{ uri: result.annotated_image }} style={styles.image} resizeMode="contain" />
      )}

      {result?.summary && (
        <View style={styles.countBox}>
          <Text style={styles.countTitle}>Defect theo TAMU</Text>
          <Text style={styles.count}>
            T:{counts.T ?? 0}  ·  A:{counts.A ?? 0}  ·  M:{counts.M ?? 0}  ·  U:{counts.U ?? 0}
            {"  "}(tổng {result.summary.n_defects})
          </Text>
        </View>
      )}

      {result?.detections?.map((d: any, i: number) => (
        <View key={i} style={[styles.detRow, { borderLeftColor: d.color }]}>
          <Text style={styles.detText}>
            {d.class} · {d.tamu} · {d.action} · conf {(d.confidence * 100).toFixed(0)}%
          </Text>
        </View>
      ))}
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
  image: { width: "100%", height: 320, marginTop: 16, borderRadius: 10, backgroundColor: "#eee" },
  countBox: { marginTop: 16, alignItems: "center" },
  countTitle: { fontWeight: "700", color: "#333" },
  count: { marginTop: 4, fontSize: 16, color: "#333" },
  detRow: { width: "100%", borderLeftWidth: 5, paddingLeft: 10, paddingVertical: 6, marginTop: 8, backgroundColor: "#f5f5f5", borderRadius: 6 },
  detText: { color: "#333" },
});
