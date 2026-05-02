import { Modal, Notice, Setting } from 'obsidian';

import { ClickhouseClient } from '../../../core/db/ClickhouseClient';
import { MySqlClient } from '../../../core/db/MySqlClient';
import type { DbConnection, DbConnectionType } from '../../../core/db/types';
import type ClaudianPlugin from '../../../main';

const DEFAULT_PORT: Record<DbConnectionType, number> = { mysql: 3306, clickhouse: 8123 };

export class DbConnectionManager {
  private containerEl: HTMLElement;
  private plugin: ClaudianPlugin;
  private connections: DbConnection[] = [];

  constructor(containerEl: HTMLElement, plugin: ClaudianPlugin) {
    this.containerEl = containerEl;
    this.plugin = plugin;
    this.loadAndRender();
  }

  private async loadAndRender(): Promise<void> {
    this.connections = await this.plugin.storage.db.load();
    this.render();
  }

  private render(): void {
    this.containerEl.empty();

    const header = this.containerEl.createDiv({ cls: 'claudian-db-header' });
    header.createEl('span', { text: 'MySQL 데이터베이스', cls: 'claudian-db-title' });
    const addBtn = header.createEl('button', { text: '+ 연결 추가', cls: 'claudian-db-add-btn' });
    addBtn.addEventListener('click', () => this.openModal(null));

    if (this.connections.length === 0) {
      this.containerEl.createEl('p', {
        text: 'DB 연결이 없습니다. 연결을 추가하면 Claude가 자연어로 데이터를 조회할 수 있습니다.',
        cls: 'claudian-db-empty',
      });
      return;
    }

    const list = this.containerEl.createDiv({ cls: 'claudian-db-list' });
    for (const conn of this.connections) {
      this.renderItem(list, conn);
    }
  }

  private renderItem(listEl: HTMLElement, conn: DbConnection): void {
    const item = listEl.createDiv({ cls: 'claudian-db-item' });

    const info = item.createDiv({ cls: 'claudian-db-item-info' });
    const running = this.plugin.dbManager.isRunning(conn.id);

    const statusDot = info.createSpan({
      cls: `claudian-db-status ${running ? 'claudian-db-status--on' : 'claudian-db-status--off'}`,
    });
    statusDot.title = running ? '연결됨' : '연결 안 됨';

    info.createEl('strong', { text: conn.name, cls: 'claudian-db-item-name' });
    info.createEl('span', {
      text: conn.type === 'clickhouse' ? 'ClickHouse' : 'MySQL',
      cls: 'claudian-db-type-badge',
    });
    const dbLabel = conn.database ? ` / ${conn.database}` : '';
    info.createEl('span', {
      text: `${conn.host}:${conn.port}${dbLabel}`,
      cls: 'claudian-db-item-meta',
    });

    const actions = item.createDiv({ cls: 'claudian-db-item-actions' });

    const toggleBtn = actions.createEl('button', {
      text: conn.enabled ? '비활성화' : '활성화',
      cls: `claudian-db-btn ${conn.enabled ? 'claudian-db-btn--active' : ''}`,
    });
    toggleBtn.addEventListener('click', () => this.toggleConnection(conn));

    const editBtn = actions.createEl('button', { text: '편집', cls: 'claudian-db-btn' });
    editBtn.addEventListener('click', () => this.openModal(conn));

    const deleteBtn = actions.createEl('button', { text: '삭제', cls: 'claudian-db-btn claudian-db-btn--danger' });
    deleteBtn.addEventListener('click', () => this.deleteConnection(conn));
  }

  private openModal(existing: DbConnection | null): void {
    new DbConnectionModal(this.plugin.app, existing, async (conn) => {
      await this.saveConnection(conn, existing);
    }).open();
  }

  private async saveConnection(conn: DbConnection, existing: DbConnection | null): Promise<void> {
    if (existing) {
      const idx = this.connections.findIndex((c) => c.id === existing.id);
      if (idx !== -1) this.connections[idx] = conn;
    } else {
      this.connections.push(conn);
    }
    await this.plugin.dbManager.saveConnections(this.connections);
    this.render();
    new Notice(existing ? `"${conn.name}" 연결이 수정됐습니다.` : `"${conn.name}" 연결이 추가됐습니다.`);
  }

  private async toggleConnection(conn: DbConnection): Promise<void> {
    try {
      if (conn.enabled) {
        await this.plugin.dbManager.disableConnection(conn.id);
        new Notice(`"${conn.name}" 연결이 비활성화됐습니다.`);
      } else {
        await this.plugin.dbManager.enableConnection(conn.id);
        new Notice(`"${conn.name}" 연결됐습니다.`);
      }
      this.connections = this.plugin.dbManager.getConnections();
      this.render();
    } catch (err) {
      new Notice(`연결 실패: ${(err as Error).message}`);
    }
  }

