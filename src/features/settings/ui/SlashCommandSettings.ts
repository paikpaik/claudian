import type { App, ToggleComponent } from 'obsidian';
import { Modal, Notice, setIcon, Setting } from 'obsidian';

import type { SlashCommand } from '../../../core/types';
import { t } from '../../../i18n';
import type ClaudianPlugin from '../../../main';
import { extractFirstParagraph, isSkill, normalizeArgumentHint, parseSlashCommandContent, validateCommandName } from '../../../utils/slashCommand';

function resolveAllowedTools(inputValue: string, parsedTools?: string[]): string[] | undefined {
  const trimmed = inputValue.trim();
  if (trimmed) {
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (parsedTools && parsedTools.length > 0) {
    return parsedTools;
  }
  return undefined;
}

export class SlashCommandModal extends Modal {
  private plugin: ClaudianPlugin;
  private existingCmd: SlashCommand | null;
  private onSave: (cmd: SlashCommand) => Promise<void>;

  constructor(
    app: App,
    plugin: ClaudianPlugin,
    existingCmd: SlashCommand | null,
    onSave: (cmd: SlashCommand) => Promise<void>
  ) {
    super(app);
    this.plugin = plugin;
    this.existingCmd = existingCmd;
    this.onSave = onSave;
  }

  onOpen() {
    const existingIsSkill = this.existingCmd ? isSkill(this.existingCmd) : false;
    let selectedType: 'command' | 'skill' = existingIsSkill ? 'skill' : 'command';

    const typeLabel = () => selectedType === 'skill' ? t('settings.slashCommands.modal.typeSkill') : t('settings.slashCommands.modal.typeCommand');

    this.setTitle(this.existingCmd
      ? t('settings.slashCommands.modal.titleEdit', { type: typeLabel() })
      : t('settings.slashCommands.modal.titleAdd', { type: typeLabel() }));
    this.modalEl.addClass('claudian-sp-modal');

    const { contentEl } = this;

    let nameInput: HTMLInputElement;
    let descInput: HTMLInputElement;
    let hintInput: HTMLInputElement;
    let modelInput: HTMLInputElement;
    let toolsInput: HTMLInputElement;
    let disableModelToggle: boolean = this.existingCmd?.disableModelInvocation ?? false;
    let disableUserInvocation: boolean = this.existingCmd?.userInvocable === false;
    let contextValue: 'fork' | '' = this.existingCmd?.context ?? '';
    let agentInput: HTMLInputElement;

    /* eslint-disable prefer-const -- assigned in Setting callbacks */
    let disableUserSetting!: Setting;
    let disableUserToggle!: ToggleComponent;
    /* eslint-enable prefer-const */

    const updateSkillOnlyFields = () => {
      const isSkillType = selectedType === 'skill';
      disableUserSetting.settingEl.style.display = isSkillType ? '' : 'none';
      if (!isSkillType) {
        disableUserInvocation = false;
        disableUserToggle.setValue(false);
      }
    };

    new Setting(contentEl)
      .setName(t('settings.slashCommands.modal.typeLabel'))
      .setDesc(t('settings.slashCommands.modal.typeDesc'))
      .addDropdown(dropdown => {
        dropdown
          .addOption('command', t('settings.slashCommands.modal.typeCommand'))
          .addOption('skill', t('settings.slashCommands.modal.typeSkill'))
          .setValue(selectedType)
          .onChange(value => {
            selectedType = value as 'command' | 'skill';
            this.setTitle(this.existingCmd
              ? t('settings.slashCommands.modal.titleEdit', { type: typeLabel() })
              : t('settings.slashCommands.modal.titleAdd', { type: typeLabel() }));
            updateSkillOnlyFields();
          });
        if (this.existingCmd) {
          dropdown.setDisabled(true);
        }
      });

    new Setting(contentEl)
      .setName(t('settings.slashCommands.modal.name'))
      .setDesc(t('settings.slashCommands.modal.nameDesc'))
      .addText(text => {
        nameInput = text.inputEl;
        text.setValue(this.existingCmd?.name || '')
          .setPlaceholder(t('settings.slashCommands.modal.namePlaceholder'));
      });

    new Setting(contentEl)
      .setName(t('settings.slashCommands.modal.description'))
      .setDesc(t('settings.slashCommands.modal.descriptionDesc'))
      .addText(text => {
        descInput = text.inputEl;
        text.setValue(this.existingCmd?.description || '');
      });

    const details = contentEl.createEl('details', { cls: 'claudian-sp-advanced-section' });
    details.createEl('summary', {
      text: t('settings.slashCommands.modal.advancedOptions'),
      cls: 'claudian-sp-advanced-summary',
    });
    if (this.existingCmd?.argumentHint || this.existingCmd?.model || this.existingCmd?.allowedTools?.length ||
        this.existingCmd?.disableModelInvocation || this.existingCmd?.userInvocable === false ||
        this.existingCmd?.context || this.existingCmd?.agent) {
      details.open = true;
    }

    new Setting(details)
      .setName(t('settings.slashCommands.modal.argumentHint'))
      .setDesc(t('settings.slashCommands.modal.argumentHintDesc'))
      .addText(text => {
        hintInput = text.inputEl;
        text.setValue(this.existingCmd?.argumentHint || '');
      });

    new Setting(details)
      .setName(t('settings.slashCommands.modal.model'))
      .setDesc(t('settings.slashCommands.modal.modelDesc'))
      .addText(text => {
        modelInput = text.inputEl;
        text.setValue(this.existingCmd?.model || '')
          .setPlaceholder(t('settings.slashCommands.modal.modelPlaceholder'));
      });

    new Setting(details)
      .setName(t('settings.slashCommands.modal.allowedTools'))
      .setDesc(t('settings.slashCommands.modal.allowedToolsDesc'))
      .addText(text => {
        toolsInput = text.inputEl;
        text.setValue(this.existingCmd?.allowedTools?.join(', ') || '');
      });

    new Setting(details)
      .setName(t('settings.slashCommands.modal.disableModelInvocation'))
      .setDesc(t('settings.slashCommands.modal.disableModelInvocationDesc'))
      .addToggle(toggle => {
        toggle.setValue(disableModelToggle)
          .onChange(value => { disableModelToggle = value; });
      });

    disableUserSetting = new Setting(details)
      .setName(t('settings.slashCommands.modal.disableUserInvocation'))
      .setDesc(t('settings.slashCommands.modal.disableUserInvocationDesc'))
      .addToggle(toggle => {
        disableUserToggle = toggle;
        toggle.setValue(disableUserInvocation)
          .onChange(value => { disableUserInvocation = value; });
      });

    updateSkillOnlyFields();

    new Setting(details)
      .setName(t('settings.slashCommands.modal.context'))
      .setDesc(t('settings.slashCommands.modal.contextDesc'))
      .addToggle(toggle => {
        toggle.setValue(contextValue === 'fork')
          .onChange(value => {
            contextValue = value ? 'fork' : '';
            agentSetting.settingEl.style.display = value ? '' : 'none';
          });
      });

    const agentSetting = new Setting(details)
      .setName(t('settings.slashCommands.modal.agent'))
      .setDesc(t('settings.slashCommands.modal.agentDesc'))
      .addText(text => {
        agentInput = text.inputEl;
        text.setValue(this.existingCmd?.agent || '')
          .setPlaceholder(t('settings.slashCommands.modal.agentPlaceholder'));
      });
    agentSetting.settingEl.style.display = contextValue === 'fork' ? '' : 'none';

    new Setting(contentEl)
      .setName(t('settings.slashCommands.modal.prompt'))
      .setDesc(t('settings.slashCommands.modal.promptDesc'));

    const contentArea = contentEl.createEl('textarea', {
      cls: 'claudian-sp-content-area',
      attr: {
        rows: '10',
        placeholder: t('settings.slashCommands.modal.promptPlaceholder'),
      },
    });
    const initialContent = this.existingCmd
      ? parseSlashCommandContent(this.existingCmd.content).promptContent
      : '';
    contentArea.value = initialContent;

    const buttonContainer = contentEl.createDiv({ cls: 'claudian-sp-modal-buttons' });

    const cancelBtn = buttonContainer.createEl('button', {
      text: t('common.cancel'),
      cls: 'claudian-cancel-btn',
    });
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = buttonContainer.createEl('button', {
      text: t('common.save'),
      cls: 'claudian-save-btn',
    });
    saveBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const nameError = validateCommandName(name);
      if (nameError) {
        new Notice(nameError);
        return;
      }

      const content = contentArea.value;
      if (!content.trim()) {
        new Notice(t('settings.slashCommands.promptRequired'));
        return;
      }

      const existing = this.plugin.settings.slashCommands.find(
        c => c.name.toLowerCase() === name.toLowerCase() &&
             c.id !== this.existingCmd?.id
      );
      if (existing) {
        new Notice(t('settings.slashCommands.duplicateName', { name }));
        return;
      }

      const parsed = parseSlashCommandContent(content);
      const promptContent = parsed.promptContent;

      const isSkillType = selectedType === 'skill';
      const id = this.existingCmd?.id ||
        (isSkillType
          ? `skill-${name}`
          : `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

      const cmd: SlashCommand = {
        id,
        name,
        description: descInput.value.trim() || parsed.description || undefined,
        argumentHint: normalizeArgumentHint(hintInput.value.trim()) || parsed.argumentHint || undefined,
        model: modelInput.value.trim() || parsed.model || undefined,
        allowedTools: resolveAllowedTools(toolsInput.value, parsed.allowedTools),
        content: promptContent,
        source: isSkillType ? 'user' : undefined,
        disableModelInvocation: disableModelToggle || undefined,
        userInvocable: disableUserInvocation ? false : undefined,
        context: contextValue || undefined,
        agent: contextValue === 'fork' ? (agentInput.value.trim() || undefined) : undefined,
      };

      try {
        await this.onSave(cmd);
      } catch {
        const label = isSkillType ? t('settings.slashCommands.modal.typeSkill') : t('settings.slashCommands.modal.typeCommand');
        new Notice(t('settings.slashCommands.saveFailed', { label }));
        return;
      }
      this.close();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    };
    contentEl.addEventListener('keydown', handleKeyDown);
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class SlashCommandSettings {
  private containerEl: HTMLElement;
  private plugin: ClaudianPlugin;

  constructor(containerEl: HTMLElement, plugin: ClaudianPlugin) {
    this.containerEl = containerEl;
    this.plugin = plugin;
    this.render();
  }

  private render(): void {
    this.containerEl.empty();

    const headerEl = this.containerEl.createDiv({ cls: 'claudian-sp-header' });
    headerEl.createSpan({ text: t('settings.slashCommands.name'), cls: 'claudian-sp-label' });

    const actionsEl = headerEl.createDiv({ cls: 'claudian-sp-header-actions' });

    const addBtn = actionsEl.createEl('button', {
      cls: 'claudian-settings-action-btn',
      attr: { 'aria-label': 'Add' },
    });
    setIcon(addBtn, 'plus');
    addBtn.addEventListener('click', () => this.openCommandModal(null));

    const commands = this.plugin.settings.slashCommands;

    if (commands.length === 0) {
      const emptyEl = this.containerEl.createDiv({ cls: 'claudian-sp-empty-state' });
      emptyEl.setText(t('settings.slashCommands.noCommands'));
      return;
    }

    const listEl = this.containerEl.createDiv({ cls: 'claudian-sp-list' });

    for (const cmd of commands) {
      this.renderCommandItem(listEl, cmd);
    }
  }

  private renderCommandItem(listEl: HTMLElement, cmd: SlashCommand): void {
    const itemEl = listEl.createDiv({ cls: 'claudian-sp-item' });

    const infoEl = itemEl.createDiv({ cls: 'claudian-sp-info' });

    const headerRow = infoEl.createDiv({ cls: 'claudian-sp-item-header' });

    const nameEl = headerRow.createSpan({ cls: 'claudian-sp-item-name' });
    nameEl.setText(`/${cmd.name}`);

    if (isSkill(cmd)) {
      headerRow.createSpan({ text: 'skill', cls: 'claudian-slash-item-badge' });
    }

    if (cmd.argumentHint) {
      const hintEl = headerRow.createSpan({ cls: 'claudian-slash-item-hint' });
      hintEl.setText(cmd.argumentHint);
    }

    if (cmd.description) {
      const descEl = infoEl.createDiv({ cls: 'claudian-sp-item-desc' });
      descEl.setText(cmd.description);
    }

    const actionsEl = itemEl.createDiv({ cls: 'claudian-sp-item-actions' });

    const editBtn = actionsEl.createEl('button', {
      cls: 'claudian-settings-action-btn',
      attr: { 'aria-label': 'Edit' },
    });
    setIcon(editBtn, 'pencil');
    editBtn.addEventListener('click', () => this.openCommandModal(cmd));

    if (!isSkill(cmd)) {
      const convertBtn = actionsEl.createEl('button', {
        cls: 'claudian-settings-action-btn',
        attr: { 'aria-label': 'Convert to skill' },
      });
      setIcon(convertBtn, 'package');
      convertBtn.addEventListener('click', async () => {
        try {
          await this.transformToSkill(cmd);
        } catch {
          new Notice(t('settings.slashCommands.convertFailed'));
        }
      });
    }

    const deleteBtn = actionsEl.createEl('button', {
      cls: 'claudian-settings-action-btn claudian-settings-delete-btn',
      attr: { 'aria-label': 'Delete' },
    });
    setIcon(deleteBtn, 'trash-2');
    deleteBtn.addEventListener('click', async () => {
      try {
        await this.deleteCommand(cmd);
      } catch {
        const label = isSkill(cmd) ? t('settings.slashCommands.modal.typeSkill') : t('settings.slashCommands.modal.typeCommand');
        new Notice(t('settings.slashCommands.deleteFailed', { label }));
      }
    });
  }

  private openCommandModal(existingCmd: SlashCommand | null): void {
    const modal = new SlashCommandModal(
      this.plugin.app,
      this.plugin,
      existingCmd,
      async (cmd) => {
        await this.saveCommand(cmd, existingCmd);
      }
    );
    modal.open();
  }

  private storageFor(cmd: SlashCommand) {
    return isSkill(cmd) ? this.plugin.storage.skills : this.plugin.storage.commands;
  }

  private async saveCommand(cmd: SlashCommand, existing: SlashCommand | null): Promise<void> {
    // Save new file first (safer: if this fails, old file still exists)
    await this.storageFor(cmd).save(cmd);

    // Delete old file only after successful save (if name changed)
    if (existing && existing.name !== cmd.name) {
      await this.storageFor(existing).delete(existing.id);
    }

    await this.reloadCommands();

    this.render();
    const label = isSkill(cmd) ? t('settings.slashCommands.modal.typeSkill') : t('settings.slashCommands.modal.typeCommand');
    const key = existing ? 'settings.slashCommands.updated' : 'settings.slashCommands.created';
    new Notice(t(key, { label, name: cmd.name }));
  }

  private async deleteCommand(cmd: SlashCommand): Promise<void> {
    await this.storageFor(cmd).delete(cmd.id);

    await this.reloadCommands();

    this.render();
    const label = isSkill(cmd) ? t('settings.slashCommands.modal.typeSkill') : t('settings.slashCommands.modal.typeCommand');
    new Notice(t('settings.slashCommands.deleted', { label, name: cmd.name }));
  }

  private async transformToSkill(cmd: SlashCommand): Promise<void> {
    const skillName = cmd.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);

    const existingSkill = this.plugin.settings.slashCommands.find(
      c => isSkill(c) && c.name === skillName
    );
    if (existingSkill) {
      new Notice(t('settings.slashCommands.duplicateSkill', { name: skillName }));
      return;
    }

    const description = cmd.description || extractFirstParagraph(cmd.content);

    const skill: SlashCommand = {
      ...cmd,
      id: `skill-${skillName}`,
      name: skillName,
      description,
      source: 'user',
    };

    await this.plugin.storage.skills.save(skill);
    await this.plugin.storage.commands.delete(cmd.id);

    await this.reloadCommands();
    this.render();
    new Notice(t('settings.slashCommands.convertedToSkill', { name: cmd.name }));
  }

  private async reloadCommands(): Promise<void> {
    this.plugin.settings.slashCommands = await this.plugin.storage.loadAllSlashCommands();
  }

  public refresh(): void {
    this.render();
  }
}
