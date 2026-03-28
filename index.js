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

// MongoDB Connection Management
let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  
  if (cachedConnection) {
    await cachedConnection;
    return mongoose.connection;
  }

  const uri = (process.env.MONGODB_URI || '').replace(/\s/g, '');
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Set internal buffering to false for serverless to control it manually
  mongoose.set('bufferCommands', false);

  cachedConnection = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  });

  try {
    await cachedConnection;
    console.log('Connected to MongoDB Successfully');
    return mongoose.connection;
  } catch (err) {
    cachedConnection = null; // Reset on failure
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '// $1:****@');
    console.error('MONGODB CONNECTION ERROR:', {
      message: err.message,
      uri: maskedUri,
      atlas_hint: 'Ensure Vercel IP or 0.0.0.0/0 is whitelisted in MongoDB Atlas.'
    });
    throw err;
  }
};

// Initial connection attempt (don't await here to not block file load)
connectDB().catch(() => {});

// Middleware to ensure DB connection
const checkDB = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    return res.status(503).json({ 
      error: 'Database connection not established', 
      details: error.message,
      hint: 'Check MongoDB Atlas IP whitelisting (0.0.0.0/0) and Vercel environment variables.'
    });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vennila Backend is running', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Create a new link with embedding
app.post('/api/links', checkDB, async (req, res) => {
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
app.get('/api/links', checkDB, async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Delete a link
app.delete('/api/links/:id', checkDB, async (req, res) => {
  try {
    const { id } = req.params;
    await Link.findByIdAndDelete(id);
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
