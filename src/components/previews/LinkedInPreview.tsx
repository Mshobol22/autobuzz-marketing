"use client";

const TRUNCATE_LENGTH = 200;

export function LinkedInPreview({
  content,
  imageUrl,
  userName = "You",
}: {
  content: string;
  imageUrl?: string | null;
  userName?: string;
}) {
  const truncated = content.length > TRUNCATE_LENGTH;
  const displayText = truncated
    ? content.slice(0, TRUNCATE_LENGTH) + "..."
    : content;

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#f3f2ef] shadow-lg">
      {/* LinkedIn feed gray background */}
      <div className="p-4 min-h-[200px]">
        <div className="max-w-[552px] mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-amber-500/30 flex items-center justify-center shrink-0 text-amber-600 font-semibold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#000000] text-[15px] truncate">
                  {userName}
                </p>
                <p className="text-[#666666] text-xs">Your headline</p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-[#ebebeb] text-[#666666] shrink-0"
              aria-label="More options"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            <p className="text-[#000000] text-[15px] leading-[1.4] whitespace-pre-wrap break-words">
              {displayText || (
                <span className="text-[#666666] italic">Your post content...</span>
              )}
              {truncated && (
                <button
                  type="button"
                  className="text-[#0a66c2] font-semibold ml-1 hover:underline"
                >
                  ...see more
                </button>
              )}
            </p>
          </div>

          {/* Image */}
          {imageUrl && (
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#f3f2ef]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
