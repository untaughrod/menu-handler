import { Plugin, setIcon, MarkdownView } from 'obsidian';

export default class FloatingMenuPlugin extends Plugin {
	menuEl: HTMLElement;

	async onload() {
		// 1. Create the container div
		// Bold: wraps in **
		this.createButton('bold', 'Bold', () => {
			this.wrapText('**', '**');
		});

		// Italic: wraps in *
		this.createButton('italic', 'Italic', () => {
			this.wrapText('*', '*');
		});

		// Link: standard markdown link syntax
		this.createButton('link', 'Add Link', () => {
			this.wrapText('[', ']()');
		});
	}

	// A helper function to stamp out buttons consistently
	createButton(iconName: string, tooltip: string, onClick: () => void) {
		// createEl automatically creates the element AND appends it to menuEl
		const btn = this.menuEl.createEl('button', {
			cls: 'floating-menu-btn',
		});

		// Setting 'aria-label' automatically triggers Obsidian's native hover tooltips!
		btn.setAttribute('aria-label', tooltip);

		// Inject the Lucide icon into the button
		setIcon(btn, iconName);

		// Listen for the click
		btn.addEventListener('click', onClick);
	}

	onunload() {
		if (this.menuEl) {
			this.menuEl.remove();
		}
	}
	// Helper to wrap text or insert syntax at the cursor
	wrapText(before: string, after: string) {
		// 1. Get the currently active markdown view
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);

		// If no markdown file is open, do nothing
		if (!view) return;

		const editor = view.editor;
		const selection = editor.getSelection();

		if (selection) {
			// 2a. If text is highlighted, wrap it in our syntax
			editor.replaceSelection(`${before}${selection}${after}`);
		} else {
			// 2b. If no text is highlighted, insert the syntax...
			const cursor = editor.getCursor();
			editor.replaceRange(`${before}${after}`, cursor);

			// ...and move the cursor to the exact middle so they can start typing
			cursor.ch += before.length;
			editor.setCursor(cursor);
		}

		// 3. Return focus back to the text editor
		editor.focus();
	}
}
