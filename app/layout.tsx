import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext"; // ✅ Import AuthProvider

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "InterviewEdge",
    description: "AI-Powered Interview Preparation",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
