"use server";

import { auth } from "@clerk/nextjs/server";
import { dispatchScheduledPosts, type DispatchResult } from "@/lib/dispatchScheduledPosts";

export async function testDispatch(): Promise<DispatchResult> {
  const { userId } = await auth();
  if (!userId) {
    return { posts_processed: 0, errors: [{ postId: "", error: "Not authenticated" }] };
  }

  const adminIdsRaw = process.env.ADMIN_USER_IDS;
  if (adminIdsRaw) {
    const adminIds = adminIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    if (adminIds.length > 0 && !adminIds.includes(userId)) {
      return { posts_processed: 0, errors: [{ postId: "", error: "Admin only" }] };
    }
  }

  return dispatchScheduledPosts();
}
