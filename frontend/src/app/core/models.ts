export interface Section {
  _id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

/** Porta do serviço: metadado pesquisável, não renderizado no card. */
export interface ServicePort {
  name: string;
  number: number;
}

/**
 * Credencial de acesso do serviço. A senha nunca trafega aqui — o backend
 * redige `cipherText`/`iv`/`authTag` de toda resposta que não seja o
 * endpoint de reveal (ver `ApiService.revealCredential`).
 */
export interface ServiceCredential {
  _id: string;
  label: string;
  username: string;
}

/**
 * Forma enviada ao criar/editar credenciais: `_id` presente identifica uma
 * credencial existente (senha em branco = manter a atual); ausente = nova.
 */
export interface ServiceCredentialInput {
  _id?: string;
  label: string;
  username: string;
  password: string;
}

export interface Service {
  _id: string;
  name: string;
  sectionId: string;
  icon: string;
  color: string;
  tags: string[];
  ports: ServicePort[];
  credentials: ServiceCredential[];
  publicUrl: string | null;
  localUrl: string;
  note: string;
  enabled: boolean;
  order: number;
}
