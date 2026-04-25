import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoopKit — The Solo Founder's Shipping OS",
  description:
    "Define · Develop · Deliver · Learn · Repeat. The CLI-first tool that closes every phase of the shipping loop for solo technical founders.",
  keywords: [
    "solo founder",
    "shipping",
    "CLI",
    "build in public",
    "indie hacker",
    "productivity",
  ],
  openGraph: {
    title: "LoopKit — The Solo Founder's Shipping OS",
    description:
      "One CLI. Five commands. The entire shipping loop closed.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-white">
        {children}
      </body>
    </html>
  );
}
