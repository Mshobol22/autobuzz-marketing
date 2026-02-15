"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import { CalendarDay } from "./CalendarDay";
import type { ScheduledPost } from "@/lib/types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function groupPostsByDate(
  posts: ScheduledPost[],
  year: number,
  month: number
): Map<string, ScheduledPost[]> {
  const map = new Map<string, ScheduledPost[]>();

  for (const post of posts) {
    const d = post.scheduled_for ? new Date(post.scheduled_for) : null;
    if (!d) continue;
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;

    const key = format(d, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(post);
    map.set(key, list);
  }

  return map;
}

export type MonthGridProps = {
  year: number;
  month: number;
  posts: ScheduledPost[];
  onPostClick?: (postId: string) => void;
};

export function MonthGrid({ year, month, posts, onPostClick }: MonthGridProps) {
  const monthDate = new Date(year, month, 1);
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const postsByDate = groupPostsByDate(posts, year, month);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Horizontal scroll on mobile; full grid on larger screens */}
      <div className="overflow-x-auto -mx-1 px-1 md:overflow-visible md:mx-0 md:px-0">
        <div className="grid grid-cols-7 gap-px bg-white/10 min-w-[320px] md:min-w-0">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-white/5 px-2 py-2 text-center text-xs font-mono text-amber-500/70 uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
        {days.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayPosts = postsByDate.get(key) ?? [];
          return (
            <CalendarDay
              key={key}
              date={date}
              posts={dayPosts}
              isCurrentMonth={isSameMonth(date, monthDate)}
              isToday={isToday(date)}
              onPostClick={onPostClick}
            />
          );
        })}
        </div>
      </div>
    </div>
  );
}
