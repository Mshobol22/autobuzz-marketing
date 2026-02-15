"use client";

const TRUNCATE_LENGTH = 125;

export function InstagramPreview({
  content,
  imageUrl,
  userName = "you",
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
    <div className="flex justify-center">
      {/* Device frame - mock phone */}
      <div className="relative rounded-[2.5rem] border-[10px] border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="w-[280px] overflow-hidden">
          {/* Status bar notch area */}
          <div className="h-6 bg-white" />

          {/* Instagram feed - white bg */}
          <div className="bg-white">
            {/* User header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#efefef]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-[#262626] text-sm truncate">
                  {userName}
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-[#262626]"
                aria-label="More"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
            </div>

            {/* Image - 1:1 aspect */}
            <div className="aspect-square w-full bg-[#fafafa] overflow-hidden">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#dbdbdb] text-xs">
                  Image
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-4 px-3 py-2">
              <button type="button" className="p-1 text-[#262626]" aria-label="Like">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button type="button" className="p-1 text-[#262626]" aria-label="Comment">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
              <button type="button" className="p-1 text-[#262626]" aria-label="Share">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            </div>

            {/* Caption */}
            <div className="px-3 pb-4">
              <p className="text-[#262626] text-[14px] leading-[1.375]">
                <span className="font-semibold mr-1.5">{userName}</span>
                {displayText || (
                  <span className="text-[#8e8e8e] italic">Your caption...</span>
                )}
                {truncated && (
                  <button
                    type="button"
                    className="text-[#8e8e8e] ml-1 hover:text-[#262626]"
                  >
                    more
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
