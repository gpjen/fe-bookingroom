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

// Register Font for Chinese support using Google Fonts CDN
Font.register({
  family: "Noto Sans SC",
  src: "https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPzS5HE.ttf",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Noto Sans SC", // Apply global font
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  content: {
    flexDirection: "row",
    marginTop: 20,
  },
  leftCol: {
    flex: 2,
    paddingRight: 20,
  },
  rightCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 2,
    marginTop: 10,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 5,
    fontWeight: "bold",
  },
  qrCode: {
    width: 150,
    height: 150,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  bilingual: {
    fontSize: 10,
    color: "#64748b",
    // fontStyle: "italic", // Noto Sans SC standard font doesn't always support italic properly
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
  const buildingName = occupant.buildingId || "Main Building"; // Mock lookup if needed
  const roomName = occupant.roomId || "N/A";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BOOKING ROOM</Text>
            <Text style={styles.headerSubtitle}>Electronic Entry Ticket</Text>
          </View>
          <View>
            <Text style={{ fontSize: 10, textAlign: "right" }}>Code</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>
              {booking.bookingCode}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.content}>
          <View style={styles.leftCol}>
            <Text style={styles.label}>Visitor Name / 访客姓名</Text>
            <Text style={styles.value}>{occupant.name}</Text>

            <Text style={styles.label}>Type / 类型</Text>
            <Text style={styles.value}>
              {occupant.type === "employee"
                ? "Employee / 员工"
                : "Guest / 访客"}
            </Text>

            <Text style={styles.label}>Location / 地点</Text>
            <Text style={styles.value}>
              Building: {buildingName}, Room: {roomName}
            </Text>

            <Text style={styles.label}>Check-In Date / 入住日期</Text>
            <Text style={styles.value}>
              {format(occupant.inDate, "dd MMMM yyyy", { locale: id })}
            </Text>

            <Text style={styles.label}>Duration / 时长</Text>
            <Text style={styles.value}>{occupant.duration} Days / 天</Text>
          </View>

          <View style={styles.rightCol}>
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} style={styles.qrCode} />
            ) : (
              <Text>Loading QR...</Text>
            )}
            <Text style={{ fontSize: 10, marginTop: 5 }}>Scan to Check-In</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Please show this ticket to the security officer at the entrance.
          </Text>
          <Text style={styles.bilingual}>请在入口处向保安人员出示此票。</Text>
          <Text style={[styles.footerText, { marginTop: 5 }]}>
            Generated at {format(new Date(), "dd MMMM yyyy HH:mm")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
