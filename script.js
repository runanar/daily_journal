
const dailyNoteTitleInput = document.getElementById('dailyNoteTitle'); 
const dailyNoteText = document.getElementById('dailyNoteText'); 
const moodSelect = document.getElementById('moodSelect'); 
const backgroundColorPicker = document.getElementById('backgroundColorPicker'); 
const saveNoteButton = document.getElementById('saveNoteButton'); 
const notesList = document.getElementById('notesList'); 


document.addEventListener('DOMContentLoaded', () => {
    fetchNotes(); 
});


saveNoteButton.addEventListener('click', () => {
    const noteTitle = dailyNoteTitleInput.value.trim(); 
    const noteContent = dailyNoteText.value.trim(); 
    const selectedMood = moodSelect.value; 
    const selectedBackgroundColor = backgroundColorPicker.value; 

    
    if (!noteTitle) {
        alert('Lütfen günlüğünüz için bir başlık girin!');
        return; 
    }

    
    if (!noteContent && !selectedMood) {
        alert('Lütfen bir günlük notu girin veya bir ruh hali seçin!');
        return;
    }

    
    saveNote(noteTitle, noteContent, selectedMood, selectedBackgroundColor);

   
    dailyNoteTitleInput.value = ''; 
    dailyNoteText.value = ''; 
    moodSelect.value = ''; 
    backgroundColorPicker.value = '#ffffff'; 
});


async function saveNote(title, content, mood, background_color) {
    try {
        const response = await fetch('/api/notes', { 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            
            body: JSON.stringify({
                title: title,
                content: content,
                mood: mood,
                background_color: background_color
            })
        });

        if (!response.ok) { 
            const errorData = await response.json(); 
            throw new Error(errorData.error || 'Not kaydedilemedi.'); 
        }

        const newNote = await response.json(); 
        addNoteToDisplay(newNote); 
        alert('Günlük başarıyla kaydedildi!');

    } catch (error) {
        console.error('Not kaydederken hata oluştu:', error);
        alert('Günlük kaydedilirken bir sorun oluştu: ' + error.message);
    }
}


async function fetchNotes() {
    try {
        const response = await fetch('/api/notes'); 

        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error(errorData.error || 'Günlükler getirilemedi.');
        }

        const notes = await response.json(); 
        notesList.innerHTML = ''; 

        if (notes.length === 0) {
            notesList.innerHTML = '<p>Henüz bir günlük girdisi yok.</p>'; 
        } else {
            
            notes.forEach(note => {
                addNoteToDisplay(note);
            });
        }

    } catch (error) {
        console.error('Günlükleri getirirken hata oluştu:', error);
        notesList.innerHTML = '<p>Günlükler yüklenirken bir hata oluştu.</p>';
    }
}


function addNoteToDisplay(note) {
    
    const noNotesMessage = notesList.querySelector('p');
    if (noNotesMessage && noNotesMessage.textContent === 'Henüz bir günlük girdisi yok.') {
        notesList.innerHTML = '';
    }

    const noteItem = document.createElement('div'); 
    noteItem.classList.add('note-item'); 
    noteItem.dataset.id = note.id; 

    
    noteItem.style.backgroundColor = note.background_color || '#f9f9f9'; 

    
    const date = new Date(note.created_at).toLocaleString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    
    const moodEmojis = {
        'mutlu': '😊',
        'uzgun': '😢',
        'sinirli': '😠',
        'yorgun': '😴',
        'endise': '😟',
        'sakin': '😌',
        'heyecanli': '🤩',
        'normal': '🙂'
    };
    
    const displayMood = note.mood ? `${note.mood.charAt(0).toUpperCase() + note.mood.slice(1)} ${moodEmojis[note.mood] || ''}` : 'Belirtilmedi';

    
    noteItem.innerHTML = `
        <div class="note-header">
            <h3>${note.title}</h3> <p><strong>Tarih:</strong> ${date} | <strong>Ruh Hali:</strong> ${displayMood}</p>
            <button class="delete-button" data-id="${note.id}">Sil</button>
        </div>
        <div class="note-content"> <p>${note.content}</p>
        </div>
    `;

    
    const noteTitleElement = noteItem.querySelector('.note-header h3');
    noteTitleElement.addEventListener('click', () => {
        noteItem.classList.toggle('open'); 
    });

    
    const deleteButton = noteItem.querySelector('.delete-button');
    deleteButton.addEventListener('click', async (event) => {
        const noteId = event.target.dataset.id; 
        if (confirm('Bu günlük notunu silmek istediğinizden emin misiniz?')) {
            await deleteNote(noteId); 
        }
    });

    notesList.prepend(noteItem); 
}


async function deleteNote(id) {
    try {
        const response = await fetch(`/api/notes/${id}`, { 
            method: 'DELETE' 
        });

        if (!response.ok) {
            const text = await response.text();
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || 'Not silinemedi.');
            } catch (jsonError) {
                throw new Error(`Not silinemedi. Sunucu yanıtı: ${text || response.statusText}`);
            }
        }

        
        if (response.status === 204) { 
            const noteItemToRemove = document.querySelector(`.note-item[data-id="${id}"]`);
            if (noteItemToRemove) {
                noteItemToRemove.remove();
                alert('Günlük başarıyla silindi!');
            }
        } else { 
            const result = await response.json();
            const noteItemToRemove = document.querySelector(`.note-item[data-id="${id}"]`);
            if (noteItemToRemove) {
                noteItemToRemove.remove();
                alert(result.message || 'Günlük başarıyla silindi!');
            }
        }

        
        if (notesList.children.length === 0) {
            notesList.innerHTML = '<p>Henüz bir günlük girdisi yok.</p>';
        }

    } catch (error) {
        console.error('Not silerken hata oluştu:', error);
        alert('Günlük silinirken bir sorun oluştu: ' + error.message);
    }
}