import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import LapiaDevTools from "../components/devtools/LapiaDevTools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gefrus112.github.io/all-in-onen-engine"),
  title: "All In One Engine — 2D + 3D Game Engine",
  description: "Build 2D and 3D games with Python. Pygame, Three.js, and Zhitlow engines all in one. Roblox Studio-style IDE with live preview, multiplayer, and one-click publishing.",
  keywords: ["All In One Engine", "game engine", "Pygame", "Three.js", "Python", "IDE", "Roblox Studio", "2D", "3D", "multiplayer"],
  authors: [{ name: "All In One Engine Contributors" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg" },
    ],
  },
  openGraph: {
    title: "All In One Engine — 2D + 3D Game Engine",
    description: "Build 2D and 3D games with Python. Roblox Studio-style IDE with live preview, multiplayer, and one-click publishing.",
    type: "website",
    images: ["/logo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "All In One Engine",
    description: "Build 2D and 3D games with Python. Roblox Studio-style IDE.",
    images: ["/logo.svg"],
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
        <LapiaDevTools />
      </body>
    </html>
  );
}
