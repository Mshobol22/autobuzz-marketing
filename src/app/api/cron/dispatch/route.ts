import { NextResponse } from "next/server";
import { dispatchScheduledPosts } from "@/lib/dispatchScheduledPosts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await dispatchScheduledPosts();

  return NextResponse.json({
    posts_processed: result.posts_processed,
    errors: result.errors,
  });
}
