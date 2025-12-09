// Notes management
class NotesManager {
  constructor() {
    this.notes = [];
    this.currentFilter = 'all';
    this.currentColorFilter = null;
    this.searchQuery = '';
  }

  // Load all notes
  async loadNotes() {
    try {
      const filters = {};
      if (this.currentFilter === 'archived') {
        filters.archived = true;
      } else if (this.currentFilter === 'pinned') {
        filters.pinned = true;
      }
      
      if (this.currentColorFilter) {
        filters.color = this.currentColorFilter;
      }

      const response = await api.getNotes(filters);
      if (response.success) {
        this.notes = response.notes;
        this.renderNotes();
      }
    } catch (error) {
      this.showToast('Error loading notes: ' + error.message, 'error');
    }
  }

  // Search notes
  async searchNotes(query) {
    this.searchQuery = query;
    if (!query.trim()) {
      this.loadNotes();
      return;
    }

    try {
      const response = await api.searchNotes(query);
      if (response.success) {
        this.notes = response.notes;
        this.renderNotes();
      }
    } catch (error) {
      this.showToast('Error searching notes: ' + error.message, 'error');
    }
  }

  // Create a new note
  async createNote(title, content, color_tag) {
    try {
      const response = await api.createNote(title, content, color_tag);
      if (response.success) {
        this.showToast('Note created successfully', 'success');
        this.loadNotes();
        return true;
      }
      return false;
    } catch (error) {
      this.showToast('Error creating note: ' + error.message, 'error');
      return false;
    }
  }

  // Update a note
  async updateNote(id, updates) {
    try {
      const response = await api.updateNote(id, updates);
      if (response.success) {
        this.showToast('Note updated successfully', 'success');
        this.loadNotes();
        return true;
      }
      return false;
    } catch (error) {
      this.showToast('Error updating note: ' + error.message, 'error');
      return false;
    }
  }

