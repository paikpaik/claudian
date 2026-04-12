import { type App, setIcon } from 'obsidian';

export interface FileChipsViewCallbacks {
  onRemoveAttachment: (path: string) => void;
  onOpenFile: (path: string) => void;
}

export class FileChipsView {
  private app: App;
  private containerEl: HTMLElement;
  private callbacks: FileChipsViewCallbacks;
  private fileIndicatorEl: HTMLElement;

  // Line count cache (cleared on vault modify events by FileContextManager)
  private lineCountCache: Map<string, number> = new Map();

  constructor(app: App, containerEl: HTMLElement, callbacks: FileChipsViewCallbacks) {
    this.app = app;
    this.containerEl = containerEl;
    this.callbacks = callbacks;

    const firstChild = this.containerEl.firstChild;
    this.fileIndicatorEl = this.containerEl.createDiv({ cls: 'claudian-file-indicator' });
    if (firstChild) {
      this.containerEl.insertBefore(this.fileIndicatorEl, firstChild);
    }
  }

  destroy(): void {
    this.fileIndicatorEl.remove();
  }

  /** Invalidate cached line count when a file is modified externally. */
  invalidateCache(path: string): void {
    this.lineCountCache.delete(path);
  }

  /** Max visible chips before collapsing. */
  private static readonly VISIBLE_LIMIT = 3;

  private expanded = false;

  /**
   * Render all context files as chips.
   * currentNote gets a brand-color left border; other files are plain.
   * When more than VISIBLE_LIMIT chips, shows "+N more" toggle.
   */
  renderFiles(currentNote: string | null, attachedFiles: Set<string>): void {
    this.fileIndicatorEl.empty();

    const totalFiles = attachedFiles.size + (currentNote && !attachedFiles.has(currentNote) ? 1 : 0);

    if (totalFiles === 0) {
      this.fileIndicatorEl.style.display = 'none';
      return;
    }

    this.fileIndicatorEl.style.display = 'flex';
    this.fileIndicatorEl.toggleClass('claudian-file-indicator--wrap', this.expanded);

    // Build ordered list: current note first, then others
    const ordered: { path: string; isCurrent: boolean }[] = [];
    if (currentNote) {
      ordered.push({ path: currentNote, isCurrent: true });
    }
    for (const path of attachedFiles) {
      if (path === currentNote) continue;
      ordered.push({ path, isCurrent: false });
    }

    const limit = this.expanded ? ordered.length : FileChipsView.VISIBLE_LIMIT;
    const hiddenCount = ordered.length - limit;

    for (let i = 0; i < Math.min(limit, ordered.length); i++) {
      const { path, isCurrent } = ordered[i];
      this.renderFileChip(path, isCurrent, () => {
        this.callbacks.onRemoveAttachment(path);
      });
    }

    // "+N more" / collapse toggle
    if (ordered.length > FileChipsView.VISIBLE_LIMIT) {
      const toggleEl = this.fileIndicatorEl.createDiv({ cls: 'claudian-file-chip claudian-file-chip--toggle' });
      if (this.expanded) {
        toggleEl.setText('접기');
      } else {
        toggleEl.setText(`+${hiddenCount}개`);
      }
      toggleEl.addEventListener('click', () => {
        this.expanded = !this.expanded;
        this.renderFiles(currentNote, attachedFiles);
      });
    }
  }

  /** Backward-compatible: render only current note. */
  renderCurrentNote(filePath: string | null): void {
    this.renderFiles(filePath, filePath ? new Set([filePath]) : new Set());
  }

  private renderFileChip(filePath: string, isCurrentNote: boolean, onRemove: () => void): void {
    const chipEl = this.fileIndicatorEl.createDiv({
      cls: `claudian-file-chip${isCurrentNote ? ' claudian-file-chip--current' : ''}`,
    });

    const iconEl = chipEl.createSpan({ cls: 'claudian-file-chip-icon' });
    setIcon(iconEl, 'file-text');

    const normalizedPath = filePath.replace(/\\/g, '/');
    const filename = normalizedPath.split('/').pop() || filePath;
    const nameEl = chipEl.createSpan({ cls: 'claudian-file-chip-name' });
    nameEl.setText(filename);
    nameEl.setAttribute('title', filePath);

    // Line count hint (async, updates chip after load)
    const hintEl = chipEl.createSpan({ cls: 'claudian-file-chip-lines' });
    this.loadLineCount(filePath, hintEl);

    const removeEl = chipEl.createSpan({ cls: 'claudian-file-chip-remove' });
    removeEl.setText('\u00D7');
    removeEl.setAttribute('aria-label', 'Remove');

    chipEl.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.claudian-file-chip-remove')) {
        this.callbacks.onOpenFile(filePath);
      }
    });

    removeEl.addEventListener('click', () => {
      onRemove();
    });
  }

  private async loadLineCount(filePath: string, el: HTMLElement): Promise<void> {
    // Check cache first
    const cached = this.lineCountCache.get(filePath);
    if (cached !== undefined) {
      el.setText(`(${cached}줄)`);
      return;
    }

    const file = this.app.vault.getFileByPath(filePath);
    if (!file) return;

    try {
      const content = await this.app.vault.cachedRead(file);
      const lines = content.split('\n').length;
      this.lineCountCache.set(filePath, lines);
      // Only update if element is still connected (chip not removed)
      if (el.isConnected) {
        el.setText(`(${lines}줄)`);
      }
    } catch {
      // File read failed — leave hint empty
    }
  }
}
