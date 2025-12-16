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
        <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 text-center shadow-md">
          <p className="text-lg font-semibold">
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
