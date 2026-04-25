import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();
const outputDir = join(workspaceRoot, ".omx", "tmp", "test-dist");

rmSync(outputDir, { recursive: true, force: true });

execSync("npx tsc -p tsconfig.test.json", {
  cwd: workspaceRoot,
  stdio: "inherit",
});

function createWorkspaceShim(packageName) {
  const shimDir = join(
    outputDir,
    "node_modules",
    "@vibe-grid",
    packageName,
  );

  mkdirSync(shimDir, { recursive: true });
  writeFileSync(
    join(shimDir, "package.json"),
    JSON.stringify(
      {
        name: `@vibe-grid/${packageName}`,
        type: "commonjs",
        main: "./index.js",
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(shimDir, "index.js"),
    `module.exports = require("../../../packages/${packageName}/src/index.js");\n`,
  );
}

createWorkspaceShim("core");
createWorkspaceShim("i18n");

const testFiles = [
  ".omx/tmp/test-dist/packages/clipboard/src/index.test.js",
  ".omx/tmp/test-dist/packages/core/src/bulk-orchestration.test.js",
  ".omx/tmp/test-dist/packages/excel/src/index.test.js",
  ".omx/tmp/test-dist/packages/persistence/src/index.test.js",
  ".omx/tmp/test-dist/packages/react/src/useGridBulkOrchestration.test.js",
];

execSync(`node --test ${testFiles.join(" ")}`, {
  cwd: workspaceRoot,
  stdio: "inherit",
});
