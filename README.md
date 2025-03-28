<p align="center">
  <img src="./public/icons/icon.png" alt="WinDropper Logo" width="200">
</p>

# WinDropper

WinDropper is a Windows alternative to macOS Dropover, providing a convenient way to temporarily store files for easy organization and movement across different locations.

## Features

- **Drag and Drop File Stacking:** Easily drag files from File Explorer to the floating notch
- **Smart File Organization:** Categorize files by type when moving them to destinations
- **Floating Notch UI:** Minimalistic, resizable, and always-on-top window for quick access
- **Context Menu Actions:** Quick actions for files including copying paths, opening containing folders
- **Multi-File Management:** Select and drag multiple files at once using checkboxes
- **Keyboard Shortcuts:** Use CTRL+SHIFT+D to show/hide the WinDropper notch
- **Customization:** Change appearance, behavior, and file management settings
- **Dark/Light Mode Support:** Adapts to your system theme or manually selectable

## Installation

### Requirements

- Windows 10 or higher
- 100MB free disk space

### Installation Methods

#### Method 1: Installer

1. Download the latest installer from the [Releases](https://github.com/username/windropper/releases) page
2. Run the installer and follow the prompts
3. Launch WinDropper from your Start menu

#### Method 2: Portable Version

1. Download the portable ZIP from the [Releases](https://github.com/username/windropper/releases) page
2. Extract the ZIP to a location of your choice
3. Run `WinDropper.exe` to start the application

## Usage

### Basic Usage

1. **Start WinDropper:** Run the application from the Start menu or taskbar
2. **Drag Files:** Drag any files to the floating notch
3. **Manage Files:** Right-click on files or the notch for options
4. **Move Files:** Drag files back out to a new location or use the context menu to move them to predefined locations
5. **Select Multiple Files:** Use the checkboxes to select files, then drag them as a group

### Keyboard Shortcuts

- **CTRL+SHIFT+D:** Show/hide the WinDropper notch
- **CTRL+C:** (When notch is focused) Copy all file paths in the stack

### Customization

WinDropper offers several customization options:

1. **Click the Settings icon** in the system tray or right-click the tray icon and select "Settings"
2. Adjust appearance, behavior, and file management settings:
   - Change theme (Light/Dark/System)
   - Toggle always-on-top behavior
   - Set default destination folder
   - Enable/disable auto-categorization by file type
   - Configure auto-clear timeout

## Development

WinDropper is an Electron application built with React, TypeScript, and TailwindCSS.

### Setup Development Environment

1. Clone the repository:

```bash
git clone https://github.com/username/windropper.git
cd windropper
```

2. Install dependencies:

```bash
npm install
```

3. Run in development mode:

```bash
# Use the enhanced development environment
npm run dev

# Or use the simplified batch file on Windows
dev.bat
```

The enhanced development environment provides:

- Automatic TypeScript compilation
- Vite development server for the renderer
- Automatic Electron startup when the server is ready
- Interactive command interface:
  - `restart` or `r` - Restart the Electron process
  - `quit` or `q` - Exit the development environment
  - `help` or `h` - Show available commands

### Building

To build the application for distribution:

```bash
# Build for current platform
npm run build
npm run package
```

The packaged application will be available in the `release` folder.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by macOS Dropover
- Icon design by [Your Name]
- Built with Electron, React, TypeScript, and TailwindCSS

it shows well now, the setting page setting dont work on the win dropper, i drop files to the win dropper but i cant drag the file from it to other folder. copy button dont work , i cant move the windroper around, its stock to the exact location
