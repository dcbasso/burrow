import { Router } from 'express';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ServiceModel } from '../models/service.model';
import { SectionModel } from '../models/section.model';

export const servicesRouter = Router();

const serviceBody = z.object({
  name: z.string().min(1),
  sectionId: z.string().refine(isValidObjectId, 'sectionId inválido'),
  icon: z.string().min(1),
  color: z.string().min(1),
  tags: z.array(z.string()).optional(),
  ports: z
    .array(z.object({ name: z.string().min(1), number: z.number().int().min(1).max(65535) }))
    .optional(),
  publicUrl: z.string().url().nullable().optional(),
  localUrl: z.string().optional(),
  note: z.string().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().optional(),
});

async function sectionExists(id: string): Promise<boolean> {
  return (await SectionModel.exists({ _id: id })) != null;
}

servicesRouter.get('/', async (_req, res) => {
  const services = await ServiceModel.find().sort({ order: 1, name: 1 });
  res.json(services);
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
  const service = await ServiceModel.create(parsed.data);
  res.status(201).json(service);
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
  const service = await ServiceModel.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!service) {
    res.status(404).json({ error: 'Serviço não encontrado' });
    return;
  }
  res.json(service);
});

servicesRouter.delete('/:id', async (req, res) => {
  const deleted = await ServiceModel.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Serviço não encontrado' });
    return;
  }
  res.status(204).send();
});
