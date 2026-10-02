import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ErasStudio® Admin",
  description: "Administrative console for ErasStudio creative community platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#FAFAF8] text-[#141413] flex flex-col font-sans selection:bg-[#F0DFD7] selection:text-[#9E4323]">
        {children}
      </body>
    </html>
  );
}
