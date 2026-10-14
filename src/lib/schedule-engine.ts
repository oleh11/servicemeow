import { db } from "./db";

export interface ScheduleDetails {
  id: string;
  name: string;
  timeZone: string;
  workDays: number[];
  startHour: number;
  endHour: number;
  holidays: string[];
}

export function parseSchedule(cmnSchedule: any): ScheduleDetails {
  const workDays = (cmnSchedule.workDays || "1,2,3,4,5")
    .split(",")
    .map((s: string) => parseInt(s.trim(), 10));

  let holidays: string[] = [];
  try {
    holidays = JSON.parse(cmnSchedule.holidaysJson || "[]");
  } catch (e) {
    holidays = [];
  }

  return {
    id: cmnSchedule.id,
    name: cmnSchedule.name,
    timeZone: cmnSchedule.timeZone || "America/New_York",
    workDays,
    startHour: cmnSchedule.startHour ?? 9,
    endHour: cmnSchedule.endHour ?? 17,
    holidays,
  };
}

export function isWithinSchedule(date: Date, schedule: ScheduleDetails): boolean {
  // Day of week: 0 = Sun, 1 = Mon ... 6 = Sat
  const day = date.getDay();
  if (!schedule.workDays.includes(day)) return false;

  const yyyyMmDd = date.toISOString().split("T")[0];
  if (schedule.holidays.includes(yyyyMmDd)) return false;

  const hour = date.getHours();
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;

  return true;
}

export function calculateBusinessElapsedMinutes(
  schedule: ScheduleDetails | null,
  startTime: Date,
  endTime: Date
): number {
  if (!schedule) {
    return Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 60000));
  }

  let current = new Date(startTime.getTime());
  let elapsedMinutes = 0;

  // Step in 5-minute increments for speed or 1-minute
  const stepMs = 60 * 1000;
  while (current < endTime) {
    if (isWithinSchedule(current, schedule)) {
      elapsedMinutes++;
    }
    current = new Date(current.getTime() + stepMs);
  }

  return elapsedMinutes;
}

export function calculateProjectedBreachTime(
  schedule: ScheduleDetails | null,
  startTime: Date,
  durationMinutes: number
): Date {
  if (!schedule) {
    return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  }

  let remainingMinutes = durationMinutes;
  let current = new Date(startTime.getTime());

  // Step minute by minute through business hours
  while (remainingMinutes > 0) {
    if (isWithinSchedule(current, schedule)) {
      remainingMinutes--;
    }
    current = new Date(current.getTime() + 60 * 1000);
  }

  return current;
}
