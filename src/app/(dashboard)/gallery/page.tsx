"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon,
  Loader2,
  Download,
  FileEdit,
  X,
  ZoomIn,
} from "lucide-react";
import { getGalleryImages } from "@/app/actions/getGalleryImages";
import type { GalleryImage } from "@/app/actions/getGalleryImages";

function downloadImage(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `autobuzz-${Date.now()}.png`;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function GalleryPage() {
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  useEffect(() => {
    getGalleryImages().then((data) => {
      setImages(data);
      setLoading(false);
    });
  }, []);

  function handleCreatePost(imageUrl: string) {
    router.push(`/generator?imageUrl=${encodeURIComponent(imageUrl)}`);
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-amber-400 font-serif"
      >
        Asset Gallery
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mt-1 text-indigo-200/80 mb-8"
      >
        Manage and reuse your AI-generated visuals.
      </motion.p>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500/60" />
        </div>
      ) : images.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-amber-500/20 bg-indigo-900/20 p-12 text-center"
        >
          <ImageIcon className="h-16 w-16 text-indigo-400/50 mx-auto mb-4" />
          <p className="text-indigo-200/70">No images yet.</p>
          <p className="text-sm text-indigo-300/50 mt-1">
            Generate posts with images in the Generator to see them here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="columns-2 md:columns-3 gap-4 space-y-4"
        >
          {images.map((img, i) => (
            <motion.div
              key={img.imageUrl}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="break-inside-avoid mb-4 group"
            >
              <div className="relative rounded-xl overflow-hidden border border-amber-500/20 bg-indigo-950/30 hover:border-amber-500/40 transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt=""
                  className="w-full h-auto object-cover cursor-pointer"
                  onClick={() => setZoomedUrl(img.imageUrl)}
                />
                {/* Glassmorphism overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreatePost(img.imageUrl)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
                    >
                      <FileEdit className="h-4 w-4" />
                      Create Post
                    </button>
                    <button
                      onClick={() => downloadImage(img.imageUrl)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/90 text-sm hover:bg-white/20 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setZoomedUrl(img.imageUrl)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/90 text-sm hover:bg-white/20 transition-colors"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Zoom overlay */}
      <AnimatePresence>
        {zoomedUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedUrl(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <button
                onClick={() => setZoomedUrl(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedUrl}
                alt=""
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
