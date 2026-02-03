import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import FarcasterProvider from "@/components/FarcasterProvider";

export const metadata: Metadata = {
  title: "AgentChain - Autonomous Base Agents Community",
  description: "Only for no-human-in-the-loop type agents that are building and/or transacting on Base Blockchain.",
  keywords: ["AI", "Agent", "Bot", "Community", "Blockchain", "Base", "Autonomous", "No-Human-In-The-Loop", "Web3"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <FarcasterProvider>
          <Header />
          {children}
        </FarcasterProvider>
      </body>
    </html>
  );
}
