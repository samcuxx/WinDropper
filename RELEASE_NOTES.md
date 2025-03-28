# WinDropper v0.1.0-beta.1 Release Notes

## Overview

WinDropper is a Windows alternative to macOS Dropover, providing a convenient way to temporarily store files for easy organization and movement across different locations. This is the first beta release, ready for testing and feedback.

## Key Features

- **Drag and Drop File Stacking**: Easily drag files from File Explorer to the floating notch for temporary storage
- **Multi-File Selection and Dragging**: Select multiple files with checkboxes and drag them together
- **Smart File Organization**: Categorize files by type when moving them to destinations
- **Floating Notch UI**: Minimalistic, resizable, and always-on-top window for quick access
- **Context Menu Actions**: Quick actions for files including copying paths, opening containing folders
- **Keyboard Shortcuts**: Use CTRL+SHIFT+D to show/hide the WinDropper notch
- **Settings Panel**: Customize appearance, behavior, and file management
- **Dark/Light Mode Support**: Adapts to your system theme or manually selectable
- **Start on Boot Option**: Automatically launch WinDropper when you log in to Windows

## Installation

### Installer Version

1. Download the "WinDropper Setup 0.1.0-beta.1.exe" file
2. Run the installer and follow the prompts
3. Launch WinDropper from your Start menu

### Portable Version

1. Download the zip file containing the portable version
2. Extract to a location of your choice
3. Run "WinDropper.exe" to start the application

## Known Issues

- Context menu submenu handling may have some positioning issues when near screen edges
- In some cases, file dragging to certain applications may fall back to copying file paths to clipboard
- Window opacity settings may not apply correctly until the application is restarted
- Some visual artifacts may occur in the settings window when switching between tabs quickly

## Feedback & Reporting Issues

Please report any bugs or provide feedback by opening an issue on our GitHub repository.

## Acknowledgments

- Inspired by macOS Dropover
- Built with Electron, React, TypeScript, and TailwindCSS
