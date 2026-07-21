import { Plugin } from 'obsidian';

export default class FloatingMenuPlugin extends Plugin {
	// Declare the menu element so we can access it throughout the class
	menuEl: HTMLElement;

	async onload() {
		// 1. Create the container div
		this.menuEl = document.createElement('div');

		// 2. Assign a CSS class for styling
		this.menuEl.addClass('floating-context-menu');

		// 3. Attach it directly to the app's body so it floats above everything
		document.body.appendChild(this.menuEl);

		// Temporary text just so we can see it on the screen
		this.menuEl.setText('My Menu');
	}

	onunload() {
		// Cleanup: Remove the element when the plugin is disabled or reloaded
		if (this.menuEl) {
			this.menuEl.remove();
		}
	}
}
