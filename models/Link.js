import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  link: { type: String, required: true },
  date: { type: Date, default: Date.now },
  embedding: { type: [Number], default: [] }, // Voyage AI vector embedding
}, { timestamps: true });

export const Link = mongoose.model('Link', linkSchema);
