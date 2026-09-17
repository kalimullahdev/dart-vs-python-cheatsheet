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
  const tabTextMode = document.getElementById('tab-text-mode');
  const tabHtmlMode = document.getElementById('tab-html-mode');
  const textEditorContainer = document.getElementById('text-editor-container');
  const htmlEditorContainer = document.getElementById('html-editor-container');
  const richToolbar = document.getElementById('rich-toolbar');
  const richFormatBlock = document.getElementById('rich-format-block');
  const richTextColor = document.getElementById('rich-text-color');
  const richBgColor = document.getElementById('rich-bg-color');
  const richEditorCanvas = document.getElementById('rich-editor-canvas');
  const richCodeBtn = document.getElementById('rich-code-btn');
  const richCodeBlockBtn = document.getElementById('rich-code-block-btn');
  const richLinkBtn = document.getElementById('rich-link-btn');
  const richImageBtn = document.getElementById('rich-image-btn');
  const richTableBtn = document.getElementById('rich-table-btn');
  const calloutInfoBtn = document.getElementById('callout-info-btn');
  const calloutWarnBtn = document.getElementById('callout-warn-btn');
  const calloutSuccessBtn = document.getElementById('callout-success-btn');
  const calloutTipBtn = document.getElementById('callout-tip-btn');
  const richStatsIndicator = document.getElementById('rich-stats-indicator');
  const noteInput = document.getElementById('note-input');
  const htmlCodeInput = document.getElementById('html-code-input');
  const htmlPreviewFrame = document.getElementById('html-preview-frame');
  const saveNoteBtn = document.getElementById('save-note-btn');
  const notesList = document.getElementById('notes-list');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportMdBtn = document.getElementById('export-md-btn');
  const importFileInput = document.getElementById('import-file-input');

  // Simple Popover Elements (Preview Only for HTML comments)
  const commentPopover = document.getElementById('comment-popover');
  const popoverBadge = document.getElementById('popover-badge');
  const popoverCloseBtn = document.getElementById('popover-close-btn');
  const popoverText = document.getElementById('popover-text');
  const popoverPreviewContainer = document.getElementById('popover-preview-container');
  const popoverIframe = document.getElementById('popover-iframe');
  const popoverTime = document.getElementById('popover-time');
  const popoverDeleteBtn = document.getElementById('popover-delete-btn');
  let activePopoverNoteId = null;

  let activeCategory = 'all';
  let isStackedView = localStorage.getItem('cheat_view') === 'stacked';

  // Notes State
  const STORAGE_KEY = 'DART_PYTHON_USER_NOTES_V1';
  let userNotes = loadNotes();
  let pendingQuote = null;
  let pendingCardId = null;
  let pendingCardTitle = null;
  let currentNoteMode = 'text'; // 'text' or 'html'

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
    if (currentNoteMode === 'html') {
      if (richEditorCanvas) {
        richEditorCanvas.focus();
      } else if (htmlCodeInput) {
        htmlCodeInput.focus();
      }
    } else {
      noteInput.focus();
    }
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

  // -------------------------------------------------------------
  // 3-Section HTML Editor Synchronization & Comprehensive Rich Toolbar
  // -------------------------------------------------------------
  let isSyncing = false;

  function updateRichStats() {
    if (!richEditorCanvas || !richStatsIndicator) return;
    const text = richEditorCanvas.innerText || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    richStatsIndicator.textContent = `${words} word${words === 1 ? '' : 's'} • ${chars} character${chars === 1 ? '' : 's'}`;
  }

  function syncFromRichText() {
    if (isSyncing || !richEditorCanvas || !htmlCodeInput) return;
    isSyncing = true;
    const html = richEditorCanvas.innerHTML;
    htmlCodeInput.value = html;
    if (htmlPreviewFrame) {
      htmlPreviewFrame.srcdoc = formatHtmlDocument(html);
    }
    updateRichStats();
    isSyncing = false;
  }

  function syncFromHtmlCode() {
    if (isSyncing || !richEditorCanvas || !htmlCodeInput) return;
    isSyncing = true;
    const html = htmlCodeInput.value;
    richEditorCanvas.innerHTML = html;
    if (htmlPreviewFrame) {
      htmlPreviewFrame.srcdoc = formatHtmlDocument(html);
    }
    updateRichStats();
    isSyncing = false;
  }

  // Rich Text Toolbar Actions
  if (richToolbar && richEditorCanvas) {
    // 1. Standard command buttons
    richToolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        richEditorCanvas.focus();
        const cmd = btn.getAttribute('data-cmd');
        const val = btn.getAttribute('data-val') || null;
        document.execCommand(cmd, false, val);
        syncFromRichText();
      });
    });

    // 2. Paragraph / Heading Format Dropdown
    if (richFormatBlock) {
      richFormatBlock.addEventListener('change', (e) => {
        richEditorCanvas.focus();
        const tag = e.target.value;
        document.execCommand('formatBlock', false, tag);
        syncFromRichText();
      });
    }

    // 3. Text Color & Highlight Pickers
    if (richTextColor) {
      richTextColor.addEventListener('input', (e) => {
        richEditorCanvas.focus();
        document.execCommand('foreColor', false, e.target.value);
        syncFromRichText();
      });
    }

    if (richBgColor) {
      richBgColor.addEventListener('input', (e) => {
        richEditorCanvas.focus();
        document.execCommand('hiliteColor', false, e.target.value);
        syncFromRichText();
      });
    }

    // 4. Inline Code
    if (richCodeBtn) {
      richCodeBtn.addEventListener('mousedown', (e) => e.preventDefault());
      richCodeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        richEditorCanvas.focus();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          const codeEl = document.createElement('code');
          codeEl.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeEl);
          range.selectNodeContents(codeEl);
        } else {
          document.execCommand('insertHTML', false, '<code>code</code>');
        }
        syncFromRichText();
      });
    }

    // 5. Code Block
    if (richCodeBlockBtn) {
      richCodeBlockBtn.addEventListener('mousedown', (e) => e.preventDefault());
      richCodeBlockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        richEditorCanvas.focus();
        const selection = window.getSelection();
        let codeSnippet = '// Write code here...';
        if (selection && !selection.isCollapsed) {
          codeSnippet = selection.toString();
        }
        const preHtml = `<pre><code>${escapeHtml(codeSnippet)}</code></pre><p><br></p>`;
        document.execCommand('insertHTML', false, preHtml);
        syncFromRichText();
      });
    }

    // 6. Link & Image
    if (richLinkBtn) {
      richLinkBtn.addEventListener('mousedown', (e) => e.preventDefault());
      richLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        richEditorCanvas.focus();
        const url = prompt('Enter link URL (e.g. https://...):', 'https://');
        if (url && url.trim()) {
          document.execCommand('createLink', false, url.trim());
          syncFromRichText();
        }
      });
    }

    if (richImageBtn) {
      richImageBtn.addEventListener('mousedown', (e) => e.preventDefault());
      richImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        richEditorCanvas.focus();
        const url = prompt('Enter Image URL (e.g. https://...):', 'https://');
        if (url && url.trim()) {
          const imgHtml = `<img src="${escapeAttr(url.trim())}" alt="Note image" style="max-width: 100%; border-radius: 4px; margin: 6px 0;" /><p><br></p>`;
          document.execCommand('insertHTML', false, imgHtml);
          syncFromRichText();
        }
      });
    }

    // 7. Table Generator
    if (richTableBtn) {
      richTableBtn.addEventListener('mousedown', (e) => e.preventDefault());
      richTableBtn.addEventListener('click', (e) => {
        e.preventDefault();
        richEditorCanvas.focus();
        const tableHtml = `<table>
  <thead>
    <tr><th>Feature</th><th>Dart</th><th>Python</th></tr>
  </thead>
  <tbody>
    <tr><td>Example 1</td><td>Dart implementation</td><td>Python equivalent</td></tr>
    <tr><td>Example 2</td><td>Compiled AOT</td><td>Interpreted Bytecode</td></tr>
  </tbody>
</table><p><br></p>`;
        document.execCommand('insertHTML', false, tableHtml);
        syncFromRichText();
      });
    }

    // 8. Custom Callout Alert Boxes
    function insertCallout(type, icon, title) {
      richEditorCanvas.focus();
      const calloutHtml = `<div class="editor-callout ${type}"><strong>${icon} ${title}:</strong> Add your analysis here...</div><p><br></p>`;
      document.execCommand('insertHTML', false, calloutHtml);
      syncFromRichText();
    }

    if (calloutInfoBtn) {
      calloutInfoBtn.addEventListener('mousedown', (e) => e.preventDefault());
      calloutInfoBtn.addEventListener('click', () => insertCallout('info', '💡', 'Info'));
    }
    if (calloutWarnBtn) {
      calloutWarnBtn.addEventListener('mousedown', (e) => e.preventDefault());
      calloutWarnBtn.addEventListener('click', () => insertCallout('warning', '⚠️', 'Warning'));
    }
    if (calloutSuccessBtn) {
      calloutSuccessBtn.addEventListener('mousedown', (e) => e.preventDefault());
      calloutSuccessBtn.addEventListener('click', () => insertCallout('success', '✅', 'Success'));
    }
    if (calloutTipBtn) {
      calloutTipBtn.addEventListener('mousedown', (e) => e.preventDefault());
      calloutTipBtn.addEventListener('click', () => insertCallout('tip', '🚀', 'Performance Tip'));
    }

    // Canvas Events
    richEditorCanvas.addEventListener('input', syncFromRichText);
    richEditorCanvas.addEventListener('keyup', (e) => {
      if (['Enter', 'Backspace', 'Delete'].includes(e.key)) {
        syncFromRichText();
      }
    });
  }

  if (htmlCodeInput) {
    htmlCodeInput.addEventListener('input', syncFromHtmlCode);
  }

  // HTML / Plain Text Mode Tabs
  if (tabTextMode && tabHtmlMode) {
    tabTextMode.addEventListener('click', () => {
      currentNoteMode = 'text';
      tabTextMode.classList.add('active');
      tabHtmlMode.classList.remove('active');
      if (textEditorContainer) textEditorContainer.style.display = 'block';
      if (htmlEditorContainer) htmlEditorContainer.style.display = 'none';
      notesDrawer.classList.remove('expanded-html');
      noteInput.focus();
    });

    tabHtmlMode.addEventListener('click', () => {
      currentNoteMode = 'html';
      tabHtmlMode.classList.add('active');
      tabTextMode.classList.remove('active');
      if (textEditorContainer) textEditorContainer.style.display = 'none';
      if (htmlEditorContainer) htmlEditorContainer.style.display = 'block';
      notesDrawer.classList.add('expanded-html');
      
      // If rich editor is empty but plain text input has text, transfer it
      if (richEditorCanvas && !richEditorCanvas.innerHTML.trim() && noteInput.value.trim()) {
        richEditorCanvas.innerHTML = '<p>' + escapeHtml(noteInput.value.trim()) + '</p>';
        syncFromRichText();
      } else {
        syncFromRichText();
      }

      if (richEditorCanvas) {
        richEditorCanvas.focus();
      }
    });
  }

  // Save Note
  saveNoteBtn.addEventListener('click', () => {
    let content = '';
    const isHtmlMode = currentNoteMode === 'html';

    if (isHtmlMode) {
      content = (htmlCodeInput ? htmlCodeInput.value.trim() : '') || (richEditorCanvas ? richEditorCanvas.innerHTML.trim() : '');
      if (!content || content === '<br>' || content === '<p><br></p>') {
        showToast('Please enter note content in the editor!');
        if (richEditorCanvas) richEditorCanvas.focus();
        return;
      }
    } else {
      content = noteInput.value.trim();
      if (!content) {
        showToast('Please enter note text!');
        noteInput.focus();
        return;
      }
    }

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      cardId: pendingCardId || null,
      cardTitle: pendingCardTitle || null,
      quote: pendingQuote || null,
      content: content,
      isHtml: isHtmlMode,
      createdAt: new Date().toISOString()
    };

    userNotes.unshift(newNote);
    saveNotes(userNotes);

    if (isHtmlMode) {
      if (htmlCodeInput) htmlCodeInput.value = '';
      if (richEditorCanvas) richEditorCanvas.innerHTML = '';
      if (htmlPreviewFrame) htmlPreviewFrame.srcdoc = formatHtmlDocument('');
    } else {
      noteInput.value = '';
    }

    clearPendingQuote();
    renderNotesList();
    applyStoredHighlights();
    showToast(isHtmlMode ? 'HTML note saved permanently!' : 'Note saved permanently!');
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

      const typeBadge = note.isHtml 
        ? `<span style="display:inline-block; font-size:0.62rem; font-weight:700; background:#2563eb; color:#fff; border-radius:3px; padding:1px 5px; margin-left:6px;">HTML</span>`
        : '';

      let contentHtml = '';
      if (note.isHtml) {
        contentHtml = `
          <div class="saved-note-html-preview" style="margin-top:0.4rem; border:1px solid var(--border-color); border-radius:4px; overflow:hidden;">
            <div style="font-family:var(--font-mono); font-size:0.7rem; max-height:70px; overflow:hidden; background:var(--bg-code); color:#94a3b8; padding:5px 8px; border-bottom:1px solid var(--border-color);">
              ${escapeHtml(note.content.length > 160 ? note.content.substring(0, 160) + '...' : note.content)}
            </div>
            <iframe style="width:100%; height:110px; border:none; background:#ffffff; display:block;" sandbox="allow-same-origin" srcdoc="${escapeAttr(formatHtmlDocument(note.content))}"></iframe>
          </div>
        `;
      } else {
        contentHtml = `<div class="saved-note-content">${escapeHtml(note.content)}</div>`;
      }

      return `
        <div class="saved-note-item" data-note-id="${note.id}">
          <div class="saved-note-header">
            <div>
              ${topicLink}
              ${typeBadge}
            </div>
            <span>${dateStr}</span>
          </div>
          ${quoteHtml}
          ${contentHtml}
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

  // Highlight Text in Cards (Multi-node text matching)
  function applyStoredHighlights() {
    userNotes.forEach(note => {
      if (!note.quote) return;
      let targetContainer = null;
      if (note.cardId) {
        targetContainer = document.getElementById(note.cardId);
      }
      if (!targetContainer) {
        targetContainer = cardsContainer;
      }
      if (targetContainer) {
        highlightTextInElement(targetContainer, note.quote, note.id);
      }
    });

    // Attach click listener on highlights to show simple comment popover directly above text
    document.querySelectorAll('mark.user-highlight').forEach(mark => {
      mark.onclick = (e) => {
        e.stopPropagation();
        const noteId = mark.getAttribute('data-note-id');
        const note = userNotes.find(n => n.id === noteId);
        if (note) {
          showCommentPopover(mark, note);
        }
      };
    });
  }

  function highlightTextInElement(container, searchText, noteId) {
    if (!searchText) return;
    const target = searchText.trim();
    if (target.length < 2) return;

    // Avoid duplicate highlights for the same noteId
    if (container.querySelector(`mark.user-highlight[data-note-id="${noteId}"]`)) {
      return;
    }

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || node.nodeValue.length === 0) return NodeFilter.FILTER_REJECT;
        let parent = node.parentElement;
        while (parent && parent !== container) {
          if (parent.tagName === 'BUTTON' || parent.classList.contains('doc-link') || parent.classList.contains('user-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    let fullText = '';
    let curr;
    while ((curr = walker.nextNode())) {
      const start = fullText.length;
      fullText += curr.nodeValue;
      textNodes.push({
        node: curr,
        start: start,
        end: fullText.length
      });
    }

    // Match exact or normalized
    let matchIndex = fullText.indexOf(target);
    let matchLength = target.length;

    if (matchIndex === -1) {
      try {
        const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        const regex = new RegExp(escaped);
        const m = fullText.match(regex);
        if (m) {
          matchIndex = m.index;
          matchLength = m[0].length;
        }
      } catch (err) {}
    }

    if (matchIndex === -1) return;

    const matchEnd = matchIndex + matchLength;
    let startNode = null, startOffset = 0;
    let endNode = null, endOffset = 0;

    for (const item of textNodes) {
      if (!startNode && matchIndex >= item.start && matchIndex < item.end) {
        startNode = item.node;
        startOffset = matchIndex - item.start;
      }
      if (matchEnd > item.start && matchEnd <= item.end) {
        endNode = item.node;
        endOffset = matchEnd - item.start;
        break;
      }
    }

    if (!startNode || !endNode) return;

    try {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      const mark = document.createElement('mark');
      mark.className = 'user-highlight';
      mark.setAttribute('data-note-id', noteId);
      mark.title = 'Click to view note';

      const extracted = range.extractContents();
      mark.appendChild(extracted);
      range.insertNode(mark);
    } catch (err) {
      console.warn('Highlight insertion failed:', err);
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
      md += `### ${idx + 1}. ${n.cardTitle || 'General Side Note'}${n.isHtml ? ' (HTML Note)' : ''}\n`;
      if (n.quote) {
        md += `> "${n.quote}"\n\n`;
      }
      if (n.isHtml) {
        md += "```html\n" + n.content + "\n```\n\n";
      } else {
        md += `${n.content}\n\n`;
      }
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

  function formatHtmlDocument(rawHtml) {
    if (!rawHtml || !rawHtml.trim()) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:12px;font-size:13px;color:#94a3b8;font-style:italic;}</style></head><body>Live preview will render here...</body></html>`;
    }
    if (/<html/i.test(rawHtml) || /<!DOCTYPE/i.test(rawHtml)) {
      return rawHtml;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 12px;
      font-size: 13.5px;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
      word-break: break-word;
    }
    * { box-sizing: border-box; }
    h1, h2, h3, h4, h5, h6 { margin-top: 0.35rem; margin-bottom: 0.25rem; color: #0f172a; line-height: 1.25; }
    p { margin-top: 0; margin-bottom: 0.45rem; }
    blockquote {
      border-left: 3px solid #3b82f6;
      padding: 4px 10px;
      margin: 0.5rem 0;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 0 4px 4px 0;
      color: #334155;
      font-style: italic;
    }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #f1f5f9; color: #0284c7; padding: 2px 5px; border-radius: 4px; font-size: 12px; }
    pre { background: #0f172a; color: #f8fafc; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin: 0.5rem 0; }
    pre code { background: transparent; color: inherit; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.6rem 0; font-size: 12.5px; }
    table th, table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    table th { background: #f8fafc; font-weight: 700; color: #0f172a; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 0.75rem 0; }
    a { color: #2563eb; text-decoration: underline; }
    .editor-callout {
      padding: 8px 12px;
      border-radius: 6px;
      margin: 0.5rem 0;
      font-size: 13px;
      border-left: 4px solid;
    }
    .editor-callout.info { background: #eff6ff; border-color: #3b82f6; color: #1e3a8a; }
    .editor-callout.warning { background: #fffbeb; border-color: #f59e0b; color: #78350f; }
    .editor-callout.success { background: #ecfdf5; border-color: #10b981; color: #064e3b; }
    .editor-callout.tip { background: #faf5ff; border-color: #a855f7; color: #581c87; }
  </style>
</head>
<body>
  ${rawHtml}
</body>
</html>`;
  }

  // -------------------------------------------------------------
  // Simple Comment Popover (Shows directly above commented text)
  // When clicked on commented text, shows ONLY the preview section for HTML comments
  // -------------------------------------------------------------
  function showCommentPopover(mark, note) {
    activePopoverNoteId = note.id;

    if (note.isHtml) {
      commentPopover.classList.add('popover-html-mode');
      if (popoverBadge) popoverBadge.innerHTML = '🌐 HTML Comment';
      if (popoverText) popoverText.style.display = 'none';
      if (popoverPreviewContainer) popoverPreviewContainer.style.display = 'block';
      if (popoverIframe) popoverIframe.srcdoc = formatHtmlDocument(note.content);
    } else {
      commentPopover.classList.remove('popover-html-mode');
      if (popoverBadge) popoverBadge.innerHTML = '💬 Comment';
      if (popoverText) {
        popoverText.style.display = 'block';
        popoverText.textContent = note.content;
      }
      if (popoverPreviewContainer) popoverPreviewContainer.style.display = 'none';
    }

    const dateStr = new Date(note.createdAt).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    popoverTime.textContent = dateStr;

    // Reset styles to calculate natural geometry
    commentPopover.classList.remove('popover-below');
    commentPopover.style.display = 'block';

    const rect = mark.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let leftPos = rect.left + rect.width / 2 + scrollX;
    let topPos = rect.top + scrollY;

    commentPopover.style.left = leftPos + 'px';
    commentPopover.style.top = topPos + 'px';

    // Horizontal bounds clamp
    const popoverRect = commentPopover.getBoundingClientRect();
    const halfWidth = popoverRect.width / 2;
    if (popoverRect.left < 12) {
      commentPopover.style.left = (12 + halfWidth + scrollX) + 'px';
    } else if (popoverRect.right > window.innerWidth - 12) {
      commentPopover.style.left = (window.innerWidth - 12 - halfWidth + scrollX) + 'px';
    }

    // Vertical bounds check: if popover goes off the top, flip below
    if (popoverRect.top < 10) {
      commentPopover.classList.add('popover-below');
      commentPopover.style.top = (rect.bottom + scrollY + 12) + 'px';
    }
  }

  function hideCommentPopover() {
    if (commentPopover) {
      commentPopover.style.display = 'none';
      activePopoverNoteId = null;
    }
  }

  if (popoverCloseBtn) {
    popoverCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideCommentPopover();
    });
  }

  if (popoverDeleteBtn) {
    popoverDeleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activePopoverNoteId) return;
      const idToDelete = activePopoverNoteId;
      userNotes = userNotes.filter(n => n.id !== idToDelete);
      saveNotes(userNotes);
      renderNotesList();

      // Unwrap mark element
      document.querySelectorAll('mark.user-highlight[data-note-id="' + idToDelete + '"]').forEach(m => {
        const parent = m.parentNode;
        if (parent) {
          while (m.firstChild) parent.insertBefore(m.firstChild, m);
          parent.removeChild(m);
        }
      });

      hideCommentPopover();
      showToast('Comment deleted');
    });
  }

  // Hide popover on outside click or Escape key
  document.addEventListener('mousedown', (e) => {
    if (commentPopover && commentPopover.style.display === 'block') {
      if (!e.target.closest('#comment-popover') && !e.target.closest('mark.user-highlight')) {
        hideCommentPopover();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideCommentPopover();
    }
  });

  // Initialize
  renderCategoryPills();
  filterAndRenderCards();
  updateNotesBadge();
});
