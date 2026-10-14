import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";
import { ThemeProvider } from "@/lib/theme-context";

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
    <html lang="en">
      <body className="min-h-screen antialiased transition-colors">
        <UserProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
