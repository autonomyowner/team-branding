import type { Metadata } from "next";
import { ConvexClientProvider } from "@/convex/ConvexClientProvider";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "نيكسس | منصة إدارة سير العمل الذكية",
  description: "حوّل عمليات أعمالك مع أتمتة سير العمل المدعومة بالذكاء الاصطناعي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div style={{
          width: '100%',
          background: 'rgba(22, 24, 32, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <p style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: 0,
            textAlign: 'center',
            background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            بسم الله توكلت على الله ولا حول وَلا قوة إلا بِاللهِ
          </p>
        </div>
        <ConvexClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
