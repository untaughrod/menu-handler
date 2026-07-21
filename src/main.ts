import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	setIcon,
	MarkdownView,
} from 'obsidian';

// 1. Define the settings our plugin will use
interface FloatingMenuSettings {
	showBold: boolean;
	showItalic: boolean;
	showStrikethrough: boolean;
	showHighlight: boolean;
	showLink: boolean;
	showCallout: boolean;
	showHr: boolean;
}

// 2. Set the default settings (everything ON by default)
const DEFAULT_SETTINGS: FloatingMenuSettings = {
	showBold: true,
	showItalic: true,
	showStrikethrough: true,
	showHighlight: true,
	showLink: true,
	showCallout: true,
	showHr: true,
};

export default class FloatingMenuPlugin extends Plugin {
	settings: FloatingMenuSettings;
	menuEl: HTMLElement;

	async onload() {
		// Load the settings first
		await this.loadSettings();

		// Add the settings tab to Obsidian
		this.addSettingTab(new FloatingMenuSettingTab(this.app, this));

		// Create the container div
		this.menuEl = document.createElement('div');
		this.menuEl.addClass('floating-context-menu');
		document.body.appendChild(this.menuEl);

		// Render the buttons based on current settings
		this.renderMenu();
	}

	// 3. New function to build the menu dynamically
	renderMenu() {
		// Clear out any existing buttons first (useful when settings change)
		this.menuEl.empty();

		// Only create the button if the setting is true
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

		if (this.settings.showCallout)
			this.createButton('message-square', 'Callout', () =>
				this.insertCallout(),
			);
		if (this.settings.showHr)
			this.createButton('minus', 'Horizontal Rule', () =>
				this.insertHorizontalRule(),
			);
	}

	createButton(iconName: string, tooltip: string, onClick: () => void) {
		const btn = this.menuEl.createEl('button', {
			cls: 'floating-menu-btn',
		});
		btn.setAttribute('aria-label', tooltip);
		setIcon(btn, iconName);
		btn.addEventListener('click', onClick);
	}

	onunload() {
		if (this.menuEl) {
			this.menuEl.remove();
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
				const newCursor = {
					line: from.line,
					ch: from.ch + before.length,
				};
				editor.setCursor(newCursor);
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

	// 4. Updated Horizontal Rule logic
	insertHorizontalRule() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		const editor = view.editor;
		const cursor = editor.getCursor();
		const lineText = editor.getLine(cursor.line);

		if (lineText.trim() === '') {
			// Drop rule, add newline, move cursor down 1 line
			editor.replaceRange(`---\n`, cursor);
			editor.setCursor({ line: cursor.line + 1, ch: 0 });
		} else {
			// Pad with newlines so it doesn't break text, move cursor down 3 lines
			editor.replaceRange(`\n\n---\n`, cursor);
			editor.setCursor({ line: cursor.line + 3, ch: 0 });
		}
		editor.focus();
	}
}

// 5. The Settings Tab UI
class FloatingMenuSettingTab extends PluginSettingTab {
	plugin: FloatingMenuPlugin;

	constructor(app: App, plugin: FloatingMenuPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Floating Menu Buttons' });
		containerEl.createEl('p', {
			text: 'Choose which buttons appear on your menu.',
		});

		// A helper function to create toggles quickly
		const addToggle = (name: string, key: keyof FloatingMenuSettings) => {
			new Setting(containerEl).setName(name).addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings[key] as boolean)
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[key] = value;
						await this.plugin.saveSettings();

						// Instantly update the menu when a setting changes!
						this.plugin.renderMenu();
					}),
			);
		};

		addToggle('Bold', 'showBold');
		addToggle('Italic', 'showItalic');
		addToggle('Strikethrough', 'showStrikethrough');
		addToggle('Highlight', 'showHighlight');
		addToggle('Link', 'showLink');
		addToggle('Callout', 'showCallout');
		addToggle('Horizontal Rule', 'showHr');
	}
}
