const { spawn } = require("child_process");
const { createInterface } = require("readline");
const colors = require("colors/safe");

// Log formatting
const log = {
  info: (text) => console.log(colors.blue(`[INFO] ${text}`)),
  success: (text) => console.log(colors.green(`[SUCCESS] ${text}`)),
  warn: (text) => console.log(colors.yellow(`[WARN] ${text}`)),
  error: (text) => console.log(colors.red(`[ERROR] ${text}`)),
};

// Store processes to kill them later
const processes = [];

// Process output formatter
function formatOutput(name, data, isError = false) {
  const color = isError ? colors.red : colors.white;
  const lines = data.toString().trim().split("\n");
  const prefix = colors.cyan(`[${name}]`);

  lines.forEach((line) => {
    if (line.trim()) {
      console.log(`${prefix} ${color(line)}`);
    }
  });
}

// Start a process and capture its output
function startProcess(command, args, name) {
  log.info(`Starting ${name}...`);

  const proc = spawn(command, args, {
    shell: true,
    env: { ...process.env, FORCE_COLOR: true },
  });

  processes.push(proc);

  proc.stdout.on("data", (data) => formatOutput(name, data));
  proc.stderr.on("data", (data) => formatOutput(name, data, true));

  proc.on("close", (code) => {
    if (code !== 0) {
      log.error(`${name} process exited with code ${code}`);
    } else {
      log.success(`${name} process completed successfully`);
    }
  });

  return proc;
}

// Clean exit handler
function cleanExit() {
  log.warn("Shutting down development environment...");

  processes.forEach((proc) => {
    if (!proc.killed) {
      proc.kill();
    }
  });

  log.success("All processes terminated. Goodbye!");
  process.exit(0);
}

// Set up clean exit handlers
process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

// Main function
async function main() {
  log.info("Starting WinDropper development environment...");

  // Start TypeScript compilation for main process
  const tscProcess = startProcess(
    "npx",
    ["tsc", "-p", "tsconfig.main.json", "-w"],
    "TSC"
  );

  // Start Vite dev server
  const viteProcess = startProcess("npx", ["vite"], "VITE");

  // Wait for Vite to be ready (it logs "ready in" when it's up)
  let viteReady = false;

  const viteReadyPromise = new Promise((resolve) => {
    viteProcess.stdout.on("data", (data) => {
      const output = data.toString();
      if (output.includes("ready in") && !viteReady) {
        viteReady = true;
        log.success("Vite server is ready!");
        resolve();
      }
    });
  });

  // Wait for both TypeScript compilation and Vite to be ready
  // We need to give TSC time to compile initially
  log.info("Waiting for initial TypeScript compilation...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  log.info("Waiting for Vite server...");
  await viteReadyPromise;

  // Start Electron
  log.info("Starting Electron...");
  const electronProcess = startProcess(
    "npx",
    ["cross-env", "NODE_ENV=development", "electron", "."],
    "ELECTRON"
  );

  // Set up readline interface for user commands
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: colors.cyan("dev> "),
  });

  rl.prompt();

  rl.on("line", (line) => {
    const command = line.trim();

    if (command === "restart" || command === "r") {
      log.info("Restarting Electron...");
      if (!electronProcess.killed) {
        electronProcess.kill();
      }

      // Start a new Electron process after a small delay
      setTimeout(() => {
        startProcess(
          "npx",
          ["cross-env", "NODE_ENV=development", "electron", "."],
          "ELECTRON"
        );
      }, 1000);
    } else if (command === "quit" || command === "q" || command === "exit") {
      cleanExit();
    } else if (command === "help" || command === "h") {
      console.log(colors.cyan("\nAvailable commands:"));
      console.log("  restart, r  - Restart the Electron process");
      console.log("  quit, q     - Exit the development environment");
      console.log("  help, h     - Show this help message\n");
    } else if (command) {
      log.warn(`Unknown command: ${command}`);
      log.info('Type "help" to see available commands');
    }

    rl.prompt();
  });

  log.success("Development environment is running!");
  log.info('Type "help" to see available commands');
}

main().catch((err) => {
  log.error(`Error in development script: ${err}`);
  cleanExit();
});
