"use client";

import { useState, useCallback, useEffect } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { MonthGrid } from "./MonthGrid";
import { reschedulePost } from "@/app/actions/reschedulePost";
import { getScheduledPostsForMonth } from "@/app/actions/getScheduledPosts";
import type { ScheduledPost } from "@/lib/types";

export type ScheduleCalendarProps = {
  initialPosts?: ScheduledPost[];
  onRefresh?: () => void;
  onPostClick?: (postId: string) => void;
  refreshTrigger?: number;
};

export function ScheduleCalendar({
  initialPosts = [],
  onRefresh,
  onPostClick,
  refreshTrigger,
}: ScheduleCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const loadMonth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScheduledPostsForMonth(year, month);
      setPosts(data);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth, refreshTrigger]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const post = active.data.current?.post as ScheduledPost | undefined;
    if (!post?.id) return;

    const droppableId = String(over.id);
    if (!droppableId.startsWith("day-")) return;

    const dateStr = droppableId.replace("day-", "");
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) return;

    // Preserve original time when rescheduling to new date
    const originalDate = post.scheduled_for ? new Date(post.scheduled_for) : new Date();
    targetDate.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      0,
      0
    );

    // Optimistic update
    const prevPosts = [...posts];
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, scheduled_for: targetDate.toISOString() }
          : p
      )
    );

    const result = await reschedulePost(post.id, targetDate);

    if (result.success) {
      toast.success("Rescheduled", {
        description: `Moved to ${format(targetDate, "MMM d, yyyy 'at' h:mm a")}`,
      });
      onRefresh?.();
    } else {
      setPosts(prevPosts);
      toast.error("Failed to reschedule", { description: result.error });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          {format(viewDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 h-96 flex items-center justify-center">
          <div className="animate-pulse text-zinc-500">Loading calendar…</div>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <MonthGrid year={year} month={month} posts={posts} onPostClick={onPostClick} />
        </DndContext>
      )}
    </div>
  );
}
