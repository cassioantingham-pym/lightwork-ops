import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LightWork Ops — Operations Intelligence",
  description:
    "AI-powered operations orchestration for team performance and deadline tracking.",
  icons: {
    icon: "https://framerusercontent.com/images/iU0WgErOqN5xst7T4tfl00leQ.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "'Geist', -apple-system, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
