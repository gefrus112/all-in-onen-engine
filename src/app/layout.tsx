import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lapia Studio — 2D Game Engine",
  description: "Build 2D games in Python with a Roblox Studio-style IDE. Live preview powered by Pyodide.",
  keywords: ["Lapia", "game engine", "Pygame", "Python", "IDE", "Roblox Studio", "2D games"],
  authors: [{ name: "Lapia Engine Contributors" }],
  openGraph: {
    title: "Lapia Studio",
    description: "Build 2D games in Python with a Roblox Studio-style IDE.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
