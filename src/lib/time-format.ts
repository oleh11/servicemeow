/**
 * ServiceMeow Workplace Time Formatting Utilities
 * Supports standard 12-Hour (AM / PM) and 24-Hour (Military Time) formats
 * for space, room, and desk reservations.
 */

export type TimeFormat = "12h" | "24h";

/**
 * Standard 30-minute booking options from 07:00 to 22:00
 */
export const STANDARD_TIME_OPTIONS: string[] = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
];

/**
 * Hourly slot markers for calendar matrix grids
 */
export const CALENDAR_HOURLY_SLOTS: string[] = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

/**
 * Parses "HH:mm" string into numeric hour and minute
 */
export function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hStr, mStr] = (timeStr || "09:00").split(":");
  const hour = parseInt(hStr, 10) || 0;
  const minute = parseInt(mStr, 10) || 0;
  return { hour, minute };
}

/**
 * Formats "HH:mm" string into military callout (e.g., "0900 hrs", "1430 hrs")
 */
export function toMilitaryCallout(timeStr: string): string {
  const { hour, minute } = parseTime(timeStr);
  const hh = hour.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}${mm} hrs`;
}

/**
 * Formats "HH:mm" time string into 12h or 24h format
 * @example
 * formatTimeSlot("09:00", "12h") => "9:00 AM"
 * formatTimeSlot("14:30", "12h") => "2:30 PM"
 * formatTimeSlot("09:00", "24h") => "09:00"
 * formatTimeSlot("14:30", "24h") => "14:30"
 */
export function formatTimeSlot(timeStr: string, format: TimeFormat): string {
  const { hour, minute } = parseTime(timeStr);
  const mm = minute.toString().padStart(2, "0");

  if (format === "24h") {
    const hh = hour.toString().padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // 12-Hour format
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${mm} ${period}`;
}

/**
 * Formats "HH:mm" for dropdown selectors with descriptive labels
 * In military mode, includes standard 4-digit notation (e.g. "14:30 (1430 hrs)")
 */
export function formatTimeOption(timeStr: string, format: TimeFormat): string {
  if (format === "24h") {
    const callout = toMilitaryCallout(timeStr);
    return `${timeStr} (${callout})`;
  }
  return formatTimeSlot(timeStr, "12h");
}

/**
 * Formats a time interval (e.g., "09:00" to "10:30")
 * @example
 * formatInterval("09:00", "10:30", "12h") => "9:00 AM – 10:30 AM"
 * formatInterval("09:00", "10:30", "24h") => "09:00 – 10:30 (0900 – 1030 hrs)"
 */
export function formatInterval(
  startTime: string,
  endTime: string,
  format: TimeFormat,
  includeMilitaryCallout: boolean = true
): string {
  const formattedStart = formatTimeSlot(startTime, format);
  const formattedEnd = formatTimeSlot(endTime, format);

  if (format === "24h" && includeMilitaryCallout) {
    const startCall = toMilitaryCallout(startTime);
    const endCall = toMilitaryCallout(endTime);
    return `${formattedStart} – ${formattedEnd} (${startCall.replace(" hrs", "")} – ${endCall})`;
  }

  return `${formattedStart} – ${formattedEnd}`;
}

/**
 * Formats a Date object or ISO string according to the active format
 */
export function formatDateTimeSlot(
  dateOrIso: Date | string,
  format: TimeFormat,
  includeDate: boolean = false
): string {
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return "";

  const timeStr = format === "24h"
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

  if (includeDate) {
    const dateStr = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    return `${dateStr} • ${timeStr}`;
  }

  return timeStr;
}

/**
 * Formats a full reservation start/end window for display
 */
export function formatReservationWindow(
  start: Date | string,
  end: Date | string,
  format: TimeFormat
): string {
  const dStart = typeof start === "string" ? new Date(start) : start;
  const dEnd = typeof end === "string" ? new Date(end) : end;
  if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return "";

  const formattedStart = formatDateTimeSlot(dStart, format);
  const formattedEnd = formatDateTimeSlot(dEnd, format);
  const dateStr = dStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  if (format === "24h") {
    const hStart = dStart.getHours().toString().padStart(2, "0") + dStart.getMinutes().toString().padStart(2, "0");
    const hEnd = dEnd.getHours().toString().padStart(2, "0") + dEnd.getMinutes().toString().padStart(2, "0");
    return `${formattedStart} – ${formattedEnd} [${hStart} – ${hEnd} hrs] (${dateStr})`;
  }

  return `${formattedStart} – ${formattedEnd} (${dateStr})`;
}
