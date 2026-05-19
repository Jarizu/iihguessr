import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { prisma } from "./prisma";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "IIHGuessr <noreply@iihguessr.com>";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    EmailProvider({
      // We bypass SMTP entirely; sendVerificationRequest below dispatches
      // through Resend's HTTP API. The `server` field is unused but required
      // by NextAuth's type, so we hand it a placeholder.
      server: { host: "unused", port: 587, auth: { user: "", pass: "" } },
      from: EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          throw new Error("RESEND_API_KEY is not set");
        }
        const resend = new Resend(apiKey);
        const { host } = new URL(url);

        const { error } = await resend.emails.send({
          from: provider.from,
          to: identifier,
          subject: `Sign in to ${host}`,
          html: buildHtmlEmail({ url, host }),
          text: `Sign in to ${host}\n\n${url}\n\nThis link expires in 24 hours. If you didn't request it, you can ignore this email.\n`,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message}`);
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: "database",
  },
};

function buildHtmlEmail({ url, host }: { url: string; host: string }): string {
  // Inline styles only — most email clients strip <style>. Colors match
  // the iihguessr.com theme (black bg, white text, #5b0dd1 purple accent).
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#000;color:#fff;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0a0a0a;border:1px solid #240554;border-radius:12px;padding:32px;">
          <tr><td>
            <h1 style="margin:0 0 8px;color:#a878ff;font-size:28px;letter-spacing:0.02em;">IIHGuessr</h1>
            <p style="margin:0 0 24px;color:#a3a3a3;font-size:14px;">Sign in to ${host}</p>
            <p style="margin:0 0 28px;color:#e5e5e5;font-size:16px;line-height:1.5;">
              Click the button below to finish signing in. This link is single-use and expires in 24 hours.
            </p>
            <p style="margin:0 0 28px;">
              <a href="${url}" style="display:inline-block;background:#5b0dd1;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:8px;font-size:16px;">
                Sign in
              </a>
            </p>
            <p style="margin:0 0 8px;color:#737373;font-size:12px;">
              Or paste this URL into your browser:
            </p>
            <p style="margin:0 0 24px;color:#a878ff;font-size:12px;word-break:break-all;">
              ${url}
            </p>
            <p style="margin:0;color:#525252;font-size:12px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Extend the session type to include user id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
