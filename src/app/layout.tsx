import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";
import { ThemeProvider } from "@/lib/theme-context";
import { HydrationExtensionGuard } from "@/components/common/HydrationExtensionGuard";

export const metadata: Metadata = {
  title: "ServiceMeow | Purr-fect Enterprise Service Management",
  description: "ITIL-compliant ITSM, CMDB, Service Catalog, Business Rules, UI Policies, and Flow Designer engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (document.documentElement.hasAttribute('data-lt-installed')) {
                  document.documentElement.removeAttribute('data-lt-installed');
                }
                if (document.documentElement.hasAttribute('suppresshydrationwarning')) {
                  document.documentElement.removeAttribute('suppresshydrationwarning');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased transition-colors" suppressHydrationWarning>
        <HydrationExtensionGuard />
        <UserProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
