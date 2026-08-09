import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type FloatingMenuPlugin from './main';

export interface FloatingMenuSettings {
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

// The subset of settings keys whose values are booleans (i.e. the toggles).
type BooleanSettingKey = {
	[K in keyof FloatingMenuSettings]: FloatingMenuSettings[K] extends boolean
		? K
		: never;
}[keyof FloatingMenuSettings];

export const DEFAULT_SETTINGS: FloatingMenuSettings = {
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

export class FloatingMenuSettingTab extends PluginSettingTab {
	plugin: FloatingMenuPlugin;

	constructor(app: App, plugin: FloatingMenuPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Plugin actions').setHeading();

		// Reload button added directly to the Settings UI
		new Setting(containerEl)
			.setName('Reload menu')
			.setDesc(
				'Click here to force reload the menu if it gets stuck, overlaps, or duplicates.',
			)
			.addButton((btn) =>
				btn.setButtonText('Reload').onClick(() => {
					this.plugin.renderMenu();
					this.plugin.updateMenuVisibilityAndPosition();
					new Notice('Floating menu reloaded!');
				}),
			);

		new Setting(containerEl).setName('Menu behavior').setHeading();

		new Setting(containerEl)
			.setName('Menu size')
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

		new Setting(containerEl).setName('Menu buttons').setHeading();

		const addToggle = (name: string, key: BooleanSettingKey) => {
			new Setting(containerEl).setName(name).addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings[key])
					.onChange(async (value) => {
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
		addToggle('Internal link', 'showInternalLink');

		// Block & List
		addToggle('Bullet list', 'showBulletList');
		addToggle('Checkbox', 'showCheckbox');
		addToggle('Callout', 'showCallout');
		addToggle('Horizontal rule', 'showHr');

		// Actions
		addToggle('Clear formatting', 'showClearFormat');
		addToggle('Toggle fold', 'showFold');
		addToggle('Undo', 'showUndo');
		addToggle('Toggle theme', 'showThemeToggle');
	}
}
