# Dart vs Python: Simple Cheatsheet & Under-the-Hood Guide

An interactive cheatsheet comparing the entire **Dart** (Dart 3+) and **Python** (Python 3.10+ / 3.12+) languages side-by-side, strictly grounded in their official documentation:
- **Dart**: [dart.dev](https://dart.dev)
- **Python**: [docs.python.org](https://docs.python.org)

Now featuring **interactive text annotations**, a **persistent Side Notes drawer**, and **permanent local storage**.

---

## Quick Start

Open `index.html` directly in your browser:
```bash
open index.html
```

Or run via Python's built-in HTTP server:
```bash
python3 -m http.server 8080
```
Then visit `http://localhost:8080`.

---

## 📝 Features

1. **Text-Selection Comments**:
   - Highlight any text (syntax, code line, or runtime explanation).
   - Click the floating `💬 Add Comment` tooltip.
   - Saves a comment anchored to that exact text, highlighting it on the page.
   - Clicking highlighted text later jumps straight to the comment in your drawer.

2. **Side Notes Drawer**:
   - Access anytime via the `📝 Notes` button in the header.
   - Create general side notes or view all existing comments with timestamps and links back to topics.

3. **Permanent Storage & Backup**:
   - **Auto-Persist**: Automatically saved to browser `localStorage` on every keystroke/change. Survives browser restarts.
   - **Export JSON**: One-click download of all notes (`dart-python-cheatsheet-notes.json`).
   - **Export Markdown**: Clean `.md` export with quotes and timestamps for Obsidian/Notion.
   - **Import JSON**: Upload your backup to restore notes on any device.

4. **Official Documentation Grounding**:
   - Every card has direct clickable links (`dart.dev ↗` and `docs.python.org ↗`).
   - "In Reality" sections explain low-level execution pipelines, memory allocation, and concurrency mechanics.
