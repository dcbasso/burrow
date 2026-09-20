import { Router } from 'express';
import { z } from 'zod';
import { isValidObjectId, HydratedDocument } from 'mongoose';
import { ServiceModel, Service } from '../models/service.model';
import { SectionModel } from '../models/section.model';
import { encryptSecret, decryptSecret } from '../crypto';

export const servicesRouter = Router();

const credentialInput = z.object({
  _id: z.string().optional(), // presente = credencial existente (mantém se password vier vazia)
  label: z.string().min(1),
  username: z.string().min(1),
  password: z.string().optional(),
});

const serviceBody = z.object({
  name: z.string().min(1),
  sectionId: z.string().refine(isValidObjectId, 'sectionId inválido'),
  icon: z.string().min(1),
  color: z.string().min(1),
  tags: z.array(z.string()).optional(),
  ports: z
    .array(z.object({ name: z.string().min(1), number: z.number().int().min(1).max(65535) }))
    .optional(),
  credentials: z.array(credentialInput).optional(),
  publicUrl: z.string().url().nullable().optional(),
  localUrl: z.string().optional(),
  note: z.string().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().optional(),
});

async function sectionExists(id: string): Promise<boolean> {
  return (await SectionModel.exists({ _id: id })) != null;
}

/**
 * Cifra as credenciais recebidas do cliente antes de persistir. Uma credencial
 * existente (`_id` presente) sem `password` mantém o segredo já salvo — senão
 * o usuário seria obrigado a redigitar a senha toda vez que editasse o label.
 */
function resolveCredentials(
  input: z.infer<typeof credentialInput>[] | undefined,
  existing: HydratedDocument<Service> | null,
) {
  if (!input) return undefined;
  return input.map((c) => {
    if (c.password) {
      const enc = encryptSecret(c.password);
      return { label: c.label, username: c.username, ...enc };
    }
    const prev = existing?.credentials?.find((p) => String(p._id) === c._id);
    if (!prev) {
      throw new Error(`Credencial "${c.label}" sem senha e sem correspondente existente`);
    }
    return {
      label: c.label,
      username: c.username,
      cipherText: prev.cipherText,
      iv: prev.iv,
      authTag: prev.authTag,
    };
  });
}

/** Remove os segredos cifrados da resposta — a API nunca expõe isso fora do endpoint de reveal. */
function redact(service: HydratedDocument<Service>) {
  const obj = service.toObject();
  return {
    ...obj,
    credentials: (obj.credentials ?? []).map((c) => ({ _id: c._id, label: c.label, username: c.username })),
  };
}

servicesRouter.get('/', async (_req, res) => {
  const services = await ServiceModel.find().sort({ order: 1, name: 1 });
  res.json(services.map(redact));
});

servicesRouter.post('/', async (req, res) => {
  const parsed = serviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!(await sectionExists(parsed.data.sectionId))) {
    res.status(400).json({ error: 'Categoria (sectionId) não existe' });
    return;
  }
  let credentials;
  try {
    credentials = resolveCredentials(parsed.data.credentials, null);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }
  const service = await ServiceModel.create({ ...parsed.data, credentials });
  res.status(201).json(redact(service));
});

servicesRouter.get('/:id/credentials/:credId/reveal', async (req, res) => {
  const service = await ServiceModel.findById(req.params.id);
  const cred = service?.credentials?.find((c) => String(c._id) === req.params.credId);
  if (!cred) {
    res.status(404).json({ error: 'Credencial não encontrada' });
    return;
  }
  const password = decryptSecret(cred);
  res.json({ username: cred.username, password });
});

const reorderBody = z.object({
  items: z
    .array(z.object({ _id: z.string().refine(isValidObjectId, '_id inválido'), order: z.number().int() }))
    .min(1),
});

servicesRouter.put('/reorder', async (req, res) => {
  const parsed = reorderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await ServiceModel.bulkWrite(
    parsed.data.items.map((it) => ({
      updateOne: { filter: { _id: it._id }, update: { $set: { order: it.order } } },
    })),
  );
  res.status(204).send();
});

// Renomeia uma tag em TODOS os serviços que a usam, desduplicando se o novo
// nome já existir no mesmo serviço. Pipeline update (Mongo 4.2+): mapeia cada
// tag (from -> to) e aplica setUnion para remover repetição.
const tagRenameBody = z.object({ from: z.string().min(1), to: z.string().min(1) });
servicesRouter.put('/tags/rename', async (req, res) => {
  const parsed = tagRenameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const from = parsed.data.from.trim();
  const to = parsed.data.to.trim();
  if (!from || !to || from === to) {
    res.status(400).json({ error: 'Tags inválidas' });
    return;
  }
  await ServiceModel.updateMany({ tags: from }, [
    {
      $set: {
        tags: {
          $setUnion: [
            {
              $map: {
                input: '$tags',
                as: 't',
                in: { $cond: [{ $eq: ['$$t', from] }, to, '$$t'] },
              },
            },
            [],
          ],
        },
      },
    },
  ]);
  res.status(204).send();
});

// Remove uma tag de TODOS os serviços.
const tagRemoveBody = z.object({ tag: z.string().min(1) });
servicesRouter.put('/tags/remove', async (req, res) => {
  const parsed = tagRemoveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await ServiceModel.updateMany({ tags: parsed.data.tag }, { $pull: { tags: parsed.data.tag } });
  res.status(204).send();
});

servicesRouter.put('/:id', async (req, res) => {
  const parsed = serviceBody.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (parsed.data.sectionId && !(await sectionExists(parsed.data.sectionId))) {
    res.status(400).json({ error: 'Categoria (sectionId) não existe' });
    return;
  }
  const existing = await ServiceModel.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Serviço não encontrado' });
    return;
  }
  let credentials;
  try {
    credentials = resolveCredentials(parsed.data.credentials, existing);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }
  const update = credentials === undefined ? parsed.data : { ...parsed.data, credentials };
  const service = await ServiceModel.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(redact(service!));
});

servicesRouter.delete('/:id', async (req, res) => {
  const deleted = await ServiceModel.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Serviço não encontrado' });
    return;
  }
  res.status(204).send();
});
