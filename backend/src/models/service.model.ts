import { Schema, model, InferSchemaType, Types } from 'mongoose';

// Portas do serviço, quantas o usuário quiser: WebUI, RPC, peers do BitTorrent, ed2k...
// Não aparecem no card — servem de metadado pesquisável (busca casa com o nome e com o número).
const portSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // ex: "WebUI", "peers BT"
    number: { type: Number, required: true, min: 1, max: 65535 },
  },
  { _id: false },
);

// Credencial de acesso (login/senha) de um serviço. A senha nunca fica em texto
// puro: é cifrada (AES-256-GCM, ver src/crypto.ts) antes de chegar aqui. Tem _id
// (ao contrário de portSchema) porque o endpoint de "revelar senha" precisa
// referenciar uma credencial específica dentro do array.
const credentialSchema = new Schema({
  label: { type: String, required: true, trim: true }, // ex: "WebUI", "SSH"
  username: { type: String, required: true, trim: true },
  cipherText: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
});

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    icon: { type: String, required: true, trim: true }, // classe FontAwesome (via icon picker)
    color: { type: String, required: true, trim: true }, // ex: "#2496ed"
    tags: { type: [String], default: [] },
    ports: { type: [portSchema], default: [] },
    credentials: { type: [credentialSchema], default: [] },
    publicUrl: { type: String, default: null },
    localUrl: { type: String, default: '' },
    note: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type Service = InferSchemaType<typeof serviceSchema> & { _id: Types.ObjectId };
export const ServiceModel = model('Service', serviceSchema);
