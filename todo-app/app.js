(function() {
  const STORAGE_KEY = 'todos-v1';
  const state = { todos: [], filter: 'all' };

  // DOM refs
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const empty = document.getElementById('empty');
  const counter = document.getElementById('counter');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn[data-filter]'));
  const clearCompletedBtn = document.getElementById('clear-completed');

  // Load
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) state.todos = saved;
  } catch {}

  // Helpers
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
  const nextId = () => Date.now() + Math.random().toString(16).slice(2);

  function setFilter(f) {
    state.filter = f;
    for (const btn of filterButtons) {
      const active = btn.dataset.filter === f;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    }
    render();
  }

  function filteredTodos() {
    switch (state.filter) {
      case 'active': return state.todos.filter(t => !t.completed);
      case 'completed': return state.todos.filter(t => t.completed);
      default: return state.todos;
    }
  }

  function render() {
    const items = filteredTodos();
    list.innerHTML = '';
    if (state.todos.length === 0) {
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }

    for (const t of items) {
      const li = document.createElement('li');
      li.className = 'item';
      li.dataset.id = t.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = t.completed;
      checkbox.setAttribute('aria-label', 'Toggle complete');
      checkbox.addEventListener('change', () => toggle(t.id));

      const label = document.createElement('div');
      label.className = 'label' + (t.completed ? ' completed' : '');
      label.textContent = t.text;
      label.title = 'Double‑click to edit';
      label.addEventListener('dblclick', () => startEdit(t.id, label));

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.type = 'button';
      editBtn.title = 'Edit';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => startEdit(t.id, label));

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn danger';
      delBtn.type = 'button';
      delBtn.title = 'Delete';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', () => remove(t.id));

      actions.append(editBtn, delBtn);
      li.append(checkbox, label, actions);
      list.appendChild(li);
    }

    const remaining = state.todos.filter(t => !t.completed).length;
    counter.textContent = `${remaining} item${remaining === 1 ? '' : 's'} left`;
  }

  // CRUD
  function add(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    state.todos.unshift({ id: nextId(), text: trimmed, completed: false });
    save();
    render();
  }
  function toggle(id) {
    const t = state.todos.find(x => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    render();
  }
  function remove(id) {
    const idx = state.todos.findIndex(x => x.id === id);
    if (idx >= 0) {
      state.todos.splice(idx, 1);
      save();
      render();
    }
  }
  function update(id, newText) {
    const t = state.todos.find(x => x.id === id);
    if (!t) return;
    const trimmed = newText.trim();
    if (!trimmed) { remove(id); return; }
    t.text = trimmed;
    save();
    render();
  }

  // Editing UI
  function startEdit(id, labelEl) {
    const li = labelEl.closest('.item');
    if (!li) return;
    const t = state.todos.find(x => x.id === id);
    if (!t) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = t.text;
    input.setAttribute('aria-label', 'Edit task');
    const finish = (commit) => {
      li.replaceChild(labelEl, input);
      if (commit) update(id, input.value);
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      else if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));

    li.replaceChild(input, labelEl);
    input.focus();
    input.select();
  }

  // Events
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    add(input.value);
    input.value = '';
    input.focus();
  });

  filterButtons.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));

  clearCompletedBtn.addEventListener('click', () => {
    const before = state.todos.length;
    state.todos = state.todos.filter(t => !t.completed);
    if (state.todos.length !== before) { save(); render(); }
  });

  // Initial render
  render();
})();
