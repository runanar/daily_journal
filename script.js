// HTML elemanlarını seçme
const dailyNoteTitleInput = document.getElementById('dailyNoteTitle');
const dailyNoteText = document.getElementById('dailyNoteText');
const moodSelect = document.getElementById('moodSelect');
const backgroundColorPicker = document.getElementById('backgroundColorPicker');
const saveNoteButton = document.getElementById('saveNoteButton');
const notesList = document.getElementById('notesList');

// Sayfa yüklendiğinde mevcut notları localStorage'dan çek
document.addEventListener('DOMContentLoaded', () => {
    fetchNotesFromLocalStorage();
});

// "Kaydet" butonuna tıklama olayı
saveNoteButton.addEventListener('click', () => {
    const noteTitle = dailyNoteTitleInput.value.trim();
    const noteContent = dailyNoteText.value.trim();
    const selectedMood = moodSelect.value;
    const selectedBackgroundColor = backgroundColorPicker.value;

    // Başlık zorunlu kontrolü
    if (!noteTitle) {
        alert('Lütfen günlüğünüz için bir başlık girin!');
        return;
    }

    // İçerik veya ruh hali zorunlu kontrolü
    if (!noteContent && !selectedMood) {
        alert('Lütfen bir günlük notu girin veya bir ruh hali seçin!');
        return;
    }

    // Yeni not objesi oluştur
    const newNote = {
        id: Date.now().toString(), // Benzersiz ID için zaman damgası
        title: noteTitle,
        content: noteContent,
        mood: selectedMood,
        background_color: selectedBackgroundColor,
        created_at: new Date().toISOString() // Oluşturulma tarihi
    };

    // Notu localStorage'a kaydet
    saveNoteToLocalStorage(newNote);

    // Formu temizle
    dailyNoteTitleInput.value = '';
    dailyNoteText.value = '';
    moodSelect.value = '';
    backgroundColorPicker.value = '#ffffff';
});

// Notu localStorage'a kaydeden fonksiyon
function saveNoteToLocalStorage(note) {
    let notes = JSON.parse(localStorage.getItem('dailyNotes')) || [];
    notes.unshift(note); // Yeni notu en başa ekle
    localStorage.setItem('dailyNotes', JSON.stringify(notes));
    addNoteToDisplay(note); // Notu ekranda göster
    alert('Günlük başarıyla kaydedildi!');
}

// Notları localStorage'dan çeken fonksiyon
function fetchNotesFromLocalStorage() {
    notesList.innerHTML = ''; // Listeyi temizle
    let notes = JSON.parse(localStorage.getItem('dailyNotes')) || [];

    if (notes.length === 0) {
        notesList.innerHTML = '<p>Henüz bir günlük girdisi yok.</p>';
    } else {
        notes.forEach(note => {
            addNoteToDisplay(note);
        });
    }
}

// Notu ekranda gösteren fonksiyon (öncekiyle aynı, ID'ye göre silme eklendi)
function addNoteToDisplay(note) {
    const noNotesMessage = notesList.querySelector('p');
    if (noNotesMessage && noNotesMessage.textContent === 'Henüz bir günlük girdisi yok.') {
        notesList.innerHTML = '';
    }

    const noteItem = document.createElement('div');
    noteItem.classList.add('note-item');
    noteItem.dataset.id = note.id; // HTML öğesine ID ekle

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
    deleteButton.addEventListener('click', (event) => {
        const noteId = event.target.dataset.id;
        if (confirm('Bu günlük notunu silmek istediğinizden emin misiniz?')) {
            deleteNoteFromLocalStorage(noteId); // localStorage'dan silme fonksiyonunu çağır
        }
    });

    notesList.prepend(noteItem);
}

// Notu localStorage'dan silen fonksiyon
function deleteNoteFromLocalStorage(id) {
    let notes = JSON.parse(localStorage.getItem('dailyNotes')) || [];
    notes = notes.filter(note => note.id !== id); // Silinecek notu filtrele
    localStorage.setItem('dailyNotes', JSON.stringify(notes));

    // Ekrandan kaldır
    const noteItemToRemove = document.querySelector(`.note-item[data-id="${id}"]`);
    if (noteItemToRemove) {
        noteItemToRemove.remove();
        alert('Günlük başarıyla silindi!');
    }

    // Eğer hiç not kalmazsa mesajı göster
    if (notesList.children.length === 0) {
        notesList.innerHTML = '<p>Henüz bir günlük girdisi yok.</p>';
    }
}