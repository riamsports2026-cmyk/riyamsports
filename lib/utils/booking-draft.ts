export const BOOKING_DRAFT_STORAGE_KEY = 'riam_booking_draft';

export interface BookingDraft {
  turfId: string;
  bookingDate: string;
  selectedHours: number[];
  paymentType: 'advance' | 'full';
}

export function saveBookingDraft(draft: BookingDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(turfId: string): BookingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as BookingDraft;
    if (draft.turfId !== turfId) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
}
