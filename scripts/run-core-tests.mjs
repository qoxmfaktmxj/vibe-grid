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

const coreShimDir = join(
  outputDir,
  "node_modules",
  "@vibe-grid",
  "core",
);

mkdirSync(coreShimDir, { recursive: true });
writeFileSync(
  join(coreShimDir, "package.json"),
  JSON.stringify(
    {
      name: "@vibe-grid/core",
      type: "commonjs",
      main: "./index.js",
    },
    null,
    2,
  ),
);
writeFileSync(
  join(coreShimDir, "index.js"),
  'module.exports = require("../../../packages/core/src/index.js");\n',
);

execSync(
  "node --test .omx/tmp/test-dist/packages/core/src/bulk-orchestration.test.js .omx/tmp/test-dist/packages/react/src/useGridBulkOrchestration.test.js",
  {
    cwd: workspaceRoot,
    stdio: "inherit",
  },
);
