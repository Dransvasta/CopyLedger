class NoteManager {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.selectedNoteId = null;
        
        this.initElements();
        this.initEventListeners();
        this.loadNotes();
        
        if (this.notes.length === 0) {
            this.createNote();
        } else {
            this.selectedNoteId = this.notes[0].id;
            this.selectNote(this.selectedNoteId);
        }
    }

    initElements() {
        this.elements = {
            newNoteBtn: document.getElementById('newNoteBtn'),
            notesList: document.getElementById('notesList'),
            noteTitle: document.getElementById('noteTitle'),
            subnotesContainer: document.getElementById('subnotesContainer'),
            deleteNote: document.getElementById('deleteNote'),
        }
    }

    initEventListeners() {
        this.elements.newNoteBtn.addEventListener('click', () => this.createNote());
        this.elements.deleteNote.addEventListener('click', () => this.deleteNote());
        this.elements.noteTitle.addEventListener('input', () => this.saveNote());
    }

    createNote() {
        const note = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            created: new Date().toISOString(),
            subnotes: [this.createSubnote()]
        };
        
        this.notes.push(note);
        this.saveToLocalStorage();
        this.loadNotes();
        this.selectNote(note.id);
    }

    createSubnote() {
        return {
            id: Date.now().toString() + Math.random(),
            content: '',
            created: new Date().toISOString()
        };
    }

    deleteNote() {
        if (!this.selectedNoteId) return;
        
        this.notes = this.notes.filter(n => n.id !== this.selectedNoteId);
        this.saveToLocalStorage();
        this.selectedNoteId = null;
        this.loadNotes();
        
        if (this.notes.length === 0) {
            this.createNote();
        }
    }

    saveNote() {
        const note = this.notes.find(n => n.id === this.selectedNoteId);
        if (note) {
            note.title = this.elements.noteTitle.value;
            this.saveToLocalStorage();
            this.loadNotes();
        }
    }

    loadNotes() {
        this.elements.notesList.innerHTML = '';
        this.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = `note-item ${note.id === this.selectedNoteId ? 'active' : ''}`;
            noteElement.innerHTML = `
                <div class="note-item-title">${note.title}</div>
                <small>${new Date(note.created).toLocaleDateString()}</small>
            `;
            noteElement.addEventListener('click', () => this.selectNote(note.id));
            this.elements.notesList.appendChild(noteElement);
        });
    }

    selectNote(noteId) {
        this.selectedNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.elements.noteTitle.value = note.title;
            this.renderSubnotes(note);
        }
    }

    renderSubnotes(note) {
        this.elements.subnotesContainer.innerHTML = '';
        
        note.subnotes.forEach((subnote, index) => {
            const isLast = index === note.subnotes.length - 1;
            const subnoteElement = this.createSubnoteElement(subnote, isLast, index);
            this.elements.subnotesContainer.appendChild(subnoteElement);
        });

        // Scroll to bottom after render
        this.elements.subnotesContainer.scrollTop = this.elements.subnotesContainer.scrollHeight;
    }

    createSubnoteElement(subnote, isLast, index) {
        const subnoteElement = document.createElement('div');
        subnoteElement.className = 'subnote';
        subnoteElement.innerHTML = `
            <textarea class="subnote-content" 
                placeholder="Enter subnote content..."
                data-subnote-id="${subnote.id}"
            >${subnote.content}</textarea>
            <div class="subnote-actions">
                ${isLast ? '<button class="btn subnote-action-btn add">Add</button>' : ''}
                <button class="btn subnote-action-btn remove">Remove</button>
                <button class="btn subnote-action-btn copy">Copy</button>
                <button class="btn subnote-action-btn paste">Paste</button>
            </div>
        `;

        const textarea = subnoteElement.querySelector('.subnote-content');
        this.initTextareaEvents(textarea, subnote, index);
        this.initActionButtons(subnoteElement, subnote, index);
        
        return subnoteElement;
    }

    initTextareaEvents(textarea, subnote, index) {
        const autoExpand = () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        };
        
        autoExpand();
        textarea.addEventListener('input', () => {
            this.saveSubnoteContent(this.selectedNoteId, subnote.id, textarea.value);
            autoExpand();
        });
    }

    initActionButtons(subnoteElement, subnote, index) {
        if (subnoteElement.querySelector('.add')) {
            subnoteElement.querySelector('.add').addEventListener('click', () => {
                this.addSubnote(this.selectedNoteId, index + 1);
            });
        }
        
        subnoteElement.querySelector('.remove').addEventListener('click', () => {
            this.removeSubnote(this.selectedNoteId, subnote.id);
        });
        
        subnoteElement.querySelector('.copy').addEventListener('click', () => {
            this.copySubnoteContent(subnoteElement.querySelector('textarea').value);
        });
        
        subnoteElement.querySelector('.paste').addEventListener('click', async () => {
            const text = await navigator.clipboard.readText();
            const textarea = subnoteElement.querySelector('textarea');
            textarea.value += text;
            this.saveSubnoteContent(this.selectedNoteId, subnote.id, textarea.value);
        });
    }

    addSubnote(noteId, insertIndex) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            // Create new subnote at correct position
            const newSubnote = this.createSubnote();
            note.subnotes.splice(insertIndex, 0, newSubnote);
            
            // Update UI and storage
            this.renderSubnotes(note);
            this.saveToLocalStorage();
            
            // Focus new subnote
            setTimeout(() => {
                const newTextarea = this.elements.subnotesContainer
                    .querySelector(`[data-subnote-id="${newSubnote.id}"]`);
                newTextarea.focus();
            }, 50);
        }
    }


    removeSubnote(noteId, subnoteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.subnotes = note.subnotes.filter(sn => sn.id !== subnoteId);
            this.renderSubnotes(note);
            this.saveToLocalStorage();
        }
    }

    saveSubnoteContent(noteId, subnoteId, content) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            const subnote = note.subnotes.find(sn => sn.id === subnoteId);
            if (subnote) {
                subnote.content = content;
            }
        }
    }

    copySubnoteContent(content) {
        navigator.clipboard.writeText(content);
    }

    saveToLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
}

new NoteManager();