  // Delete a note
  async deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await api.deleteNote(id);
      if (response.success) {
        this.showToast('Note deleted successfully', 'success');
        this.loadNotes();
      }
    } catch (error) {
      this.showToast('Error deleting note: ' + error.message, 'error');
    }
  }

  // Toggle pin status
  async togglePin(id, currentStatus) {
    await this.updateNote(id, { is_pinned: !currentStatus });
  }

  // Toggle archive status
  async toggleArchive(id, currentStatus) {
    await this.updateNote(id, { is_archived: !currentStatus });
  }

  // Render notes to the DOM
  renderNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;

    if (this.notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No notes found</h3>
          <p>Create your first note to get started!</p>
        </div>
      `;
      return;
    }

    // Sort notes: pinned first, then by updated date
    const sortedNotes = [...this.notes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    container.innerHTML = sortedNotes.map(note => this.renderNoteCard(note)).join('');
    
    // Attach event listeners
    this.attachNoteEventListeners();
  }

  // Render a single note card
  renderNoteCard(note) {
    const date = new Date(note.updated_at).toLocaleDateString();
    const colorClass = note.color_tag ? `color-tag-${note.color_tag}` : '';
    const pinnedClass = note.is_pinned ? 'pinned' : '';
    
    return `
      <div class="note-card ${pinnedClass}" data-note-id="${note.id}">
        <div class="note-header">
          <div>
            <div class="note-title">${this.escapeHtml(note.title)}</div>
          </div>
          <div class="note-actions">
            ${note.is_pinned ? 
              '<button class="note-action-btn" data-action="unpin" title="Unpin">📌</button>' : 
              '<button class="note-action-btn" data-action="pin" title="Pin">📍</button>'
            }
            ${note.is_archived ? 
              '<button class="note-action-btn" data-action="unarchive" title="Unarchive">📦</button>' : 
              '<button class="note-action-btn" data-action="archive" title="Archive">📁</button>'
            }
            <button class="note-action-btn" data-action="edit" title="Edit">✏️</button>
            <button class="note-action-btn" data-action="delete" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="note-content">${this.escapeHtml(note.content)}</div>
        ${note.summary ? `<div class="note-summary" style="font-size: 0.85em; color: var(--text-light); font-style: italic; margin-top: 10px;">${this.escapeHtml(note.summary)}</div>` : ''}
        <div class="note-footer">
          ${note.color_tag ? `<span class="note-tag ${colorClass}">${note.color_tag}</span>` : '<span></span>'}
          <span class="note-date">${date}</span>
        </div>
      </div>
    `;
  }

  // Attach event listeners to note cards
  attachNoteEventListeners() {
    document.querySelectorAll('.note-card').forEach(card => {
      const noteId = parseInt(card.dataset.noteId);
      const note = this.notes.find(n => n.id === noteId);
      if (!note) return;

      card.querySelectorAll('.note-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          
          switch(action) {
            case 'pin':
              this.togglePin(noteId, note.is_pinned);
              break;
            case 'unpin':
              this.togglePin(noteId, note.is_pinned);
              break;
            case 'archive':
              this.toggleArchive(noteId, note.is_archived);
              break;
            case 'unarchive':
              this.toggleArchive(noteId, note.is_archived);
              break;
            case 'edit':
              this.openEditModal(note);
              break;
            case 'delete':
              this.deleteNote(noteId);
              break;
          }
        });
      });

      // Click on card to view/edit
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.note-actions')) {
          this.openEditModal(note);
        }
      });
    });
  }

  // Open edit modal
  openEditModal(note = null) {
    const modal = document.getElementById('noteModal');
    const form = document.getElementById('noteForm');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    const colorSelect = document.getElementById('noteColor');
    const modalTitle = document.getElementById('modalTitle');
    const deleteBtn = document.getElementById('deleteNoteBtn');
    const summarizeBtn = document.getElementById('summarizeNoteBtn');

    if (note) {
      modalTitle.textContent = 'Edit Note';
      titleInput.value = note.title;
      contentInput.value = note.content;
      colorSelect.value = note.color_tag || '';
      form.dataset.noteId = note.id;
      deleteBtn.style.display = 'block';
      summarizeBtn.style.display = 'block';
      summarizeBtn.dataset.noteId = note.id;
    } else {
      modalTitle.textContent = 'Create Note';
      form.reset();
      delete form.dataset.noteId;
      deleteBtn.style.display = 'none';
      summarizeBtn.style.display = 'none';
    }

    modal.classList.add('active');
    titleInput.focus();
  }

  // Close edit modal
  closeEditModal() {
    const modal = document.getElementById('noteModal');
    modal.classList.remove('active');
    const form = document.getElementById('noteForm');
    form.reset();
    delete form.dataset.noteId;
  }

  // Handle form submission
  async handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const color = document.getElementById('noteColor').value || null;
    const noteId = form.dataset.noteId;

    if (!title || !content) {
      this.showToast('Title and content are required', 'error');
      return;
    }

    let success = false;
    if (noteId) {
      success = await this.updateNote(noteId, { title, content, color_tag: color });
    } else {
      success = await this.createNote(title, content, color);
    }

    if (success) {
      this.closeEditModal();
    }
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Show toast notification
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Set filter
  setFilter(filter) {
    this.currentFilter = filter;
    this.currentColorFilter = null;
    this.loadNotes();
    this.updateFilterButtons();
  }

  // Set color filter
  setColorFilter(color) {
    if (this.currentColorFilter === color) {
      this.currentColorFilter = null;
    } else {
      this.currentColorFilter = color;
    }
    this.loadNotes();
    this.updateColorFilterButtons();
  }

  // Update filter button states
  updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.filter === this.currentFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Update color filter button states
  updateColorFilterButtons() {
    document.querySelectorAll('.color-filter-btn').forEach(btn => {
      if (btn.dataset.color === this.currentColorFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// Export singleton instance
const notesManager = new NotesManager();
window.notesManager = notesManager; // Make available globally

