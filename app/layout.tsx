import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIT Bhopal FFCS & Faculty Ratings | AI Timetable Maker",
  description: "Plan 100% clash-free semester timetables with Gemini AI, faculty ratings, and local storage privacy.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "VIT Bhopal FFCS & Faculty Ratings | AI Timetable Maker",
    description: "Plan 100% clash-free semester timetables with Gemini AI, faculty ratings, and local storage privacy.",
    images: [
      {
        url: "/og-image.png",
        width: 512,
        height: 512,
        alt: "VIT Bhopal FFCS AI Timetable Maker Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VIT Bhopal FFCS & Faculty Ratings | AI Timetable Maker",
    description: "Plan 100% clash-free semester timetables with Gemini AI, faculty ratings, and local storage privacy.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
