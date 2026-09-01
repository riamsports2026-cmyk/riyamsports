import { clearAuthRedirect } from '@/lib/utils/auth-redirect';

/** Active booking continuation states — terminal flows clear storage entirely. */
export type BookingContinuationStatus = 'pending_auth' | 'pending_resume';

export type BookingDraft = {
  turfId: string;
  bookingDate: string;
  selectedHours: number[];
  paymentType: 'advance' | 'full';
  resumeAfterLogin: boolean;
  returnPath: string;
  status: BookingContinuationStatus;
  createdAt: number;
};

const STORAGE_KEY = 'riam_pending_booking';
const MAX_AGE_MS = 30 * 60 * 1000;

function logContinuation(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[BOOKING_CONTINUATION]', message, detail ?? '');
  }
}

function isExpired(draft: BookingDraft): boolean {
  return Date.now() - draft.createdAt > MAX_AGE_MS;
}

export function terminateBookingContinuation(reason?: string): void {
  if (typeof window === 'undefined') return;
  logContinuation('terminated', reason);
  sessionStorage.removeItem(STORAGE_KEY);
  clearAuthRedirect();
}

export function saveBookingDraft(draft: BookingDraft): void {
  if (typeof window === 'undefined') return;
  logContinuation('saved', { status: draft.status, returnPath: draft.returnPath });
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BookingDraft>;
    if (
      !parsed?.turfId ||
      !parsed?.bookingDate ||
      !Array.isArray(parsed.selectedHours) ||
      (parsed.paymentType !== 'advance' && parsed.paymentType !== 'full') ||
      !parsed.status ||
      !parsed.createdAt
    ) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const draft: BookingDraft = {
      turfId: parsed.turfId,
      bookingDate: parsed.bookingDate,
      selectedHours: parsed.selectedHours,
      paymentType: parsed.paymentType,
      resumeAfterLogin: parsed.resumeAfterLogin === true,
      returnPath: parsed.returnPath || '',
      status: parsed.status,
      createdAt: parsed.createdAt,
    };
    if (isExpired(draft)) {
      logContinuation('expired');
      terminateBookingContinuation('expired');
      return null;
    }
    return draft;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearBookingDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isActiveContinuation(draft: BookingDraft | null): draft is BookingDraft {
  if (!draft) return false;
  return draft.status === 'pending_auth' || draft.status === 'pending_resume';
}

/** Guest clicked Book — waiting for OAuth / profile before resuming. */
export function createPendingAuthDraft(
  draft: Omit<BookingDraft, 'status' | 'createdAt' | 'resumeAfterLogin'>
): void {
  saveBookingDraft({
    ...draft,
    resumeAfterLogin: true,
    status: 'pending_auth',
    createdAt: Date.now(),
  });
}

/** Auth complete — user should land on the booking page and resume. */
export function markContinuationPendingResume(): void {
  const draft = loadBookingDraft();
  if (!draft || !isActiveContinuation(draft)) return;
  if (draft.status === 'pending_resume') return;
  logContinuation('pending_resume');
  saveBookingDraft({ ...draft, status: 'pending_resume' });
}

export function shouldRedirectAfterAuth(draft: BookingDraft | null): boolean {
  return (
    isActiveContinuation(draft) &&
    draft.status === 'pending_auth' &&
    !!draft.returnPath &&
    draft.returnPath.startsWith('/book/')
  );
}

export function shouldAutoResumeBooking(draft: BookingDraft | null): boolean {
  return (
    isActiveContinuation(draft) &&
    draft.status === 'pending_resume' &&
    draft.resumeAfterLogin
  );
}

export function shouldRestoreBookingSelections(draft: BookingDraft | null): boolean {
  return isActiveContinuation(draft) && draft.status === 'pending_resume';
}

export function markResumeAttempted(): void {
  const draft = loadBookingDraft();
  if (!draft || !isActiveContinuation(draft)) return;
  logContinuation('resume_attempted');
  saveBookingDraft({ ...draft, resumeAfterLogin: false });
}

export function getActiveContinuationReturnPath(): string | null {
  const draft = loadBookingDraft();
  if (!isActiveContinuation(draft)) return null;
  const path = draft.returnPath;
  return path && path.startsWith('/book/') ? path : null;
}
