/** Configuração central lida de env (falha cedo se faltar algo crítico). */

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return v.trim();
}

function credentialsKey(): Buffer {
  const raw = required('CREDENTIALS_ENCRYPTION_KEY');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      'CREDENTIALS_ENCRYPTION_KEY deve decodificar em 32 bytes (base64). Gere com: openssl rand -base64 32',
    );
  }
  return key;
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
  // Chave AES-256 (32 bytes, base64) usada para cifrar as credenciais dos serviços.
  credentialsKey: credentialsKey(),
};
