import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  DM_Sans,
  Fraunces,
  Instrument_Sans,
} from "next/font/google";
import { AdminModeBanner } from "@/components/admin/AdminModePanel";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HashScrollHandler } from "@/components/layout/HashScrollHandler";
import { AppProviders } from "@/components/layout/AppProviders";
import { getSiteContent } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    title: {
      default: `${site.fullName} · ${site.brand}`,
      template: `%s · ${site.brand}`,
    },
    description: site.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteContent();

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${fraunces.variable} ${instrumentSans.variable} h-full scroll-smooth`}
    >
      <body className="relative min-h-full flex flex-col bg-cream font-body antialiased">
        <AppProviders initialSite={site}>
          <HashScrollHandler />
          <div className="sticky top-0 z-50">
            <SiteNav
              fullName={site.fullName}
              brand={site.brand}
              links={site.heroLinks}
            />
            <AdminModeBanner />
          </div>
          <main className="relative z-10 flex-1">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
