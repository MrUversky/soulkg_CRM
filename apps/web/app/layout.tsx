import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "@/components/ui/Toaster";
import { NextIntlClientProvider } from 'next-intl';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { cookies } from 'next/headers';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  // Validate locale against supported locales array
  const locale: Locale = (cookieLocale && locales.includes(cookieLocale as Locale))
    ? (cookieLocale as Locale)
    : defaultLocale;
  
  return {
    title: "Soul KG CRM",
    description: locale === 'ru'
      ? "Мультитенантная CRM система с AI-агентами для автоматизации продаж туров"
      : "Multi-tenant CRM system with AI agents for tour sales automation",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  // Validate locale against supported locales array to prevent loading non-existent JSON files
  const locale: Locale = (cookieLocale && locales.includes(cookieLocale as Locale))
    ? (cookieLocale as Locale)
    : defaultLocale;
  
  // Load messages for the validated locale
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
