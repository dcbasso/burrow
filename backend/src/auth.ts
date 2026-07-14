import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from './config';

const client = new OAuth2Client(config.googleClientId);

export interface AuthedRequest extends Request {
  user?: { email: string; name?: string; picture?: string };
}

/**
 * Middleware de auth aplicado a TODAS as rotas /api (inclusive GET — dashboard privado).
 * Valida o ID token do Google (assinatura + aud) e confere o e-mail contra a allowlist.
 */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();

    if (!payload || !email || payload.email_verified !== true) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    if (!config.allowedEmails.includes(email)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    req.user = { email, name: payload.name, picture: payload.picture };
    next();
  } catch {
    res.status(401).json({ error: 'Falha ao validar token' });
  }
}
