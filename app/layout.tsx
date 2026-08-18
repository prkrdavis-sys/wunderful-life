import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import {
  Bricolage_Grotesque,
  DM_Sans,
  Fraunces,
  Instrument_Sans,
  Sacramento,
} from "next/font/google";
import { AdminModeBanner } from "@/components/admin/AdminModePanel";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HashScrollHandler } from "@/components/layout/HashScrollHandler";
import { SiteHeaderHeightSync } from "@/components/layout/SiteHeaderHeightSync";
import { AppProviders } from "@/components/layout/AppProviders";
import { ADMIN_COOKIE, canAccessAdmin, isAdminAuthRequired } from "@/lib/auth";
import { getSiteContentRecord } from "@/lib/site";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#f7f3ec",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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

const sacramento = Sacramento({
  variable: "--font-sacramento",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { content: site } = await getSiteContentRecord();
  const title = `${site.fullName} · ${site.brand}`;
  return {
    title: {
      default: title,
      template: `%s · ${site.brand}`,
    },
    description: site.tagline,
    applicationName: site.brand,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: site.brand,
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
    openGraph: {
      title,
      description: site.tagline,
      siteName: site.brand,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: site.tagline,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { content: site, version: siteVersion } = await getSiteContentRecord();
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  const initialAuthRequired = isAdminAuthRequired();
  const initialAuthenticated = canAccessAdmin(session);

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${fraunces.variable} ${instrumentSans.variable} ${sacramento.variable} h-full scroll-smooth`}
    >
      <body className="relative min-h-full flex flex-col bg-cream font-body antialiased">
        <AppProviders
          initialSite={site}
          initialSiteVersion={siteVersion}
          initialAuthenticated={initialAuthenticated}
          initialAuthRequired={initialAuthRequired}
        >
          <HashScrollHandler />
          <div id="site-header" className="sticky top-0 z-50">
            <SiteNav />
            <AdminModeBanner />
            <SiteHeaderHeightSync />
          </div>
          <main className="relative z-10 flex-1">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
