# Menu Handler

Adds a **floating contextual menu** for handling text modifications (bold,italic, etc).

## A custom Floating Context Menu for Obsidian

A lightweight, highly responsive, professional-grade floating toolbar for Obsidian.

This plugin provides a contextual floating menu for rapid Markdown formatting, inspired by the pop-up toolbars found in modern text editors like Notion or Medium. It dynamically anchors to your active note space and offers a clean, theme-integrated UI to speed up your writing workflow without cluttering your screen.

## Features

Smart Formatting Controls
The menu provides instant access to common formatting actions, and includes smart logic for complex elements:

**Text Styling:** Bold, Italic, Strikethrough, and Highlight.

**Smart Checkboxes:** Intelligent toggling that detects the current line state. It will add a new checkbox, upgrade a standard bullet to a checkbox, or check/uncheck an existing box (- [ ] ↔ - [x]).

**Heading Dropdown:** Click the heading icon to instantly apply an H1, or hover over it to reveal a seamless vertical sub-menu for H1–H6. Each level is shown with its native Lucide heading icon for quick visual recognition.

**Link Insertion:** Dedicated buttons for both External Links ([]()) and Internal Obsidian Links ([[]]).

**Block Elements:** Insert Info Callouts (> [!INFO]), Bullet Lists, and Horizontal Rules.

**Light/Dark Mode Toggle:** A one-click button to switch Obsidian between its light and dark color schemes. The icon reflects the current mode (a sun while in light mode, a moon while in dark mode) and stays in sync even when you change the theme from Obsidian's settings or another plugin.

**Fold Toggle:** Collapse or expand the heading section your cursor is currently in. You no longer need to click directly on the heading line — the button walks upward from the cursor to find the nearest heading (or subheading) and folds that whole section. If there is no heading above the cursor, it falls back to folding the foldable item on the current line.

**Safety Actions:** Dedicated Undo and Clear Formatting buttons isolated on the right side of the menu to prevent accidental clicks. Clear Formatting intelligently strips Markdown symbols (bold, lists, blockquotes, etc.) from your selection.

### Dynamic & Responsive Layout

Note-Bound Anchoring: The menu calculates its position based on the active note view, meaning it will never overlap with your sidebars or other Obsidian panes.

Responsive Wrapping: If you resize your window or open multiple sidebars, the menu intelligently wraps its buttons into a multi-row grid so it never bleeds off the screen.

### Positioning Modes:

Fixed Mode: Anchors to the bottom-center of your currently active note.

Float Mode: Dynamically floats directly above your text cursor or text selection.

Visibility Control: Option to hide the menu completely unless text is actively highlighted.

Custom Scaling: A built-in slider lets you precisely adjust the size of the menu and its icons (from 0.5x to 2.0x).

## Settings & Configuration

You can customize the plugin entirely via the Obsidian settings tab:

Plugin Actions: Includes a dedicated Reload Menu button to instantly refresh the toolbar if layout changes cause overlapping.

Menu Behavior: Adjust the UI scale, toggle "Float near cursor", and choose whether the menu is always visible or only appears on text selection.

Menu Buttons: Individually toggle every single button on or off to create a customized workspace with only the tools you actually use.

## Current Limitations & Known Issues

As the plugin is currently in active development, please note the following limitations:

Markdown Views Only: The menu is tied to the MarkdownView API. It will not appear or function inside Obsidian Canvas, Excalidraw, or other non-standard text views.

Hardcoded Callout: The Callout button currently defaults to inserting an [!INFO] callout. Custom callout types are not yet selectable from the menu.

Mobile Support: The plugin relies on desktop mouseup and keyup event listeners. Touch interactions on mobile devices have not been fully optimized and may result in inconsistent menu positioning.

Positioning on Large Selections: In "Float near cursor" mode, the menu anchors to the from coordinate of your selection. If you highlight a massive multi-page block of text, the menu will jump to the top of that selection, which may be off-screen.

No Drag-and-Drop: The menu cannot currently be manually clicked and dragged to a custom static location on the screen.

## Installation

(Note: Since the plugin is not yet in the official community store, use one of the methods below)

### Method 1: Manual Installation

Download the latest release (main.js, manifest.json, and styles.css) from the Releases page.

Go to your Obsidian vault's .obsidian/plugins/ directory.

Create a new folder named menu-handler.

Place the downloaded files inside this new folder.

Restart Obsidian, go to Settings > Community Plugins, and enable the plugin.

### Method 2: BRAT

You can easily install this via the BRAT plugin by adding this repository's URL.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page] if you want to contribute.

## License

This project is licensed under the MIT License.
