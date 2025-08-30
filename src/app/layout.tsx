import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/theme-provider';
import { version } from '../../package.json';

export const metadata: Metadata = {
  title: 'Snooker Loopy Scores',
  description: 'An app to record snooker scores, with AI-powered features.',
  robots: 'noindex, nofollow',
};

function Version() {
  return (
    <div className="fixed bottom-2 right-2 text-xs bg-card/60 text-muted-foreground px-2 py-1 rounded-md shadow-sm backdrop-blur-sm z-50">
      Version {version}
    </div>
  )
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
              {children}
          </AuthProvider>
          <Toaster />
          <Version />
        </ThemeProvider>
      </body>
    </html>
  );
}
