// Re-export main component for backward compatibility
export { RoomDetailSheet } from "./room-detail-sheet";
export type { RoomDetailSheetProps } from "./room-detail-sheet";

// Export sub-components for direct use if needed
export { BedsTab } from "./beds-tab";
export { HistoryTab } from "./history-tab";
export { BedListItem } from "./bed-list-item";
export { AssignOccupantDialog } from "./assign-occupant-dialog";
export { CheckoutDialog } from "./checkout-dialog";
export { CancelDialog } from "./cancel-dialog";

// Export config
export { bedStatusConfig, actionConfig } from "./config";
