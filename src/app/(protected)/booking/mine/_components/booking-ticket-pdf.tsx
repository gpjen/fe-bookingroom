/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type {
  BookingRequest,
  BookingOccupant,
} from "@/app/(protected)/booking/request/_components/types";

// Register Font dengan fallback untuk karakter Mandarin
Font.register({
  family: "Noto Sans",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPzS5HE.ttf",
    },
    {
      src: "https://fonts.gstatic.com/s/notosans/v35/o-0IIpQlx3QUlC5A4PNr5TRF.ttf",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 28,
    fontFamily: "Noto Sans",
  },
  container: {
    flex: 1,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 1,
  },
  companySubtitle: {
    fontSize: 7,
    color: "#6B7280",
    letterSpacing: 0.3,
  },
  bookingCodeContainer: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: "center",
  },
  bookingCodeLabel: {
    fontSize: 7,
    color: "#6B7280",
    marginBottom: 2,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  bookingCode: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
  },
  titleSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: "#6B7280",
  },
  content: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 20,
  },
  infoSection: {
    flex: 1.2,
  },
  qrSection: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  infoCard: {
    marginBottom: 12,
  },
  label: {
    fontSize: 7,
    color: "#1f2636ff",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  value: {
    fontSize: 9,
    color: "#111827",
  },
  valueLarge: {
    fontSize: 11,
    color: "#111827",
    fontWeight: "bold",
  },
  valueChinese: {
    fontSize: 7,
    color: "#575c67ff",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  qrContainer: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  qrCode: {
    width: 120,
    height: 120,
    margin: 1,
    marginBottom: 8,
  },
  qrText: {
    fontSize: 8,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 1.3,
  },
  notesSection: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 6,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  noteItem: {
    marginBottom: 8,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  bullet: {
    fontSize: 8,
    color: "#43474eff",
    marginRight: 6,
    marginTop: 1,
  },
  noteText: {
    fontSize: 8,
    color: "#43474eff",
    lineHeight: 1.4,
    flex: 1,
  },
  noteTextChinese: {
    fontSize: 7,
    color: "#43474eff",
    lineHeight: 1.4,
    marginLeft: 14,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  footerText: {
    fontSize: 7,
    color: "#9CA3AF",
  },
  footerHighlight: {
    fontSize: 7,
    color: "#111827",
    fontWeight: "bold",
  },
});

interface BookingTicketPDFProps {
  booking: BookingRequest;
  occupant: BookingOccupant;
  qrCodeUrl: string;
}

export function BookingTicketPDF({
  booking,
  occupant,
  qrCodeUrl,
}: BookingTicketPDFProps) {
  const buildingName = occupant.buildingName || "Gedung Utama";
  const roomName = occupant.roomCode || "N/A";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image src="/logo_lg.png" style={styles.logo} />
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>HARITA LYGEND</Text>
                <Text style={styles.companySubtitle}>
                  SISTEM BOOKING RUANGAN
                </Text>
              </View>
            </View>
            <View style={styles.bookingCodeContainer}>
              <Text style={styles.bookingCodeLabel}>KODE BOOKING</Text>
              <Text style={styles.bookingCode}>{booking.code}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Tiket Masuk Elektronik</Text>
            <Text style={styles.subtitle}>Tunjukkan tiket ini untuk masuk</Text>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Information Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Text style={styles.label}>Nama / 姓名</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.valueLarge}>{occupant.name}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoCard}>
                <Text style={styles.label}>Tipe / 类型</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>
                    {occupant.type === "employee" ? "Karyawan" : "Tamu"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.label}>Lokasi / 位置</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>
                    {buildingName}, Ruang {roomName}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.label}>Tanggal Check-In / 检查日期</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>
                    {occupant.inDate
                      ? format(occupant.inDate, "EEEE, dd MMMM yyyy", {
                          locale: id,
                        })
                      : "-"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.label}>Durasi / 持续时间</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>{occupant.duration}</Text>
                </View>
              </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                {qrCodeUrl ? (
                  <Image src={qrCodeUrl} style={styles.qrCode} />
                ) : (
                  <Text style={styles.qrText}>Membuat QR Code...</Text>
                )}
                <Text style={styles.qrText}>Pindai untuk Check-In</Text>
              </View>
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.notesSection}>
            <Text style={{ fontSize: 10, marginBottom: 12 }}>
              Catatan / 注意事项
            </Text>

            <View style={styles.noteItem}>
              <View style={styles.noteRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.noteText}>
                  Harap tunjukkan tiket ini kepada petugas keamanan di pintu
                  masuk.
                </Text>
              </View>
              <Text style={styles.noteTextChinese}>
                请在入口处向保安人员出示此票。
              </Text>
            </View>

            <View style={styles.noteItem}>
              <View style={styles.noteRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.noteText}>
                  Tiket ini hanya berlaku untuk tanggal dan waktu yang tertera.
                </Text>
              </View>
              <Text style={styles.noteTextChinese}>
                此票仅在指定日期和时间有效。
              </Text>
            </View>

            <View style={styles.noteItem}>
              <View style={styles.noteRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.noteText}>
                  Jaga tiket ini dengan baik dan jangan dibagikan secara publik.
                </Text>
              </View>
              <Text style={styles.noteTextChinese}>
                请妥善保管此票，不要公开分享。
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Dibuat pada {format(new Date(), "dd MMMM yyyy, HH:mm")}
            </Text>
            <Text style={styles.footerText}>
              <Text style={styles.footerHighlight}>HARITA LYGEND</Text> | Sistem
              Booking
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
