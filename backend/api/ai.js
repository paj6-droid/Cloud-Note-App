const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getQuery, runQuery } = require('../database/db');
const OpenAI = require('openai');

// All routes require authentication
router.use(authenticate);

// Initialize OpenAI client (will be null if API key is not provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Generate AI summary for a note
router.post('/notes/:id/summarize', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        success: false,
        message: 'AI summarization is not available. Please configure OPENAI_API_KEY.'
      });
    }
    
    const userId = req.user.userId;
    const noteId = req.params.id;
    
    // Get the note
    const note = await getQuery(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // If summary already exists, return it
    if (note.summary) {
      return res.json({
        success: true,
        summary: note.summary,
        cached: true
      });
    }
    
    // Generate summary using OpenAI
    const prompt = `Please provide a concise summary of the following note in 2-3 sentences:\n\nTitle: ${note.title}\n\nContent: ${note.content}`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes notes concisely.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });
    
    const summary = completion.choices[0].message.content.trim();
    
    // Save summary to database
    await runQuery(
      'UPDATE notes SET summary = ? WHERE id = ?',
      [summary, noteId]
    );
    
    res.json({
      success: true,
      summary,
      cached: false
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating summary: ' + (error.message || 'Unknown error')
    });
  }
});

module.exports = router;

