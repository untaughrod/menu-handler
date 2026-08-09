import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	setIcon,
	MarkdownView,
	Notice,
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
	showFold: boolean;
	showThemeToggle: boolean;
	showClearFormat: boolean;
	showUndo: boolean;
	hideWhenNoSelection: boolean;
	floatNearCursor: boolean;
	menuScale: number;
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
	showFold: true,
	showThemeToggle: true,
	showClearFormat: true,
	showUndo: true,
	hideWhenNoSelection: false,
	floatNearCursor: false,
	menuScale: 1.0,
};

export default class FloatingMenuPlugin extends Plugin {
	settings: FloatingMenuSettings;
	menuEl: HTMLElement;
	themeBtn: HTMLElement | null = null;

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
		this.registerEvent(
			this.app.workspace.on('layout-change', updatePosition),
		);
		// Keep the theme button icon in sync if the mode changes from elsewhere
		this.registerEvent(
			this.app.workspace.on('css-change', () => this.updateThemeIcon()),
		);
		this.registerDomEvent(window, 'resize', updatePosition);

		updatePosition();
	}

	// THIS PREVENTS THE MENU DUPLICATION BUG
	onunload() {
		if (this.menuEl) {
			this.menuEl.remove();
		}
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

		// Apply dynamic scale to CSS variable
		this.menuEl.style.setProperty(
			'--menu-scale',
			this.settings.menuScale.toString(),
		);

		// Constrain to the active note width
		const viewRect = view.contentEl.getBoundingClientRect();
		this.menuEl.style.maxWidth = `${viewRect.width - 40}px`;

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
			// Anchor to the specific note's center, not the app window
			const noteCenterX = viewRect.left + viewRect.width / 2;

			this.menuEl.style.top = 'auto';
			this.menuEl.style.bottom = '40px';
			this.menuEl.style.left = `${noteCenterX}px`;
			this.menuEl.style.transform = 'translateX(-50%)';
		}
	}

	renderMenu() {
		this.menuEl.empty();
		this.themeBtn = null;

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

		if (this.settings.showBulletList)
			this.createButton('list', 'Bullet List', () =>
				this.toggleLinePrefix('- '),
			);
		if (this.settings.showCheckbox)
			this.createButton('check-square', 'Checkbox', () =>
				this.toggleCheckbox(),
			);
		if (this.settings.showCallout)
			this.createButton('message-square', 'Callout', () =>
				this.insertCallout(),
			);
		if (this.settings.showHr)
			this.createButton('minus', 'Horizontal Rule', () =>
				this.insertHorizontalRule(),
			);

		if (this.settings.showThemeToggle) {
			this.themeBtn = this.createButton('sun', 'Toggle Light/Dark Mode', () =>
				this.toggleTheme(),
			);
			this.updateThemeIcon();
		}

		const hasRightGroup =
			this.settings.showClearFormat || this.settings.showUndo;
		if (hasRightGroup) {
			this.menuEl.createEl('div', { cls: 'floating-menu-divider' });
			if (this.settings.showClearFormat)
				this.createButton('eraser', 'Clear Formatting', () =>
					this.clearFormatting(),
				);
			if (this.settings.showFold)
				this.createButton('list-chevrons-down-up', 'Toggle Fold', () =>
					this.toggleFold(),
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
		return btn;
	}

	createHeadingDropdown() {
		const wrapper = this.menuEl.createEl('div', { cls: 'heading-wrapper' });

		const mainBtn = wrapper.createEl('button', {
			cls: 'floating-menu-btn',
		});
		mainBtn.setAttribute(
			'aria-label',
			'Heading (Click for H1, Hover for more)',
		);
		setIcon(mainBtn, 'heading');
		mainBtn.addEventListener('click', () => this.insertHeading(1));

		const dropdown = wrapper.createEl('div', { cls: 'heading-dropdown' });

		for (let i = 1; i <= 6; i++) {
			const hBtn = dropdown.createEl('button', {
				cls: 'heading-dropdown-item',
			});
			hBtn.setAttribute('aria-label', `Heading ${i} (${['H1', 'H2', 'H3', 'H4', 'H5', 'H6'][i - 1]})`);
			setIcon(hBtn, `heading-${i}`);
			hBtn.addEventListener('click', (e) => {
				e.stopPropagation();
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

	insertHeading(level: number) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const cursor = editor.getCursor();
		const lineText = editor.getLine(cursor.line);

		const strippedText = lineText.replace(/^#+\s/, '');
		const prefix = '#'.repeat(level) + ' ';
		editor.setLine(cursor.line, prefix + strippedText);
		editor.focus();
	}

	toggleLinePrefix(prefix: string) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const selection = editor.getSelection();

		if (selection) {
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

	toggleCheckbox() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const selection = editor.getSelection();

		const processLine = (line: string) => {
			const trimmed = line.trimStart();
			if (trimmed.startsWith('- [ ] ')) {
				return line.replace('- [ ] ', '- [x] ');
			} else if (trimmed.startsWith('- [x] ')) {
				return line.replace('- [x] ', '- [ ] ');
			} else if (trimmed.startsWith('- ')) {
				return line.replace('- ', '- [ ] ');
			} else {
				return '- [ ] ' + line;
			}
		};

		if (selection) {
			const newText = selection.split('\n').map(processLine).join('\n');
			editor.replaceSelection(newText);
		} else {
			const cursor = editor.getCursor();
			const lineText = editor.getLine(cursor.line);
			editor.setLine(cursor.line, processLine(lineText));
		}
		editor.focus();
	}

	clearFormatting() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const selection = editor.getSelection();

		if (selection) {
			const cleaned = selection
				.replace(/(\*\*|__|==|~~|\*|_|`)/g, '')
				.replace(/^(#+\s|> \s?|-\s\[.?\]\s|-\s|\d+\.\s)/gm, '');
			editor.replaceSelection(cleaned);
		}
		editor.focus();
	}

	toggleFold() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;

		// 1. Give focus BACK to the editor first so Obsidian knows where the cursor is
		editor.focus();

		// 2. The native fold command only acts on the cursor's exact line. If the
		// cursor is on a plain line inside a section, walk upward to the nearest
		// heading so the command folds the section the cursor is currently under.
		const cursor = editor.getCursor();
		let headingLine = -1;
		for (let line = cursor.line; line >= 0; line--) {
			if (/^#{1,6}\s/.test(editor.getLine(line))) {
				headingLine = line;
				break;
			}
		}

		if (headingLine !== -1 && headingLine !== cursor.line) {
			editor.setCursor({ line: headingLine, ch: 0 });
		}

		// 3. Now execute the native fold command against the resolved heading line
		// @ts-ignore
		this.app.commands.executeCommandById('editor:toggle-fold');
	}

	triggerUndo() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.editor.undo();
			view.editor.focus();
		}
	}

	toggleTheme() {
		// Check if the app body currently has the dark mode class
		const isDarkMode = document.body.classList.contains('theme-dark');

		// Obsidian's base color scheme is set via the internal changeTheme API.
		// 'moonstone' = light, 'obsidian' = dark. This also persists the choice.
		// @ts-ignore - changeTheme is an internal Obsidian API, not in the public typings
		this.app.changeTheme(isDarkMode ? 'moonstone' : 'obsidian');

		// Update the button icon to reflect the new mode
		this.updateThemeIcon();
	}

	updateThemeIcon() {
		if (!this.themeBtn) return;
		const isDarkMode = document.body.classList.contains('theme-dark');
		// Reflect the current mode: moon while dark, sun while light.
		setIcon(this.themeBtn, isDarkMode ? 'moon' : 'sun');
		this.themeBtn.setAttribute(
			'aria-label',
			isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
		);
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

		containerEl.createEl('h2', { text: 'Plugin Actions' });

		// NEW: Reload Button added directly to the Settings UI
		new Setting(containerEl)
			.setName('Reload Menu')
			.setDesc(
				'Click here to force reload the menu if it gets stuck, overlaps, or duplicates.',
			)
			.addButton((btn) =>
				btn.setButtonText('Reload').onClick(() => {
					this.plugin.renderMenu();
					this.plugin.updateMenuVisibilityAndPosition();
					new Notice('Floating Menu Reloaded!');
				}),
			);

		containerEl.createEl('h2', { text: 'Menu Behavior' });

		new Setting(containerEl)
			.setName('Menu Size')
			.setDesc('Adjust the size of the floating menu and its icons.')
			.addSlider((slider) =>
				slider
					.setLimits(0.5, 2.0, 0.1)
					.setValue(this.plugin.settings.menuScale)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.menuScale = value;
						await this.plugin.saveSettings();
						this.plugin.updateMenuVisibilityAndPosition();
					}),
			);

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
		addToggle('Internal Link', 'showInternalLink');

		// Block & List
		addToggle('Bullet List', 'showBulletList');
		addToggle('Checkbox', 'showCheckbox');
		addToggle('Callout', 'showCallout');
		addToggle('Horizontal Rule', 'showHr');

		// Actions
		addToggle('Clear Formatting', 'showClearFormat');
		addToggle('Toggle Fold', 'showFold');
		addToggle('Undo', 'showUndo');
		addToggle('Toggle Theme', 'showThemeToggle');
	}
}
