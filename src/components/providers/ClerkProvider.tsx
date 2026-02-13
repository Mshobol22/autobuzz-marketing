"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow app to run without Clerk keys (e.g. during initial setup)
  if (!publishableKey || publishableKey === "") {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorBackground: "rgba(15, 23, 42, 0.8)",
          colorInputBackground: "rgba(15, 23, 42, 0.6)",
          colorInputText: "#fafaf9",
          borderRadius: "0.75rem",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
