'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';

// Wraps the whole app: GraphQL client -> login state -> toast messages.
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
