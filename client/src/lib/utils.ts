import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInYears, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  try {
    // timeStr is HH:mm
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
}

export function calculateAge(dateOfBirth: string): number {
  try {
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  } catch {
    return 0;
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const nextMinutes = currentMinutes + durationMinutes;
    const startStr = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`;
    const endStr = `${Math.floor(nextMinutes / 60).toString().padStart(2, '0')}:${(nextMinutes % 60).toString().padStart(2, '0')}`;
    slots.push({ start: startStr, end: endStr });
    currentMinutes = nextMinutes;
  }

  return slots;
}
