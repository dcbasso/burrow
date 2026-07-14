import express from 'express';
import { config } from './config';
import { connectDb } from './db';
import { requireAuth } from './auth';
import { sectionsRouter } from './routes/sections.routes';
import { servicesRouter } from './routes/services.routes';

async function bootstrap(): Promise<void> {
  await connectDb();

  const app = express();
  app.use(express.json());

  // Healthcheck público (usado pelo docker healthcheck) — sem auth.
  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  // Config pública pro front (o Client ID do Google é público por design).
  // Evita rebuildar o Angular por ambiente.
  app.get('/api/config', (_req, res) => res.json({ googleClientId: config.googleClientId }));

  // Devolve o usuário logado (útil pro front confirmar a allowlist).
  app.get('/api/me', requireAuth, (req, res) => res.json((req as any).user));

  // Dashboard PRIVADO: toda a API exige auth (inclusive GET).
  app.use('/api/sections', requireAuth, sectionsRouter);
  app.use('/api/services', requireAuth, servicesRouter);

  app.listen(config.port, () => {
    console.log(`[api] ouvindo em :${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[api] falha ao iniciar:', err);
  process.exit(1);
});
