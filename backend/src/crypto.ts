import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { config } from './config';

const ALGO = 'aes-256-gcm';

export interface EncryptedSecret {
  cipherText: string;
  iv: string;
  authTag: string;
}

/** Criptografa uma senha em texto puro com AES-256-GCM usando a chave do .env. */
export function encryptSecret(plain: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, config.credentialsKey, iv);
  const cipherText = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return {
    cipherText: cipherText.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

/** Reverte `encryptSecret`, devolvendo a senha em texto puro. */
export function decryptSecret({ cipherText, iv, authTag }: EncryptedSecret): string {
  const decipher = createDecipheriv(ALGO, config.credentialsKey, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(cipherText, 'base64')),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}
