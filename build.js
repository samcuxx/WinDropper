const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

console.log(
  `${colors.bright}${colors.blue}Starting WinDropper build process...${colors.reset}\n`
);

// Ensure dist directory exists and is empty
console.log(`${colors.yellow}Cleaning dist directory...${colors.reset}`);
try {
  execSync("rm -rf dist");
} catch (error) {
  console.error(
    `${colors.red}Error clearing dist directory:${colors.reset}`,
    error.message
  );
}

// Create necessary directories
console.log(`${colors.yellow}Creating output directories...${colors.reset}`);
fs.mkdirSync("dist/main", { recursive: true });
fs.mkdirSync("dist/renderer", { recursive: true });
fs.mkdirSync("dist/renderer/icons", { recursive: true });

// Build renderer
console.log(`${colors.yellow}Building renderer (Vite)...${colors.reset}`);
try {
  execSync("npm run build:renderer", { stdio: "inherit" });
  console.log(`${colors.green}✓ Renderer build complete${colors.reset}`);
} catch (error) {
  console.error(
    `${colors.red}Error building renderer:${colors.reset}`,
    error.message
  );
  process.exit(1);
}

// Build main process
console.log(
  `${colors.yellow}Building main process (TypeScript)...${colors.reset}`
);
try {
  execSync(
    "npx tsc --target ES2020 --module CommonJS --esModuleInterop --sourceMap --outDir dist/main src/main/main.ts src/main/preload.ts src/main/fileHandler.ts src/main/settingsManager.ts",
    { stdio: "inherit" }
  );
  console.log(`${colors.green}✓ Main process build complete${colors.reset}`);
} catch (error) {
  console.error(
    `${colors.red}Error building main process:${colors.reset}`,
    error.message
  );
  process.exit(1);
}

// Copy icons to renderer directory for accessibility
console.log(`${colors.yellow}Copying icons to dist...${colors.reset}`);
try {
  const iconSourceDir = path.join(__dirname, "public", "icons");
  const iconDestDir = path.join(__dirname, "dist", "renderer", "icons");

  const copyIcons = (source, target) => {
    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`${colors.dim}Copied ${file}${colors.reset}`);
      }
    });
  };

  copyIcons(iconSourceDir, iconDestDir);
  console.log(`${colors.green}✓ Icons copied${colors.reset}`);
} catch (error) {
  console.error(
    `${colors.red}Error copying icons:${colors.reset}`,
    error.message
  );
}

console.log(
  `\n${colors.bright}${colors.green}Build process completed successfully!${colors.reset}`
);
console.log(`${colors.yellow}Start the app with:${colors.reset} npm start`);
