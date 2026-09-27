import NextAuth, { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Attach GitHub login to the session
      if (session.user) {
        (session.user as any).githubLogin = token.githubLogin;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account?.provider === "github") {
        token.githubLogin = token.name; // GitHub username is in token.name
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
