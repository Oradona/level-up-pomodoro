import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Level Up Pomodoro',
  description: '집중할수록 레벨이 오르는 게임형 뽀모도로 타이머',
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_-10%,rgba(244,63,94,0.18),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.15),transparent_45%)]" />
        {children}
      </body>
    </html>
  );
}
