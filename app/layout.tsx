import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter"
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair"
});

export const metadata = {
  title: "Prostate AI Diagnostic",
  description: "Advanced AI detection model for prostate screening",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-slate-50 text-slate-900 min-h-screen relative`}>
        {/* Global Premium Mesh Background */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/80 via-slate-50 to-white pointer-events-none" />
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent pointer-events-none" />
        {children}
      </body>
    </html>
  );
}