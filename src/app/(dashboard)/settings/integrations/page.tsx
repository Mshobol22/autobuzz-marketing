"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAyrshareToken, isSinglePlayerMode } from "@/app/actions/getAyrshareToken";
import { Loader2, Link2, ExternalLink, User } from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [singlePlayer, setSinglePlayer] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([
      isSinglePlayerMode(),
      getAyrshareToken(),
    ]).then(([isSingle, tokenResult]) => {
      setSinglePlayer(isSingle);
      if (isSingle) {
        setError(null);
        setLinkUrl(null);
      } else if (tokenResult.success) {
        setLinkUrl(tokenResult.url);
        setError(null);
      } else {
        setError(tokenResult.error);
      }
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    }).finally(() => setLoading(false));
  }, []);

  function openLinkPopup() {
    if (!linkUrl) return;
    const w = 600;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(
      linkUrl,
      "ayrshare-connect",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`
    );
    toast.info("Complete the connection in the popup, then return here.");
  }

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        Integrations
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mt-1 text-slate-400"
      >
        Connect your social media accounts to post from AutoBuzz.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 max-w-2xl"
      >
        <div
          id="ayrshare-integration"
          className="rounded-xl border border-amber-500/20 bg-black/40 p-6 backdrop-blur-sm"
        >
          {loading ? (
            <div className="flex items-center gap-3 text-amber-500/90">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : singlePlayer ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <User className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    Single Player Mode
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Please connect your social accounts directly on the Ayrshare Dashboard.
                  </p>
                  <a
                    href="https://app.ayrshare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Ayrshare Dashboard
                  </a>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
              <p className="font-medium">Unable to load integrations</p>
              <p className="mt-1 text-sm text-red-300/80">{error}</p>
              <p className="mt-2 text-xs text-slate-500">
                Ensure AYRSHARE_API_KEY, AYRSHARE_DOMAIN, and AYRSHARE_PRIVATE_KEY
                are set for the Business Plan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Link2 className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    Connect your accounts
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Link LinkedIn, Instagram, X (Twitter), Facebook, and more.
                    Posts will be published to your connected accounts.
                  </p>
                </div>
              </div>
              <button
                onClick={openLinkPopup}
                className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 font-medium text-amber-500 transition-colors hover:border-amber-500/60 hover:bg-amber-500/20"
              >
                <ExternalLink className="h-4 w-4" />
                Open Ayrshare to connect
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
