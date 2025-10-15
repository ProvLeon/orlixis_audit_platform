import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Orlixis Audit Platform",
    template: "%s | Orlixis Audit Platform"
  },
  description: "Professional codebase auditing and analysis platform by Orlixis LTD. Generate comprehensive security reports, code quality assessments, and implementation timelines.",
  keywords: [
    "code audit",
    "security assessment",
    "code quality",
    "orlixis",
    "software analysis",
    "vulnerability scanning",
    "code review",
    "technical audit"
  ],
  authors: [{ name: "Orlixis LTD" }],
  creator: "Orlixis LTD",
  publisher: "Orlixis LTD",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://audit.orlixis.com",
    title: "Orlixis Audit Platform",
    description: "Professional codebase auditing and analysis platform",
    siteName: "Orlixis Audit Platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Orlixis Audit Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orlixis Audit Platform",
    description: "Professional codebase auditing and analysis platform",
    images: ["/og-image.png"],
    creator: "@orlixis",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://audit.orlixis.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#007b8c" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${lora.variable} font-sans antialiased bg-background text-foreground selection:bg-orlixis-teal selection:text-white`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">
                {children}
              </div>
            </div>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
