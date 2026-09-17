// Dart vs Python Simple Cheatsheet - Controller
// Features: Side-by-side comparison, official doc links, text annotations, side notes, and permanent storage.

document.addEventListener('DOMContentLoaded', () => {
  // Core Elements
  const themeToggleBtn = document.getElementById('theme-toggle');
  const viewToggleBtn = document.getElementById('view-toggle');
  const searchInput = document.getElementById('search-input');
  const searchCount = document.getElementById('search-count');
  const categoryBar = document.getElementById('category-bar');
  const cardsContainer = document.getElementById('cards-container');
  const archTbody = document.getElementById('arch-tbody');
  const toast = document.getElementById('toast');

  // Notes & Tooltip Elements
  const notesToggleBtn = document.getElementById('notes-toggle-btn');
  const notesBadge = document.getElementById('notes-badge');
  const selectionTooltip = document.getElementById('selection-tooltip');
  const notesDrawer = document.getElementById('notes-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const quotePreviewBox = document.getElementById('quote-preview-box');
  const quotePreviewText = document.getElementById('quote-preview-text');
  const clearQuoteBtn = document.getElementById('clear-quote-btn');
  const noteInput = document.getElementById('note-input');
  const saveNoteBtn = document.getElementById('save-note-btn');
  const notesList = document.getElementById('notes-list');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportMdBtn = document.getElementById('export-md-btn');
  const importFileInput = document.getElementById('import-file-input');

  let activeCategory = 'all';
  let isStackedView = localStorage.getItem('cheat_view') === 'stacked';

  // Notes State
  const STORAGE_KEY = 'DART_PYTHON_USER_NOTES_V1';
  let userNotes = loadNotes();
  let pendingQuote = null;
  let pendingCardId = null;
  let pendingCardTitle = null;

  // -------------------------------------------------------------
  // 1. Theme Toggle
  // -------------------------------------------------------------
  const savedTheme = localStorage.getItem('cheat_theme') || 
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('cheat_theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }

  // -------------------------------------------------------------
  // 2. View Mode Toggle (Split vs Stacked)
  // -------------------------------------------------------------
  applyViewMode();

  viewToggleBtn.addEventListener('click', () => {
    isStackedView = !isStackedView;
    localStorage.setItem('cheat_view', isStackedView ? 'stacked' : 'split');
    applyViewMode();
  });

  function applyViewMode() {
    if (isStackedView) {
      cardsContainer.classList.add('stacked-view');
      viewToggleBtn.innerHTML = '<span>Stacked View</span>';
    } else {
      cardsContainer.classList.remove('stacked-view');
      viewToggleBtn.innerHTML = '<span>Split View</span>';
    }
  }

  // -------------------------------------------------------------
  // 3. Render Architecture Matrix
  // -------------------------------------------------------------
  if (archTbody && window.ARCHITECTURE_MATRIX) {
    archTbody.innerHTML = ARCHITECTURE_MATRIX.map(row => `
      <tr>
        <td style="font-weight: 600;">${escapeHtml(row.feature)}</td>
        <td class="dart">${escapeHtml(row.dart)}</td>
        <td class="python">${escapeHtml(row.python)}</td>
        <td style="color: var(--text-muted);">${escapeHtml(row.winner)}</td>
      </tr>
    `).join('');
  }

  // -------------------------------------------------------------
  // 4. Categories & Horizontal Navigation Pills
  // -------------------------------------------------------------
  const categories = Array.from(new Set(CHEATSHEET_DATA.map(item => item.category)));

  function renderCategoryPills() {
    let html = `<button class="cat-pill active" data-category="all">All Topics (${CHEATSHEET_DATA.length})</button>`;
    html += categories.map(cat => {
      const count = CHEATSHEET_DATA.filter(item => item.category === cat).length;
      return `<button class="cat-pill" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
    }).join('');
    categoryBar.innerHTML = html;

    categoryBar.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        categoryBar.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.getAttribute('data-category');

        if (activeCategory === 'all') {
          filterAndRenderCards();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          filterAndRenderCards();
          const targetSection = document.getElementById(`cat-${categoryToId(activeCategory)}`);
          if (targetSection) {
            const offset = 120;
            const top = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }
      });
    });
  }

  function categoryToId(cat) {
    return cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  // -------------------------------------------------------------
  // 5. Render Cheatsheet Cards
  // -------------------------------------------------------------
  function filterAndRenderCards() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = CHEATSHEET_DATA.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      const searchable = [
        item.title,
        item.summary,
        item.keyTakeaway,
        item.category,
        item.tags.join(' '),
        item.dart.code,
        item.dart.inReality,
        item.python.code,
        item.python.inReality
      ].join(' ').toLowerCase();

      return searchable.includes(query);
    });

    searchCount.textContent = `${filtered.length}`;

    if (filtered.length === 0) {
      cardsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.5rem;">No matching topics found</p>
          <p>Try searching for keywords like "null", "isolate", "async", "list", or "class".</p>
        </div>
      `;
      return;
    }

    // Group items by category
    const grouped = {};
    filtered.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    let html = '';
    for (const cat of categories) {
      if (!grouped[cat]) continue;
      const catId = categoryToId(cat);
      html += `
        <section class="section-group" id="cat-${catId}">
          <div class="section-heading">
            <span>${escapeHtml(cat)}</span>
            <span class="section-count">${grouped[cat].length} comparison${grouped[cat].length > 1 ? 's' : ''}</span>
          </div>
          ${grouped[cat].map(renderCard).join('')}
        </section>
      `;
    }

    cardsContainer.innerHTML = html;

    // Trigger Prism syntax highlighting
    if (window.Prism) {
      Prism.highlightAllUnder(cardsContainer);
    }

    // Apply user note highlights to text
    applyStoredHighlights();

    // Attach copy button listeners
    attachCopyListeners();
  }

  function renderCard(item) {
    const dartDocLink = item.dartDoc 
      ? `<a href="${item.dartDoc}" target="_blank" rel="noopener" class="doc-link" title="Open official dart.dev documentation">dart.dev ↗</a>` 
      : '';
    const pythonDocLink = item.pythonDoc 
      ? `<a href="${item.pythonDoc}" target="_blank" rel="noopener" class="doc-link" title="Open official docs.python.org documentation">docs.python.org ↗</a>` 
      : '';

    return `
      <article class="card" id="${item.id}" data-title="${escapeAttr(item.title)}">
        <!-- Card Header -->
        <div class="card-header">
          <div class="card-title-row">
            <h2 class="card-title">${escapeHtml(item.title)}</h2>
            <span class="card-key-takeaway">${escapeHtml(item.keyTakeaway)}</span>
          </div>
          <p class="card-summary">${escapeHtml(item.summary)}</p>
        </div>

        <!-- Code Comparison -->
        <div class="code-split">
          <!-- Dart Column -->
          <div class="code-pane">
            <div class="code-pane-bar">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="code-lang-label dart">Dart</span>
                ${dartDocLink}
              </div>
              <button class="copy-btn" data-copy="${escapeAttr(item.dart.code)}" title="Copy Dart code">Copy</button>
            </div>
            <div class="code-content">
              <pre><code class="language-dart">${escapeHtml(item.dart.code)}</code></pre>
            </div>
          </div>

          <!-- Python Column -->
          <div class="code-pane">
            <div class="code-pane-bar">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="code-lang-label python">Python</span>
                ${pythonDocLink}
              </div>
              <button class="copy-btn" data-copy="${escapeAttr(item.python.code)}" title="Copy Python code">Copy</button>
            </div>
            <div class="code-content">
              <pre><code class="language-python">${escapeHtml(item.python.code)}</code></pre>
            </div>
          </div>
        </div>

        <!-- In Reality Under-the-Hood Callout -->
        <div class="reality-box">
          <div class="reality-box-title">
            <span>⚡ In Reality (Under the Hood):</span>
          </div>
          <div class="reality-cols">
            <div>
              <div class="reality-col-heading dart">Dart Runtime / Compiler (dart.dev)</div>
              <div class="reality-body">${escapeHtml(item.dart.inReality)}</div>
            </div>
            <div>
              <div class="reality-col-heading python">CPython Interpreter / Heap (docs.python.org)</div>
              <div class="reality-body">${escapeHtml(item.python.inReality)}</div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // -------------------------------------------------------------
  // 6. Copy Listeners
  // -------------------------------------------------------------
  function attachCopyListeners() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(code).then(() => {
          showToast('Code copied to clipboard!');
          const origText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = origText; }, 1400);
        });
      });
    });
  }

  // -------------------------------------------------------------
  // 7. Search Debounce
  // -------------------------------------------------------------
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(filterAndRenderCards, 120);
  });

  // -------------------------------------------------------------
  // 8. Text Selection & Floating Comment Trigger
  // -------------------------------------------------------------
  function handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideSelectionTooltip();
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2) {
      hideSelectionTooltip();
      return;
    }

    // Check if selection is within the main cards container
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;
    const parentCard = (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode).closest('.card');
    if (!parentCard) {
      hideSelectionTooltip();
      return;
    }

    // Calculate position
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        hideSelectionTooltip();
        return;
      }

      selectionTooltip.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
      selectionTooltip.style.top = `${rect.top + window.scrollY}px`;
      selectionTooltip.style.display = 'flex';

      pendingQuote = selectedText;
      pendingCardId = parentCard.id;
      pendingCardTitle = parentCard.getAttribute('data-title') || parentCard.id;
    } catch (err) {
      hideSelectionTooltip();
    }
  }

  function hideSelectionTooltip() {
    selectionTooltip.style.display = 'none';
  }

  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('#selection-tooltip') || e.target.closest('#notes-drawer')) return;
    setTimeout(handleTextSelection, 10);
  });

  document.addEventListener('keyup', (e) => {
    if (['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      setTimeout(handleTextSelection, 10);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#selection-tooltip')) {
      hideSelectionTooltip();
    }
  });

  selectionTooltip.addEventListener('click', () => {
    hideSelectionTooltip();
    openNotesDrawerWithQuote(pendingQuote, pendingCardId, pendingCardTitle);
  });

  // -------------------------------------------------------------
  // 9. Side Notes Drawer & Storage Management
  // -------------------------------------------------------------
  notesToggleBtn.addEventListener('click', () => {
    openNotesDrawer();
  });

  drawerCloseBtn.addEventListener('click', () => {
    closeNotesDrawer();
  });

  drawerBackdrop.addEventListener('click', () => {
    closeNotesDrawer();
  });

  function openNotesDrawer() {
    notesDrawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    renderNotesList();
  }

  function openNotesDrawerWithQuote(quote, cardId, cardTitle) {
    openNotesDrawer();
    if (quote) {
      quotePreviewBox.style.display = 'flex';
      quotePreviewText.textContent = `"${quote.length > 120 ? quote.substring(0, 120) + '...' : quote}"`;
      pendingQuote = quote;
      pendingCardId = cardId;
      pendingCardTitle = cardTitle;
    }
    noteInput.focus();
  }

  function closeNotesDrawer() {
    notesDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    clearPendingQuote();
  }

  clearQuoteBtn.addEventListener('click', () => {
    clearPendingQuote();
  });

  function clearPendingQuote() {
    pendingQuote = null;
    pendingCardId = null;
    pendingCardTitle = null;
    quotePreviewBox.style.display = 'none';
    quotePreviewText.textContent = '';
  }

  // Save Note
  saveNoteBtn.addEventListener('click', () => {
    const content = noteInput.value.trim();
    if (!content) {
      showToast('Please enter note text!');
      noteInput.focus();
      return;
    }

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      cardId: pendingCardId || null,
      cardTitle: pendingCardTitle || null,
      quote: pendingQuote || null,
      content: content,
      createdAt: new Date().toISOString()
    };

    userNotes.unshift(newNote);
    saveNotes(userNotes);
    noteInput.value = '';
    clearPendingQuote();
    renderNotesList();
    applyStoredHighlights();
    showToast('Note saved permanently!');
  });

  function renderNotesList() {
    updateNotesBadge();

    if (userNotes.length === 0) {
      notesList.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
          <p style="margin-bottom: 0.35rem; font-weight: 600; color: var(--text-secondary);">No notes created yet</p>
          <p>Highlight any text on the page to comment, or write a general side note above!</p>
        </div>
      `;
      return;
    }

    notesList.innerHTML = userNotes.map(note => {
      const dateStr = new Date(note.createdAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const quoteHtml = note.quote 
        ? `<div class="saved-note-quote">"${escapeHtml(note.quote)}"</div>` 
        : '';

      const topicLink = note.cardTitle 
        ? `<span class="saved-note-card-title" data-card-id="${escapeAttr(note.cardId || '')}">${escapeHtml(note.cardTitle)}</span>` 
        : '<span>General Note</span>';

      return `
        <div class="saved-note-item" data-note-id="${note.id}">
          <div class="saved-note-header">
            ${topicLink}
            <span>${dateStr}</span>
          </div>
          ${quoteHtml}
          <div class="saved-note-content">${escapeHtml(note.content)}</div>
          <div class="saved-note-actions">
            ${note.cardId ? `<button class="note-action-btn jump-btn" data-card-id="${escapeAttr(note.cardId)}">Go to topic</button>` : ''}
            <button class="note-action-btn delete" data-delete-id="${note.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach jump & delete actions
    notesList.querySelectorAll('.jump-btn, .saved-note-card-title').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetCardId = btn.getAttribute('data-card-id');
        if (targetCardId) {
          const cardEl = document.getElementById(targetCardId);
          if (cardEl) {
            closeNotesDrawer();
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardEl.style.transition = 'outline 0.3s';
            cardEl.style.outline = '2px solid #3b82f6';
            setTimeout(() => { cardEl.style.outline = 'none'; }, 2000);
          }
        }
      });
    });

    notesList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idToDelete = btn.getAttribute('data-delete-id');
        userNotes = userNotes.filter(n => n.id !== idToDelete);
        saveNotes(userNotes);
        renderNotesList();
        filterAndRenderCards(); // Re-renders to clear removed highlights
        showToast('Note deleted');
      });
    });
  }

  function updateNotesBadge() {
    notesBadge.textContent = userNotes.length;
  }

  // Highlight Text in Cards
  function applyStoredHighlights() {
    userNotes.forEach(note => {
      if (!note.quote || !note.cardId) return;
      const card = document.getElementById(note.cardId);
      if (!card) return;

      highlightTextInElement(card, note.quote, note.id);
    });

    // Attach click listener on highlights to open notes
    document.querySelectorAll('mark.user-highlight').forEach(mark => {
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        const noteId = mark.getAttribute('data-note-id');
        openNotesDrawer();
        setTimeout(() => {
          const noteItem = notesList.querySelector(`[data-note-id="${noteId}"]`);
          if (noteItem) {
            noteItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            noteItem.style.outline = '2px solid #eab308';
            setTimeout(() => { noteItem.style.outline = 'none'; }, 2000);
          }
        }, 150);
      });
    });
  }

  function highlightTextInElement(container, searchText, noteId) {
    if (!searchText || searchText.length < 2) return;
    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.parentElement && (node.parentElement.tagName === 'MARK' || node.parentElement.tagName === 'BUTTON' || node.parentElement.classList.contains('doc-link'))) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currentNode;
    while ((currentNode = treeWalker.nextNode())) {
      const text = currentNode.nodeValue;
      const idx = text.indexOf(searchText);
      if (idx !== -1) {
        const range = document.createRange();
        range.setStart(currentNode, idx);
        range.setEnd(currentNode, idx + searchText.length);

        const mark = document.createElement('mark');
        mark.className = 'user-highlight';
        mark.setAttribute('data-note-id', noteId);
        mark.title = 'Click to view note';

        try {
          range.surroundContents(mark);
        } catch (e) {
          // In case selection crosses boundary
        }
        break; // Highlight first match per note
      }
    }
  }

  // -------------------------------------------------------------
  // 10. Permanent Storage & File Export / Import
  // -------------------------------------------------------------
  function loadNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
      return [];
    }
  }

  function saveNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to persist notes to localStorage', e);
    }
  }

  // Export JSON
  exportJsonBtn.addEventListener('click', () => {
    if (userNotes.length === 0) {
      showToast('No notes to export!');
      return;
    }
    const blob = new Blob([JSON.stringify(userNotes, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'dart-python-cheatsheet-notes.json');
    showToast('Exported notes as JSON backup!');
  });

  // Export Markdown
  exportMdBtn.addEventListener('click', () => {
    if (userNotes.length === 0) {
      showToast('No notes to export!');
      return;
    }
    let md = `# Dart vs Python Cheatsheet - My Notes & Comments\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n\n`;

    userNotes.forEach((n, idx) => {
      md += `### ${idx + 1}. ${n.cardTitle || 'General Side Note'}\n`;
      if (n.quote) {
        md += `> "${n.quote}"\n\n`;
      }
      md += `${n.content}\n\n`;
      md += `*Date: ${new Date(n.createdAt).toLocaleString()}*\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, 'dart-python-cheatsheet-notes.md');
    showToast('Exported notes as Markdown!');
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import JSON File
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) {
          showToast('Invalid notes JSON format');
          return;
        }

        // Merge notes avoiding duplicate IDs
        const existingIds = new Set(userNotes.map(n => n.id));
        let addedCount = 0;
        imported.forEach(note => {
          if (note.id && !existingIds.has(note.id)) {
            userNotes.push(note);
            addedCount++;
          }
        });

        saveNotes(userNotes);
        renderNotesList();
        applyStoredHighlights();
        showToast(`Imported ${addedCount} notes successfully!`);
      } catch (err) {
        showToast('Error reading imported file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // -------------------------------------------------------------
  // 11. Toast Helper
  // -------------------------------------------------------------
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  // Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;');
  }

  // Initialize
  renderCategoryPills();
  filterAndRenderCards();
  updateNotesBadge();
});
