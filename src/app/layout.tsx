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
        <ConvexClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
