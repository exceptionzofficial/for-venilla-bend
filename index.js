import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Link } from './models/Link.js';
import { getEmbedding } from './voyage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.set('bufferCommands', false);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Successfully'))
  .catch((err) => {
    console.error('MONGODB CONNECTION ERROR DETAILS:', {
      message: err.message,
      code: err.code,
      name: err.name,
      uri_provided: !!process.env.MONGODB_URI,
      atlas_hint: 'Ensure your Vercel IP or 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.'
    });
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vennila Backend is running', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Create a new link with embedding
app.post('/api/links', async (req, res) => {
  try {
    const { subject, link } = req.body;
    if (!subject || !link) {
      return res.status(400).json({ error: 'Subject and link are required' });
    }

    // Generate embedding using Voyage AI
    const embedding = await getEmbedding(subject);

    const newLink = new Link({
      subject,
      link,
      embedding
    });

    await newLink.save();
    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// Get all links
app.get('/api/links', async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Delete a link
app.delete('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Link.findByIdAndDelete(id);
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
