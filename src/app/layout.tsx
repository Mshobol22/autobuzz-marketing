import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ClerkProviderWrapper } from "@/components/providers/ClerkProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProviderWrapper>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "glass-card border border-white/10",
                success: "border-emerald-500/30",
                error: "border-rose-500/30",
              },
            }}
          />
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
