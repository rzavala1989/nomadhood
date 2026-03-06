import Head from 'next/head';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Nomadhood - Discover Your Perfect Neighborhood</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SiteHeader />
      <main className="pt-[80px] min-h-screen">{children}</main>
      <Footer />
    </>
  );
};
