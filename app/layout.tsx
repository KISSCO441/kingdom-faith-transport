import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kingdom Faith Marketplace | Transport App",
  description:
    "Reliable transport, vehicle servicing and marketplace services across the Eastern Region of Ghana.",
  icons: {
    icon: "/kfm-brand-logo.webp",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
