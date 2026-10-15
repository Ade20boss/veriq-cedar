import type { Metadata } from "next"
import "../src/index.css"

export const metadata: Metadata = {
  title: "Cedar Bank Operations",
  description: "Synthetic Cedar staff operations workspace",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
