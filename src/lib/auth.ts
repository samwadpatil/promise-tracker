import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID ?? "",
      clientSecret: process.env.SLACK_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "users:read,users:read.email",
          user_scope: "channels:history,channels:read,im:history,im:read,users:read",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // persist tokens per provider
        if (account.provider === "google") {
          (token as any).gmailAccessToken = account.access_token;
          (token as any).gmailRefreshToken = account.refresh_token;
        }
        if (account.provider === "slack") {
          (token as any).slackAccessToken = account.access_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).gmailAccessToken = (token as any).gmailAccessToken;
      (session as any).slackAccessToken = (token as any).slackAccessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
