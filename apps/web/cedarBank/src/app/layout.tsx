import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cedar Bank",
  description:
    "A premium Nigerian mobile banking demo for secure account management, transfers, and transaction support.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
