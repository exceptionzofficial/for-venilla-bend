import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

/**
 * Generate embedding for a given text using Voyage AI REST API
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  try {
    const response = await axios.post(
      VOYAGE_API_URL,
      {
        input: [text],
        model: "voyage-3",
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Voyage AI Embedding Error:", error.response?.data || error.message);
    throw error;
  }
}
