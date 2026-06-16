import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ödeal Akıllı POS | Yeni Nesil Ödeme Çözümü',
  description:
    'Ödeal Akıllı POS ile %0 komisyon, hafta sonları dahil ertesi gün transfer, tüm banka kartları. TCMB lisanslı güvence.',
}

// GTM_ID will come from env vars. In demo mode it's undefined — the dataLayer still works,
// events are just not forwarded to Google (see DECISIONS.md D-006).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.className}>
      <body className="min-h-screen bg-white text-gray-900">
        {/* GTM bootstrap — initializes dataLayer before the tag manager script loads */}
        <Script id="gtm-init" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];`}
        </Script>

        {/* GTM script tag — loads asynchronously, does not block rendering */}
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}

        {children}
      </body>
    </html>
  )
}
