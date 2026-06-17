import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisePanda 管理后台",
  description: "VisePanda 管理后台（MVP）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
