const itemInput = document.getElementById('item-input');
const dueDateInput = document.getElementById('due-date-input');
const addBtn = document.getElementById('add-btn');
const bucketList = document.getElementById('bucket-list');
const completedList = document.getElementById('completed-list');
const countDiv = document.getElementById('count');
const progressBar = document.getElementById('progress-bar-inner');
const filterBar = document.getElementById('filter-bar');
const clearCompletedBtn = document.getElementById('clear-completed');
const quoteDiv = document.getElementById('quote');
const darkToggle = document.getElementById('dark-toggle');

const STORAGE_KEY = 'bucketListItems';
const DARK_KEY = 'bucketListDarkMode';
const FILTER_KEY = 'bucketListFilter';

let items = [];
let filter = localStorage.getItem(FILTER_KEY) || 'all';
let addInProgress = false;

const QUOTES = [
    "Dream big, start small.",
    "The best time for new beginnings is now.",
    "Adventure awaits!",
    "Do something today your future self will thank you for.",
    "Life is short. Make it count.",
    "Collect moments, not things.",
    "Every accomplishment starts with the decision to try."
    "Believe in yourself."
];

function showRandomQuote() {
    const idx = Math.floor(Math.random() * QUOTES.length);
    quoteDiv.textContent = QUOTES[idx];
}

function setDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark');
        localStorage.setItem(DARK_KEY, '1');
        darkToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem(DARK_KEY, '0');
        darkToggle.textContent = '🌙';
    }
}

darkToggle.addEventListener('click', () => {
    setDarkMode(!document.body.classList.contains('dark'));
});

function loadDarkMode() {
    setDarkMode(localStorage.getItem(DARK_KEY) === '1');
}

function loadItems() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        items = JSON.parse(data);
    } else {
        items = [];
    }
}

function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function saveFilter() {
    localStorage.setItem(FILTER_KEY, filter);
}

function render() {
    bucketList.innerHTML = '';
    completedList.innerHTML = '';
    let completedCount = 0;
    let visibleCount = 0;
    let total = items.length;

    const now = new Date();

    items.forEach(item => {
        const show =
            filter === 'all' ||
            (filter === 'active' && !item.completed) ||
            (filter === 'completed' && item.completed);
        if (!show) return;
        visibleCount++;

        const li = document.createElement('li');
        li.className = item.completed ? 'completed' : '';
        if (item.dueDate && !item.completed && new Date(item.dueDate) < now) {
            li.classList.add('overdue');
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'item-title';
        if (item.editing) {
            titleSpan.classList.add('editing');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = item.title;
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') finishEdit(item.id, input.value);
                if (e.key === 'Escape') cancelEdit(item.id);
            });
            input.addEventListener('blur', () => finishEdit(item.id, input.value));
            setTimeout(() => input.focus(), 0);
            titleSpan.appendChild(input);
        } else {
            titleSpan.textContent = item.title;
            titleSpan.addEventListener('dblclick', () => startEdit(item.id));
        }
        li.appendChild(titleSpan);

        const meta = document.createElement('span');
        meta.className = 'item-meta';
        if (item.dueDate) {
            const due = new Date(item.dueDate);
            meta.textContent = `Due: ${due.toLocaleDateString()}`;
        }
        li.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        if (!item.completed) {
            const completeBtn = document.createElement('button');
            completeBtn.className = 'action-btn';
            completeBtn.title = 'Mark as Completed';
            completeBtn.innerHTML = '✔️';
            completeBtn.onclick = () => markCompleted(item.id);
            actions.appendChild(completeBtn);
        }

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit';
        editBtn.title = 'Edit Item';
        editBtn.innerHTML = '✏️';
        editBtn.onclick = () => startEdit(item.id);
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn';
        deleteBtn.title = 'Delete Item';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = () => deleteItem(item.id);
        actions.appendChild(deleteBtn);

        li.appendChild(actions);

        if (item.completed) {
            completedList.appendChild(li);
            completedCount++;
        } else {
            bucketList.appendChild(li);
        }
    });

    countDiv.textContent = `Completed: ${completedCount} / ${total}`;
    const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    progressBar.style.width = percent + '%';
    progressBar.style.background = percent === 100 ? 'var(--accent)' : 'var(--primary)';
}

function addItem() {
    if (addInProgress) return;
    addInProgress = true;
    const title = itemInput.value.trim();
    const dueDate = dueDateInput.value ? dueDateInput.value : null;
    if (!title) {
        addInProgress = false;
        return;
    }
    const newItem = {
        title,
        completed: false,
        id: Date.now().toString(),
        dueDate,
        editing: false
    };
    items.push(newItem);
    saveItems();
    render();
    itemInput.value = '';
    dueDateInput.value = '';
    itemInput.focus();
    addInProgress = false;
}

function markCompleted(id) {
    const item = items.find(i => i.id === id);
    if (item) {
        item.completed = true;
        saveItems();
        render();
    }
}

function deleteItem(id) {
    items = items.filter(i => i.id !== id);
    saveItems();
    render();
}

function startEdit(id) {
    items = items.map(i => ({ ...i, editing: i.id === id }));
    render();
}

function finishEdit(id, newTitle) {
    items = items.map(i =>
        i.id === id ? { ...i, title: newTitle.trim() || i.title, editing: false } : { ...i, editing: false }
    );
    saveItems();
    render();
}

function cancelEdit(id) {
    items = items.map(i => ({ ...i, editing: false }));
    render();
}

addBtn.addEventListener('click', addItem);
itemInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addItem();
});
dueDateInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addItem();
});

filterBar.addEventListener('click', e => {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        filter = e.target.getAttribute('data-filter');
        saveFilter();
        render();
    }
});

clearCompletedBtn.addEventListener('click', () => {
    items = items.filter(i => !i.completed);
    saveItems();
    render();
});

function applyFilterUI() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) btn.classList.add('active');
    });
}

function loadFilterUI() {
    applyFilterUI();
}

// Initial load
showRandomQuote();
loadDarkMode();
loadItems();
loadFilterUI();
render(); 
