export type BookingDraft = {
  turfId: string;
  bookingDate: string;
  selectedHours: number[];
  paymentType: 'advance' | 'full';
  resumeAfterLogin: boolean;
};

const STORAGE_KEY = 'riam_pending_booking';

export function saveBookingDraft(draft: BookingDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingDraft;
    if (
      !parsed?.turfId ||
      !parsed?.bookingDate ||
      !Array.isArray(parsed.selectedHours) ||
      (parsed.paymentType !== 'advance' && parsed.paymentType !== 'full')
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function clearResumeFlag(): void {
  const draft = loadBookingDraft();
  if (!draft) return;
  saveBookingDraft({ ...draft, resumeAfterLogin: false });
}
