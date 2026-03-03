import type { NextPage } from 'next';
import type { AppType, AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

import { DefaultLayout } from '@/components/DefaultLayout';
import { AmbientOverlay } from '@/components/ambient-overlay';
import { trpc } from '@/utils/trpc';
import '@/styles/globals.css';
import { Session } from 'next-auth';

export type NextPageWithLayout<
  TProps = Record<string, unknown>,
  TInitialProps = TProps,
> = NextPage<TProps, TInitialProps> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  pageProps: AppProps['pageProps'] & {
    session?: Session;
  };
};

const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return (
    <SessionProvider session={pageProps.session}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
        {getLayout(<Component {...pageProps} />)}
        <AmbientOverlay />
      </ThemeProvider>
    </SessionProvider>
  );
}) as AppType;

export default trpc.withTRPC(MyApp);
