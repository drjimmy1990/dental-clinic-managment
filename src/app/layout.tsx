import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DentaCare Pro - نظام إدارة عيادات الأسنان',
  description: 'نظام متكامل لإدارة عيادات الأسنان - المواعيد، المرضى، المدفوعات، المخزن',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
