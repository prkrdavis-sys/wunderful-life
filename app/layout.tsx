import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HashScrollHandler } from "@/components/layout/HashScrollHandler";
import { getSiteContent } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const site = getSiteContent();

export const metadata: Metadata = {
  title: {
    default: `${site.fullName} · ${site.brand}`,
    template: `%s · ${site.brand}`,
  },
  description: site.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} h-full scroll-smooth`}>
      <body className="relative min-h-full flex flex-col bg-cream font-body antialiased">
        <HashScrollHandler />
        <SiteNav
          fullName={site.fullName}
          brand={site.brand}
          links={site.heroLinks}
        />
        <main className="relative z-10 flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
