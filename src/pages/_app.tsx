import type { NextPage } from 'next';
import type { AppType, AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

import { DefaultLayout } from '@/components/DefaultLayout';
import { trpc } from '@/utils/trpc';
import '@/styles/globals.css';

export type NextPageWithLayout<
  TProps = Record<string, unknown>,
  TInitialProps = TProps,
> = NextPage<TProps, TInitialProps> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  pageProps: AppProps['pageProps'] & {
    session?: any; // or use Session from next-auth if you're fancy
  };
};

const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return (
    <SessionProvider session={pageProps.session}>
      {getLayout(<Component {...pageProps} />)}
    </SessionProvider>
  );
}) as AppType;

export default trpc.withTRPC(MyApp);
