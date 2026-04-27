import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "lnk.sh — privacy-respecting URL shortener",
  description:
    "Long links, handled. No trackers. Anonymous links expire after 30 days.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-body">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
