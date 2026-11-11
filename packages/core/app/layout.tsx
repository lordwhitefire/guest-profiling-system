import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Guest Profiling System",
  description:
    "Reads existing guest records (read-only) from a hotel's PMS, presents live-filtered matching profiles as a receptionist types, and auto-fills the hotel's existing registration form on click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