  private async deleteConnection(conn: DbConnection): Promise<void> {
    await this.plugin.dbManager.disableConnection(conn.id);
    this.connections = this.connections.filter((c) => c.id !== conn.id);
    await this.plugin.dbManager.saveConnections(this.connections);
    this.render();
    new Notice(`"${conn.name}" 연결이 삭제됐습니다.`);
  }
}

// ─── Modal ───────────────────────────────────────────────────────────────────

class DbConnectionModal extends Modal {
  private onSave: (conn: DbConnection) => Promise<void>;
  private existing: DbConnection | null;

  constructor(
    app: any,
    existing: DbConnection | null,
    onSave: (conn: DbConnection) => Promise<void>
  ) {
    super(app);
    this.existing = existing;
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('claudian-db-modal');
    contentEl.createEl('h2', { text: this.existing ? '연결 편집' : '새 DB 연결' });

    const conn: Partial<DbConnection> = this.existing
      ? { ...this.existing }
      : { type: 'mysql', host: 'localhost', port: 3306, enabled: false };

    new Setting(contentEl).setName('연결 이름').addText((t) =>
      t.setValue(conn.name ?? '').onChange((v) => (conn.name = v))
    );

    // Type selector — port input updates automatically when type changes
    let portInput: HTMLInputElement;
    new Setting(contentEl)
      .setName('종류')
      .addDropdown((d) => {
        d.addOption('mysql', 'MySQL')
          .addOption('clickhouse', 'ClickHouse')
          .setValue(conn.type ?? 'mysql')
          .onChange((v) => {
            conn.type = v as DbConnectionType;
            if (portInput) portInput.value = String(DEFAULT_PORT[conn.type]);
            conn.port = DEFAULT_PORT[conn.type];
          });
      });

    new Setting(contentEl).setName('Host').addText((t) =>
      t.setValue(conn.host ?? 'localhost').onChange((v) => (conn.host = v))
    );
    new Setting(contentEl).setName('Port').addText((t) => {
      portInput = t.inputEl;
      t.setValue(String(conn.port ?? DEFAULT_PORT[conn.type ?? 'mysql']))
        .onChange((v) => (conn.port = Number(v) || DEFAULT_PORT[conn.type ?? 'mysql']));
    });
    new Setting(contentEl).setName('User').addText((t) =>
      t.setValue(conn.user ?? '').onChange((v) => (conn.user = v))
    );
    new Setting(contentEl)
      .setName('Password')
      .addText((t) => {
        t.inputEl.type = 'password';
        t.setValue(conn.password ?? '').onChange((v) => (conn.password = v));
      });
    new Setting(contentEl)
      .setName('Database')
      .setDesc('비워두면 서버 전체에 접근합니다. 여러 DB를 한 연결로 조회할 수 있습니다.')
      .addText((t) =>
        t
          .setPlaceholder('선택사항')
          .setValue(conn.database ?? '')
          .onChange((v) => (conn.database = v || undefined))
      );

    // Test + Save buttons
    const btnRow = contentEl.createDiv({ cls: 'claudian-db-modal-actions' });

    const testBtn = btnRow.createEl('button', { text: '연결 테스트', cls: 'claudian-db-btn' });
    testBtn.addEventListener('click', async () => {
      testBtn.disabled = true;
      testBtn.textContent = '테스트 중…';
      try {
        const c = conn as DbConnection;
        const client = c.type === 'clickhouse' ? new ClickhouseClient(c) : new MySqlClient(c);
        await client.connect();
        await client.disconnect();
        new Notice('연결 성공!');
      } catch (err) {
        new Notice(`연결 실패: ${(err as Error).message}`);
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = '연결 테스트';
      }
    });

    const saveBtn = btnRow.createEl('button', { text: '저장', cls: 'claudian-db-btn claudian-db-btn--primary' });
    saveBtn.addEventListener('click', async () => {
      if (!conn.name?.trim()) { new Notice('연결 이름을 입력하세요.'); return; }
      if (!conn.host?.trim()) { new Notice('Host를 입력하세요.'); return; }
      if (!conn.user?.trim()) { new Notice('User를 입력하세요.'); return; }

      const final: DbConnection = {
        id: this.existing?.id ?? crypto.randomUUID(),
        name: conn.name!.trim(),
        type: conn.type ?? 'mysql',
        host: conn.host!.trim(),
        port: conn.port ?? DEFAULT_PORT[conn.type ?? 'mysql'],
        user: conn.user!.trim(),
        password: conn.password ?? '',
        database: conn.database?.trim() || undefined,
        enabled: this.existing?.enabled ?? false,
      };
      await this.onSave(final);
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
