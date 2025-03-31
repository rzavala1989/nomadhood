
import { type NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        // Add other providers here (Google, Discord, etc)
    ],
    callbacks: {
        session: async ({ session, token }) => {
            session.user.id = token.sub!;
            session.user.isAdmin = session.user.email === 'admin@example.com'; // customize
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
