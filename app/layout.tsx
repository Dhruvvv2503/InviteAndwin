import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const BASE_URL = 'https://inviteandwin.online'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Join Team Google AI WhatsApp Channel',
    template: '%s | InviteAndWin',
  },
  description: 'Join the Team Google AI WhatsApp Channel, invite friends & win an iPhone 17e! Top 20 referrers win prizes. Free to enter. 100% legit.',
  keywords: [
    'Google AI Studio', 'Team Google AI', 'WhatsApp Channel', 'win iPhone 17e',
    'referral contest', 'invite and win', 'free contest India', 'WhatsApp referral',
    'AI community contest', 'win prizes', 'Google AI WhatsApp',
  ],
  authors: [{ name: 'InviteAndWin', url: BASE_URL }],
  creator: 'InviteAndWin',
  publisher: 'InviteAndWin',
  category: 'Contest',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Join Team Google AI WhatsApp Channel',
    description: 'Invite friends and win an iPhone 17e, AirPods Pro, Amazon vouchers & more! Join the Team Google AI WhatsApp Channel now.',
    url: BASE_URL,
    siteName: 'InviteAndWin',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary',
    title: 'Join Team Google AI WhatsApp Channel',
    description: 'Free contest. Invite your network. Top referrer wins an iPhone 17e!',
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1a1a28",
              color: "#f0f0ff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
