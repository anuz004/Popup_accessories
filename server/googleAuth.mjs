import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';

export function createGoogleAuth(env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) return null;
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
  return {
    start: async (state, nonce) => {
      const verifier = randomBytes(32).toString('base64url');
      const { createHash } = await import('node:crypto');
      const challenge = createHash('sha256').update(verifier).digest('base64url');
      return { verifier, url: client.generateAuthUrl({ scope: ['openid', 'email', 'profile'], state, nonce,
        prompt: 'select_account', code_challenge: challenge, code_challenge_method: 'S256' }) };
    },
    finish: async (code, verifier, nonce) => {
      const { tokens } = await client.getToken({ code, codeVerifier: verifier });
      if (!tokens.id_token) throw new Error('Google did not return an identity token');
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.GOOGLE_CLIENT_ID });
      const profile = ticket.getPayload();
      if (!profile?.sub || profile.email_verified !== true || profile.nonce !== nonce) throw new Error('Google identity could not be verified');
      return { sub: profile.sub, email: profile.email.toLowerCase(), name: profile.name || profile.email };
    },
  };
}
