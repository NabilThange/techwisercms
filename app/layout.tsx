import type React from "react"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { V0Provider } from "@/lib/v0-context"
import localFont from "next/font/local"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import { DashboardLayoutContent } from "@/components/dashboard/dashboard-layout-content"
import { PasswordGate } from "@/components/auth/password-gate"

const mockData = mockDataJson as MockData

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

const rebelGrotesk = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
})

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false

export const metadata: Metadata = {
  title: {
    template: "%s – TECH.WISER.",
    default: "TECH.WISER.",
  },
  description: "The ultimate dashboard for rebels. Making the web for brave individuals.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preload" href="/fonts/Rebels-Fett.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased`}>
        <PasswordGate>
          <V0Provider isV0={isV0}>
            <SidebarProvider>
              {/* Mobile Header - only visible on mobile */}
              <MobileHeader mockData={mockData} />

              {/* Removed MobileChat floating button and drawer */}
              <DashboardLayoutContent mockData={mockData}>{children}</DashboardLayoutContent>
            </SidebarProvider>
          </V0Provider>
        </PasswordGate>
      </body>
    </html>
  )
}
