import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "iRASStudio® Admin",
  description: "Administrative console for iRAS Studio creative community platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#FAFAF8] text-[#141413] flex flex-col font-sans selection:bg-[#F0DFD7] selection:text-[#9E4323]">
        {children}
      </body>
    </html>
  );
}
