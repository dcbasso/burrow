/** Configuração central lida de env (falha cedo se faltar algo crítico). */

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return v.trim();
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://mongo:27017/homelab',
  googleClientId: required('GOOGLE_CLIENT_ID'),
  // Lista separada por vírgula; comparação case-insensitive.
  allowedEmails: required('ALLOWED_EMAILS')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};
