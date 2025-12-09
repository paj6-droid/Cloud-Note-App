const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getQuery, allQuery, runQuery } = require('../database/db');

// All routes require authentication
router.use(authenticate);

// Get all notes for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { color, archived, pinned } = req.query;
    
    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [userId];
    
    // Filter by archived status
    if (archived !== undefined) {
      query += ' AND is_archived = ?';
      params.push(archived === 'true' ? 1 : 0);
    } else {
      // By default, exclude archived notes unless specifically requested
      query += ' AND is_archived = 0';
    }
    
    // Filter by pinned status
    if (pinned !== undefined) {
      query += ' AND is_pinned = ?';
      params.push(pinned === 'true' ? 1 : 0);
    }
    
    // Filter by color tag
    if (color) {
      query += ' AND color_tag = ?';
      params.push(color);
    }
    
    query += ' ORDER BY is_pinned DESC, updated_at DESC';
    
    const notes = await allQuery(query, params);
    
    res.json({
      success: true,
      notes: notes.map(note => ({
        ...note,
        is_pinned: Boolean(note.is_pinned),
        is_archived: Boolean(note.is_archived)
      }))
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

// Get a single note by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;
    
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
    
    res.json({
      success: true,
      note: {
        ...note,
        is_pinned: Boolean(note.is_pinned),
        is_archived: Boolean(note.is_archived)
      }
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note'
    });
  }
});

// Search notes
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        notes: []
      });
    }
    
    const searchTerm = `%${q}%`;
    const notes = await allQuery(
      `SELECT * FROM notes 
       WHERE user_id = ? 
       AND is_archived = 0
       AND (title LIKE ? OR content LIKE ?)
       ORDER BY is_pinned DESC, updated_at DESC`,
      [userId, searchTerm, searchTerm]
    );
    
    res.json({
      success: true,
      notes: notes.map(note => ({
        ...note,
        is_pinned: Boolean(note.is_pinned),
        is_archived: Boolean(note.is_archived)
      }))
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching notes'
    });
  }
});

// Create a new note
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content, color_tag } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    const result = await runQuery(
      `INSERT INTO notes (user_id, title, content, color_tag) 
       VALUES (?, ?, ?, ?)`,
      [userId, title, content, color_tag || null]
    );
    
    const note = await getQuery(
      'SELECT * FROM notes WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: {
        ...note,
        is_pinned: Boolean(note.is_pinned),
        is_archived: Boolean(note.is_archived)
      }
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note'
    });
  }
});

// Update a note
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;
    const { title, content, color_tag, is_pinned, is_archived } = req.body;
    
    // Check if note exists and belongs to user
    const existingNote = await getQuery(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );
    
    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (color_tag !== undefined) {
      updates.push('color_tag = ?');
      params.push(color_tag);
    }
    if (is_pinned !== undefined) {
      updates.push('is_pinned = ?');
      params.push(is_pinned ? 1 : 0);
    }
    if (is_archived !== undefined) {
      updates.push('is_archived = ?');
      params.push(is_archived ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(noteId, userId);
    
    await runQuery(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    
    const updatedNote = await getQuery(
      'SELECT * FROM notes WHERE id = ?',
      [noteId]
    );
    
    res.json({
      success: true,
      message: 'Note updated successfully',
      note: {
        ...updatedNote,
        is_pinned: Boolean(updatedNote.is_pinned),
        is_archived: Boolean(updatedNote.is_archived)
      }
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note'
    });
  }
});

// Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.params.id;
    
    // Check if note exists and belongs to user
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
    
    await runQuery(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );
    
    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note'
    });
  }
});

module.exports = router;

