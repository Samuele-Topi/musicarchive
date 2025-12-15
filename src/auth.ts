import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub
  ],
  callbacks: {
    async signIn({ user, profile }) {
      // Allow everyone to sign in? No, let's strictly restrict ADMIN access.
      // Actually, for "Sign In", we can allow it, but we only grant "permissions" if it matches.
      // But to be stricter: Only allow YOU to sign in at all.
      // This prevents random people from having a "session" even if they can't do anything.
      
      const allowedUsername = "Samuele-Topi";
      
      // GitHub profile "login" is the username
      // user.name might be the display name, so we check profile.
      if (profile && (profile as any).login === allowedUsername) {
        return true;
      }
      
      return false; // Deny everyone else
    }
  }
})
