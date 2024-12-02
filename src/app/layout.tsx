import type { Metadata } from "next";
import "./globals.css";

import * as emojiMart from 'emoji-mart'
import * as twemoji from '@emoji-mart/data/sets/15/twitter.json'

import { Nunito } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Emoji Telepathy",
  description: "Try to hone in on an emoji with a total stranger!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  emojiMart.init({ twemoji });

  return (
    <html lang="en">
      <body className={`${nunito.className} antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
