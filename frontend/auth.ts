import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ profile }) {
      const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",").map(e => e.trim())
      return allowed.includes(profile?.email ?? "")
    },
  },
})
