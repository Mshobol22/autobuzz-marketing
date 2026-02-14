import type { Metadata } from "next";
import { Space_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { ClerkProviderWrapper } from "@/components/providers/ClerkProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Background } from "@/components/ui/Background";
import { CornerNav } from "@/components/ui/CornerNav";
import { CursorEffects } from "@/components/ui/CursorEffects";
import "./globals.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoBuzz | Marketing Automation",
  description: "High-end marketing automation SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceMono.variable} ${playfair.variable} antialiased font-mono`}>
        <Background />
        <CursorEffects />
        <ClerkProviderWrapper>
          <LenisProvider>
            <CornerNav />
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast: "border border-white/10 bg-[#0a0a0a]",
                  success: "border-emerald-500/30",
                  error: "border-rose-500/30",
                },
              }}
            />
          </LenisProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
