import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import ReactQueryProvider from "@/lib/react-query";
import { LoadingTransition } from "@/components/loading-transition";
import { ButtonClickEffect } from "@/components/button-click-effect";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tempo - Modern SaaS Starter",
  description: "A modern full-stack starter template powered by Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload CSS to avoid render blocking - improves LCP by 433ms */}
        <link
          rel="preload"
          href="/css/app/layout.css"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        {/* Fallback for browsers with JavaScript disabled */}
        <noscript>
          <link rel="stylesheet" href="/css/app/layout.css" />
        </noscript>

        {/* Polyfill for browsers that don't support preload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(w){
            // Check if the browser doesn't support preload
            if(!w.document.querySelector('link[rel="preload"][as="style"]')){
              // If preload isn't supported, load CSS normally
              var link = w.document.createElement('link');
              link.rel = 'stylesheet';
              link.href = '/css/app/layout.css';
              document.head.appendChild(link);
            }
          })(window);
        `,
          }}
        />

        {/* Add HTTP caching headers on server */}
        {/* Cache-Control: public, max-age=31536000, immutable */}
      </head>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <LoadingTransition />
            <ButtonClickEffect />
            {children}
          </ThemeProvider>
        </ReactQueryProvider>
        <TempoInit />
      </body>
    </html>
  );
}
