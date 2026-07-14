import { Router } from 'express';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { SectionModel } from '../models/section.model';
import { ServiceModel } from '../models/service.model';

export const sectionsRouter = Router();

const sectionBody = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  order: z.number().int().optional(),
});

const reorderBody = z.object({
  items: z
    .array(z.object({ _id: z.string().refine(isValidObjectId, '_id inválido'), order: z.number().int() }))
    .min(1),
});

sectionsRouter.get('/', async (_req, res) => {
  const sections = await SectionModel.find().sort({ order: 1, name: 1 });
  res.json(sections);
});

sectionsRouter.post('/', async (req, res) => {
  const parsed = sectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const section = await SectionModel.create(parsed.data);
  res.status(201).json(section);
});

sectionsRouter.put('/reorder', async (req, res) => {
  const parsed = reorderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await SectionModel.bulkWrite(
    parsed.data.items.map((it) => ({
      updateOne: { filter: { _id: it._id }, update: { $set: { order: it.order } } },
    })),
  );
  res.status(204).send();
});

sectionsRouter.put('/:id', async (req, res) => {
  const parsed = sectionBody.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const section = await SectionModel.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!section) {
    res.status(404).json({ error: 'Categoria não encontrada' });
    return;
  }
  res.json(section);
});

sectionsRouter.delete('/:id', async (req, res) => {
  const inUse = await ServiceModel.countDocuments({ sectionId: req.params.id });
  if (inUse > 0) {
    res.status(409).json({ error: `Categoria em uso por ${inUse} serviço(s)` });
    return;
  }
  const deleted = await SectionModel.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Categoria não encontrada' });
    return;
  }
  res.status(204).send();
});
