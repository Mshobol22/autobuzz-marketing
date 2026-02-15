"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Linkedin, Instagram, Facebook } from "lucide-react";
import type { ScheduledPost } from "@/lib/types";
import { format } from "date-fns";

const PLATFORM_STYLES: Record<string, { bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  LinkedIn: {
    bg: "bg-[#0a66c2]/20 border-[#0a66c2]/50 text-[#0a66c2]",
    icon: Linkedin,
  },
  Instagram: {
    bg: "bg-gradient-to-r from-[#f09433]/20 via-[#e1306c]/20 to-[#833ab4]/20 border-pink-500/50 text-pink-400",
    icon: Instagram,
  },
  Twitter: {
    bg: "bg-sky-500/20 border-sky-500/50 text-sky-400",
    icon: Linkedin, // reuse for now
  },
  facebook: {
    bg: "bg-[#1877f2]/20 border-[#1877f2]/50 text-[#1877f2]",
    icon: Facebook,
  },
  default: {
    bg: "bg-amber-500/20 border-amber-500/40 text-amber-400",
    icon: Linkedin,
  },
};

export function DraggablePostPill({
  post,
  onClick,
}: {
  post: ScheduledPost;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  const platform = post.platform ?? "LinkedIn";
  const style = PLATFORM_STYLES[platform] ?? PLATFORM_STYLES.default;
  const Icon = style.icon;

  const title = (post.content?.slice(0, 24) ?? "Untitled").trim();
  const truncated = (post.content?.length ?? 0) > 24 ? `${title}…` : title;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium shrink-0 max-w-full cursor-grab active:cursor-grabbing ${style.bg} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{truncated}</span>
    </div>
  );
}

export type CalendarDayProps = {
  date: Date;
  posts: ScheduledPost[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onPostClick?: (postId: string) => void;
};

export function CalendarDay({
  date,
  posts,
  isCurrentMonth,
  isToday,
  onPostClick,
}: CalendarDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date.toISOString().slice(0, 10)}`,
    data: { date },
  });

  const dayNum = format(date, "d");

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] rounded-lg border p-2 transition-colors ${
        isCurrentMonth
          ? "bg-white/5 border-white/10"
          : "bg-white/[0.02] border-white/5"
      } ${isOver ? "ring-2 ring-amber-500/50 bg-amber-500/10" : ""}`}
    >
      <div
        className={`text-sm font-medium mb-1.5 ${
          isCurrentMonth ? "text-white/90" : "text-white/40"
        } ${isToday ? "text-amber-400" : ""}`}
      >
        {dayNum}
      </div>
      <div className="flex flex-col gap-1 overflow-hidden">
        {posts.map((post) => (
          <DraggablePostPill
            key={post.id}
            post={post}
            onClick={onPostClick ? () => onPostClick(post.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
