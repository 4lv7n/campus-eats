import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export const TOKEN_KEY = 'campus_eats_token';

// 1. where the API lives
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

// 2. before every request, attach the JWT (if the user is logged in)
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  return { headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
    query: { fetchPolicy: 'network-only' },
  },
});
