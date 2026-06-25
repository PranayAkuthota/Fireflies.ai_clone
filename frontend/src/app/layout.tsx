import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ActiveMeetingProvider } from "@/context/ActiveMeetingContext";
import { Toaster } from "react-hot-toast";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fireflies.ai Clone - Workspace",
  description: "Interactive Meeting Transcripts & AI Notes Summaries Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">
        <ActiveMeetingProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 pl-16">
              {children}
            </div>
          </div>
          <Toaster position="bottom-right" />
        </ActiveMeetingProvider>
      </body>
    </html>
  );
}
