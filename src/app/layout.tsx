import type { Metadata } from "next";
import "./globals.css";
import ControlsProvider from "@/providers/controls";
import Window from "@/components/three/Window";
import { Roboto_Mono } from 'next/font/google'
import CameraProvider from "@/providers/camera";

const roboto = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Pixel Playground",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${roboto.className} antialiased h-lvh`}>

        <ControlsProvider>
          <CameraProvider>
            <Window />
            {children}
          </CameraProvider>
        </ControlsProvider>
      </body>
    </html>
  );
}
