import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	setIcon,
	MarkdownView,
} from 'obsidian';

// 1. Define settings, adding our two new options
interface FloatingMenuSettings {
	showBold: boolean;
	showItalic: boolean;
	showStrikethrough: boolean;
	showHighlight: boolean;
	showLink: boolean;
	showCallout: boolean;
	showHr: boolean;
	hideWhenNoSelection: boolean;
	floatNearCursor: boolean;
}

const DEFAULT_SETTINGS: FloatingMenuSettings = {
	showBold: true,
	showItalic: true,
	showStrikethrough: true,
	showHighlight: true,
	showLink: true,
	showCallout: true,
	showHr: true,
	hideWhenNoSelection: false, // Default to always showing
	floatNearCursor: false, // Default to fixed at bottom
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

		// 2. Register Event Listeners to track when you highlight text
		const updatePosition = () => {
			// requestAnimationFrame ensures it runs smoothly after the browser finishes its layout calculations
			requestAnimationFrame(() => this.updateMenuVisibilityAndPosition());
		};

		this.registerDomEvent(document, 'mouseup', updatePosition);
		this.registerDomEvent(document, 'keyup', updatePosition);
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', updatePosition),
		);

		// Initial check when the plugin loads
		updatePosition();
	}

	// 3. The brains behind the context and positioning
	updateMenuVisibilityAndPosition() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);

		// If no note is open, hide the menu completely
		if (!view) {
			this.menuEl.style.display = 'none';
			return;
		}

		const editor = view.editor;
		const selection = editor.getSelection();
		const hasSelection = selection.length > 0;

		// --- Visibility Logic ---
		if (this.settings.hideWhenNoSelection && !hasSelection) {
			this.menuEl.style.display = 'none';
			return; // Stop here, no need to position an invisible menu
		}

		this.menuEl.style.display = 'flex';

		// --- Positioning Logic ---
		if (this.settings.floatNearCursor) {
			// Get the exact screen coordinates of where the highlight starts
			const cursorPos = editor.getCursor('from');
			// Use 'as any' just in case older Obsidian typings throw a warning
			const coords = (editor as any).coordsAtPos(cursorPos);

			if (coords) {
				// Clear the bottom anchoring
				this.menuEl.style.bottom = 'auto';
				// Place it 50 pixels above the text so it doesn't block what you are reading
				this.menuEl.style.top = `${coords.top - 50}px`;
				// Align it horizontally with the cursor
				this.menuEl.style.left = `${coords.left}px`;
				this.menuEl.style.transform = 'translateX(-50%)';
			}
		} else {
			// Revert to fixed bottom-center positioning
			this.menuEl.style.top = 'auto';
			this.menuEl.style.bottom = '40px';
			this.menuEl.style.left = '50%';
			this.menuEl.style.transform = 'translateX(-50%)';
		}
	}

	renderMenu() {
		this.menuEl.empty();

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
		btn.addEventListener('click', () => {
			onClick();
			// Force an update after a button is clicked so the menu adapts immediately
			this.updateMenuVisibilityAndPosition();
		});
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

	// --- Formatting Logic (Unchanged) ---
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
}

// 4. Update the Settings Menu UI
class FloatingMenuSettingTab extends PluginSettingTab {
	plugin: FloatingMenuPlugin;

	constructor(app: App, plugin: FloatingMenuPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Behavior Settings ---
		containerEl.createEl('h2', { text: 'Menu Behavior' });

		new Setting(containerEl)
			.setName('Hide when no text is selected')
			.setDesc(
				'If turned on, the menu will disappear completely unless you have text highlighted.',
			)
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
			.setDesc(
				'If turned on, the menu will anchor itself dynamically above your text instead of locking to the bottom of the screen.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.floatNearCursor)
					.onChange(async (value) => {
						this.plugin.settings.floatNearCursor = value;
						await this.plugin.saveSettings();
						this.plugin.updateMenuVisibilityAndPosition();
					}),
			);

		// --- Button Settings ---
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

		addToggle('Bold', 'showBold');
		addToggle('Italic', 'showItalic');
		addToggle('Strikethrough', 'showStrikethrough');
		addToggle('Highlight', 'showHighlight');
		addToggle('Link', 'showLink');
		addToggle('Callout', 'showCallout');
		addToggle('Horizontal Rule', 'showHr');
	}
}
