import { Schema, model, InferSchemaType } from 'mongoose';

const sectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true }, // classe FontAwesome, ex: "fas fa-server"
    color: { type: String, required: true, trim: true }, // ex: "#e57000"
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type Section = InferSchemaType<typeof sectionSchema>;
export const SectionModel = model('Section', sectionSchema);
