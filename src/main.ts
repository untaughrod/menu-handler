import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	setIcon,
	MarkdownView,
} from 'obsidian';

interface FloatingMenuSettings {
	showBold: boolean;
	showItalic: boolean;
	showStrikethrough: boolean;
	showHighlight: boolean;
	showLink: boolean;
	showInternalLink: boolean;
	showCallout: boolean;
	showHr: boolean;
	showBulletList: boolean;
	showCheckbox: boolean;
	showHeading: boolean;
	showClearFormat: boolean;
	showUndo: boolean;
	hideWhenNoSelection: boolean;
	floatNearCursor: boolean;
}

const DEFAULT_SETTINGS: FloatingMenuSettings = {
	showBold: true,
	showItalic: true,
	showStrikethrough: true,
	showHighlight: true,
	showLink: true,
	showInternalLink: true,
	showCallout: true,
	showHr: true,
	showBulletList: true,
	showCheckbox: true,
	showHeading: true,
	showClearFormat: true,
	showUndo: true,
	hideWhenNoSelection: false,
	floatNearCursor: false,
};

export default class FloatingMenuPlugin extends Plugin {
	settings: FloatingMenuSettings;
	menuEl: HTMLElement;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FloatingMenuSettingTab(this.app, this));

		this.menuEl = document.createElement('div');
		this.menuEl.addClass('floating-context-menu');
		document.body.appendChild(this.menuEl);

		this.renderMenu();

		const updatePosition = () => {
			requestAnimationFrame(() => this.updateMenuVisibilityAndPosition());
		};

		this.registerDomEvent(document, 'mouseup', updatePosition);
		this.registerDomEvent(document, 'keyup', updatePosition);
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', updatePosition),
		);

		updatePosition();
	}

	updateMenuVisibilityAndPosition() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			this.menuEl.style.display = 'none';
			return;
		}

		const editor = view.editor;
		const selection = editor.getSelection();
		const hasSelection = selection.length > 0;

		if (this.settings.hideWhenNoSelection && !hasSelection) {
			this.menuEl.style.display = 'none';
			return;
		}

		this.menuEl.style.display = 'flex';

		if (this.settings.floatNearCursor) {
			const cursorPos = editor.getCursor('from');
			const coords = (editor as any).coordsAtPos(cursorPos);

			if (coords) {
				this.menuEl.style.bottom = 'auto';
				this.menuEl.style.top = `${coords.top - 50}px`;
				this.menuEl.style.left = `${coords.left}px`;
				this.menuEl.style.transform = 'translateX(-50%)';
			}
		} else {
			this.menuEl.style.top = 'auto';
			this.menuEl.style.bottom = '40px';
			this.menuEl.style.left = '50%';
			this.menuEl.style.transform = 'translateX(-50%)';
		}
	}

	renderMenu() {
		this.menuEl.empty();

		// --- Standard Formatting ---
		if (this.settings.showHeading) this.createHeadingDropdown();
		if (this.settings.showBold)
			this.createButton('bold', 'Bold', () =>
				this.toggleFormat('**', '**'),
			);
		if (this.settings.showItalic)
			this.createButton('italic', 'Italic', () =>
				this.toggleFormat('*', '*'),
			);
		if (this.settings.showStrikethrough)
			this.createButton('strikethrough', 'Strikethrough', () =>
				this.toggleFormat('~~', '~~'),
			);
		if (this.settings.showHighlight)
			this.createButton('highlighter', 'Highlight', () =>
				this.toggleFormat('==', '=='),
			);
		if (this.settings.showLink)
			this.createButton('link', 'Add Link', () =>
				this.toggleFormat('[', ']()'),
			);

		if (this.settings.showInternalLink)
			this.createButton('link-2', 'Internal Link', () =>
				this.toggleFormat('[[', ']]'),
			);

		// --- Block & List Formatting ---
		if (this.settings.showBulletList)
			this.createButton('list', 'Bullet List', () =>
				this.toggleLinePrefix('- '),
			);
		if (this.settings.showCheckbox)
			this.createButton('check-square', 'Checkbox', () =>
				this.toggleLinePrefix('- [ ] '),
			);
		if (this.settings.showCallout)
			this.createButton('message-square', 'Callout', () =>
				this.insertCallout(),
			);
		if (this.settings.showHr)
			this.createButton('minus', 'Horizontal Rule', () =>
				this.insertHorizontalRule(),
			);

		// --- Divider & Actions (The Right Side) ---
		const hasRightGroup =
			this.settings.showClearFormat || this.settings.showUndo;
		if (hasRightGroup) {
			this.menuEl.createEl('div', { cls: 'floating-menu-divider' });
			if (this.settings.showClearFormat)
				this.createButton('eraser', 'Clear Formatting', () =>
					this.clearFormatting(),
				);
			if (this.settings.showUndo)
				this.createButton('undo', 'Undo', () => this.triggerUndo());
		}
	}

	createButton(iconName: string, tooltip: string, onClick: () => void) {
		const btn = this.menuEl.createEl('button', {
			cls: 'floating-menu-btn',
		});
		btn.setAttribute('aria-label', tooltip);
		setIcon(btn, iconName);
		btn.addEventListener('click', () => {
			onClick();
			this.updateMenuVisibilityAndPosition();
		});
	}

	// Specialized function for the complex Heading button
	createHeadingDropdown() {
		// 1. Create the wrapper
		const wrapper = this.menuEl.createEl('div', { cls: 'heading-wrapper' });

		// 2. Create the main button
		const mainBtn = wrapper.createEl('button', {
			cls: 'floating-menu-btn',
		});
		mainBtn.setAttribute(
			'aria-label',
			'Heading (Click for H1, Hover for more)',
		);
		setIcon(mainBtn, 'heading');
		mainBtn.addEventListener('click', () => this.insertHeading(1));

		// 3. Create the hidden dropdown menu
		const dropdown = wrapper.createEl('div', { cls: 'heading-dropdown' });

		// 4. Add H1-H6 buttons inside the dropdown
		for (let i = 1; i <= 6; i++) {
			const hBtn = dropdown.createEl('button', {
				cls: 'heading-dropdown-item',
				text: `H${i}`,
			});
			hBtn.addEventListener('click', (e) => {
				e.stopPropagation(); // Prevents the main button click from firing
				this.insertHeading(i);
				this.updateMenuVisibilityAndPosition();
			});
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// --- Format Logic Helpers ---

	toggleFormat(before: string, after: string) {
		// (Unchanged from previous)
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const from = editor.getCursor('from');
		const to = editor.getCursor('to');
		const selection = editor.getSelection();

		const textBefore = editor.getRange(
			{ line: from.line, ch: Math.max(0, from.ch - before.length) },
			from,
		);
		const textAfter = editor.getRange(to, {
			line: to.line,
			ch: to.ch + after.length,
		});

		if (textBefore === before && textAfter === after) {
			editor.replaceRange(
				selection,
				{ line: from.line, ch: Math.max(0, from.ch - before.length) },
				{ line: to.line, ch: to.ch + after.length },
			);
			editor.setSelection(
				{ line: from.line, ch: from.ch - before.length },
				{ line: to.line, ch: to.ch - before.length },
			);
		} else if (selection.startsWith(before) && selection.endsWith(after)) {
			const innerText = selection.slice(
				before.length,
				selection.length - after.length,
			);
			editor.replaceSelection(innerText);
			editor.setSelection(
				{ line: from.line, ch: from.ch },
				{ line: to.line, ch: to.ch - before.length - after.length },
			);
		} else {
			if (selection) {
				editor.replaceSelection(`${before}${selection}${after}`);
			} else {
				editor.replaceRange(`${before}${after}`, from);
				editor.setCursor({
					line: from.line,
					ch: from.ch + before.length,
				});
			}
		}
		editor.focus();
	}

	insertCallout() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const selection = editor.getSelection();
		if (selection) {
			const calloutText =
				`> [!INFO]\n` +
				selection
					.split('\n')
					.map((line) => `> ${line}`)
					.join('\n');
			editor.replaceSelection(calloutText);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange(`> [!INFO]\n> `, cursor);
			editor.setCursor({ line: cursor.line + 1, ch: 2 });
		}
		editor.focus();
	}

	insertHorizontalRule() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const cursor = editor.getCursor();
		const lineText = editor.getLine(cursor.line);
		if (lineText.trim() === '') {
			editor.replaceRange(`---\n`, cursor);
			editor.setCursor({ line: cursor.line + 1, ch: 0 });
		} else {
			editor.replaceRange(`\n\n---\n`, cursor);
			editor.setCursor({ line: cursor.line + 3, ch: 0 });
		}
		editor.focus();
	}

	// New: Handle Heading insertion/replacement
	insertHeading(level: number) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const cursor = editor.getCursor();
		const lineText = editor.getLine(cursor.line);

		// Strip out existing heading hashes if they exist
		const strippedText = lineText.replace(/^#+\s/, '');

		// Apply the new heading
		const prefix = '#'.repeat(level) + ' ';
		editor.setLine(cursor.line, prefix + strippedText);
		editor.focus();
	}

	// New: Toggle list prefixes (Bullets or Checkboxes)
	toggleLinePrefix(prefix: string) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const selection = editor.getSelection();

		if (selection) {
			// Apply or remove from all selected lines
			const lines = selection.split('\n');
			const allHavePrefix = lines.every((line) =>
				line.trimStart().startsWith(prefix),
			);
			const newText = lines
				.map((line) =>
					allHavePrefix ? line.replace(prefix, '') : prefix + line,
				)
				.join('\n');
			editor.replaceSelection(newText);
		} else {
			// Apply or remove from single line
			const cursor = editor.getCursor();
			const lineText = editor.getLine(cursor.line);
			if (lineText.startsWith(prefix)) {
				editor.setLine(cursor.line, lineText.slice(prefix.length));
			} else {
				editor.setLine(cursor.line, prefix + lineText);
			}
		}
		editor.focus();
	}

	// New: Clear all formatting using Regular Expressions
	clearFormatting() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const selection = editor.getSelection();

		if (selection) {
			const cleaned = selection
				.replace(/(\*\*|__|==|~~|\*|_|`)/g, '') // Strips inline styles (bold, italic, code, highlight, strike)
				.replace(/^(#+\s|> \s?|-\s\[.?\]\s|-\s|\d+\.\s)/gm, ''); // Strips prefixes (headings, blockquotes, lists)
			editor.replaceSelection(cleaned);
		}
		editor.focus();
	}

	// New: Trigger Obsidian's native Undo
	triggerUndo() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.editor.undo();
			view.editor.focus();
		}
	}
}

class FloatingMenuSettingTab extends PluginSettingTab {
	plugin: FloatingMenuPlugin;

	constructor(app: App, plugin: FloatingMenuPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Menu Behavior' });

		new Setting(containerEl)
			.setName('Hide when no text is selected')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.hideWhenNoSelection)
					.onChange(async (value) => {
						this.plugin.settings.hideWhenNoSelection = value;
						await this.plugin.saveSettings();
						this.plugin.updateMenuVisibilityAndPosition();
					}),
			);

		new Setting(containerEl)
			.setName('Float near cursor')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.floatNearCursor)
					.onChange(async (value) => {
						this.plugin.settings.floatNearCursor = value;
						await this.plugin.saveSettings();
						this.plugin.updateMenuVisibilityAndPosition();
					}),
			);

		containerEl.createEl('h2', { text: 'Menu Buttons' });

		const addToggle = (name: string, key: keyof FloatingMenuSettings) => {
			new Setting(containerEl).setName(name).addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings[key] as boolean)
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[key] = value;
						await this.plugin.saveSettings();
						this.plugin.renderMenu();
						this.plugin.updateMenuVisibilityAndPosition();
					}),
			);
		};

		// Standard
		addToggle('Heading (H1-H6)', 'showHeading');
		addToggle('Bold', 'showBold');
		addToggle('Italic', 'showItalic');
		addToggle('Strikethrough', 'showStrikethrough');
		addToggle('Highlight', 'showHighlight');
		addToggle('Link', 'showLink');

		// Block & List
		addToggle('Bullet List', 'showBulletList');
		addToggle('Checkbox', 'showCheckbox');
		addToggle('Callout', 'showCallout');
		addToggle('Horizontal Rule', 'showHr');

		// Actions
		addToggle('Clear Formatting', 'showClearFormat');
		addToggle('Undo', 'showUndo');
	}
}
