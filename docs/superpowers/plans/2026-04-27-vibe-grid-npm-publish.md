# vibe-grid npm Publish 0.1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** vibe-grid 모노레포의 9개 패키지를 npm public registry에 publish 가능한 상태로 만든다 (0.1.0). 마지막 task의 dry-run workflow까지 그린이면 사용자가 첫 release tag를 push할 수 있다.

**Architecture:** 각 패키지에 `tsc -p tsconfig.build.json`으로 ESM + .d.ts를 `dist/`에 빌드. dual-resolution `exports` (`source`/`import`/`types`)로 monorepo 내부는 src를 직접 쓰고 외부 npm consumer는 dist를 받는다. `workspace:*` 의존성은 `npm publish -ws`가 자동으로 `^0.1.0` range로 변환. tag push → GitHub Actions → `npm publish --provenance`로 자동 발행.

**Tech Stack:** TypeScript 5.8 (tsc 단독), npm workspaces, Next.js 16 (`transpilePackages`), GitHub Actions, npm provenance (OIDC)

**Spec:** [`docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md`](../specs/2026-04-27-vibe-grid-npm-publish-design.md)

---

## 작업 환경 가정

- 워크트리 경로: `C:/Users/kms/Desktop/dev/vibe-grid/.claude/worktrees/blissful-liskov-631dc7`
- 브랜치: `claude/blissful-liskov-631dc7`
- 베이스: `master` (origin/master 동기화 상태)
- 모든 명령어는 워크트리 루트에서 실행
- Windows + bash (Git for Windows). PowerShell이 필요한 곳은 명시
- 기존 dev server(5050)는 background에서 떠 있을 수 있음 — 작업 중 포트 충돌 시 종료

---

## Task 1: 루트 LICENSE + author/license 메타

**Files:**
- Create: `LICENSE`
- Modify: `package.json` (루트)

- [ ] **Step 1: LICENSE 파일 작성 (MIT)**

`LICENSE` 신규 작성:

```
MIT License

Copyright (c) 2026 minseok kim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: 루트 `package.json`에 license/author/repository 추가**

`package.json`을 읽고, 기존 필드 유지하면서 다음 필드를 `"private": true` 라인 다음에 추가:

```json
"license": "MIT",
"author": "minseok kim",
"repository": {
  "type": "git",
  "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git"
},
"homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
"bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
```

- [ ] **Step 3: 검증**

```bash
node -p "require('./package.json').license"
```
Expected: `MIT`

```bash
node -p "require('./package.json').repository.url"
```
Expected: `git+https://github.com/qoxmfaktmxj/vibe-grid.git`

- [ ] **Step 4: Commit**

```bash
git add LICENSE package.json
git commit -m "chore: MIT LICENSE + 루트 메타 추가"
```

---

## Task 2: 루트 `.gitignore` + 빌드 scripts

**Files:**
- Modify: `.gitignore`
- Modify: `package.json` (루트, scripts)

- [ ] **Step 1: `.gitignore`에 dist/buildinfo 추가**

`.gitignore` 파일 끝에 다음 추가 (이미 있는 라인 중복 추가 방지를 위해 grep으로 사전 확인):

```
# Package build artifacts
packages/*/dist
packages/*/*.tsbuildinfo
```

- [ ] **Step 2: 루트 `package.json` scripts 추가**

기존 `"scripts"` 객체 내 (`"ci"` 라인 직전에) 다음 항목 추가:

```json
"clean:packages": "npm run clean -ws --if-present",
"build:packages": "npm run build -ws --if-present",
"prepublishOnly": "npm run lint && npm run build:packages && npm run test:core",
```

- [ ] **Step 3: 검증**

```bash
node -e "const s=require('./package.json').scripts; console.log(s['build:packages'], '|', s['clean:packages'])"
```
Expected: `npm run build -ws --if-present | npm run clean -ws --if-present`

```bash
git check-ignore packages/core/dist 2>&1; echo "exit=$?"
```
Expected: `packages/core/dist` 출력 + `exit=0` (ignored 의미)

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json
git commit -m "chore: dist 무시 + build/clean/prepublishOnly 스크립트 추가"
```

---

## Task 3: 9개 publish 패키지에 `tsconfig.build.json` 추가

**Files:** 모든 publish 대상에 build 전용 tsconfig 추가
- Create: `packages/core/tsconfig.build.json`
- Create: `packages/react/tsconfig.build.json`
- Create: `packages/i18n/tsconfig.build.json`
- Create: `packages/theme-shadcn/tsconfig.build.json`
- Create: `packages/clipboard/tsconfig.build.json`
- Create: `packages/excel/tsconfig.build.json`
- Create: `packages/persistence/tsconfig.build.json`
- Create: `packages/tanstack-adapter/tsconfig.build.json`
- Create: `packages/virtualization/tsconfig.build.json`

**왜 9개 모두 동일한 6줄?** spec §5.3 — base가 `noEmit: true`이고 build 전용으로 override하면 되기 때문. 패키지마다 다를 게 없다.

- [ ] **Step 1: 9개 동일 파일 작성**

각 `packages/<name>/tsconfig.build.json` 동일 내용:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": false,
    "tsBuildInfoFile": null
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 2: 검증 — 모든 9개 존재 확인**

```bash
for p in core react i18n theme-shadcn clipboard excel persistence tanstack-adapter virtualization; do
  test -f "packages/$p/tsconfig.build.json" && echo "OK $p" || echo "MISSING $p"
done
```
Expected: 9줄 모두 `OK ...`

- [ ] **Step 3: tsc로 한 패키지 시범 빌드 (core)**

```bash
cd packages/core && npx tsc -p tsconfig.build.json && ls dist | head -5; cd ../..
```
Expected: `dist/` 디렉토리 생성 + `index.js`, `index.d.ts` 등 파일 존재

빌드 후 dist는 .gitignore에 의해 추적되지 않음 (다음 step에서 검증).

- [ ] **Step 4: dist가 git에 잡히지 않는지 확인**

```bash
git status --short packages/core/dist 2>&1
```
Expected: 출력 없음 (ignored)

- [ ] **Step 5: Commit**

```bash
git add packages/*/tsconfig.build.json
git commit -m "chore: 9개 publish 패키지 tsconfig.build.json 추가 (tsc 빌드)"
```

---

## Task 4: leaf 패키지 매니페스트 표준화 — `core`, `i18n`, `theme-shadcn`

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/i18n/package.json`
- Modify: `packages/theme-shadcn/package.json`

이 3개는 internal 의존이 0이라 가장 단순. 같은 패턴으로 시작해 다른 패키지에 적용.

- [ ] **Step 1: `packages/core/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/core",
  "version": "0.0.1",
  "description": "Pure-function core contracts, row state, validation, and selection model for VibeGrid",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/core"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "datagrid", "core", "row-state", "validation"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

> `version: 0.0.1` 그대로 둠. Task 15에서 일괄 0.1.0으로 bump.

- [ ] **Step 2: `packages/i18n/package.json` 전체 교체**

위 core와 동일 패턴, 차이만 `name`, `description`, `keywords`, `directory`:

```json
{
  "name": "@vibe-grid/i18n",
  "version": "0.0.1",
  "description": "Localized message catalog (ko-KR, en-US) for VibeGrid",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/i18n"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "i18n", "ko-KR", "en-US"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- [ ] **Step 3: `packages/theme-shadcn/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/theme-shadcn",
  "version": "0.0.1",
  "description": "shadcn/ui-based design tokens and theme factory for VibeGrid",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/theme-shadcn"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "theme", "shadcn", "tokens"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- [ ] **Step 4: 검증 — 3개 모두 빌드 통과**

```bash
npm run build -w @vibe-grid/core -w @vibe-grid/i18n -w @vibe-grid/theme-shadcn
```
Expected: 3개 모두 build success, 각각 `dist/index.js` + `dist/index.d.ts` 생성

```bash
ls packages/core/dist packages/i18n/dist packages/theme-shadcn/dist
```
Expected: 각 dist에 `.js`, `.d.ts`, `.js.map` 등 파일

- [ ] **Step 5: tarball pre-flight (core)**

```bash
npm pack -w @vibe-grid/core --dry-run
```
Expected 출력 검증 포인트:
- `Tarball Contents` 에 `dist/index.js`, `dist/index.d.ts` 포함
- `src/` 파일 미포함 (files 필드 효과)
- `LICENSE` 자동 포함 (npm이 부모 디렉토리에서 picks up)
- `dependencies`가 비어있음 (core는 의존성 0)

- [ ] **Step 6: Commit**

```bash
git add packages/core/package.json packages/i18n/package.json packages/theme-shadcn/package.json
git commit -m "chore(packages): leaf 3개 매니페스트 표준화 (core/i18n/theme-shadcn)"
```

---

## Task 5: internal 패키지 매니페스트 — `virtualization`, `tanstack-adapter`

**Files:**
- Modify: `packages/virtualization/package.json`
- Modify: `packages/tanstack-adapter/package.json`

internal-only 두 패키지는 description에 `[INTERNAL]` 명시 + react를 peerDependency로.

- [ ] **Step 1: `packages/virtualization/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/virtualization",
  "version": "0.0.1",
  "description": "[INTERNAL] Sticky/frozen/row virtualization orchestration for @vibe-grid/react. Direct consumption is unsupported.",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/virtualization"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "internal"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "dependencies": {
    "@tanstack/react-virtual": "^3.13.12"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- [ ] **Step 2: `packages/tanstack-adapter/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/tanstack-adapter",
  "version": "0.0.1",
  "description": "[INTERNAL] TanStack Table bridge for @vibe-grid/react. Direct consumption is unsupported.",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/tanstack-adapter"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "internal"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "dependencies": {
    "@tanstack/react-table": "^8.21.3",
    "@vibe-grid/core": "workspace:*"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

> `tanstack-adapter`는 react를 직접 import하지 않음 (Table 인스턴스 wrapper만). peerDependencies 불필요. `@vibe-grid/core`만 `workspace:*`로 변경.

- [ ] **Step 3: 검증 — 빌드 + workspace 의존성 해석**

```bash
npm install
```
Expected: `workspace:*` 표기 처리 + `@vibe-grid/core`가 symlink로 packages/core에 연결됨

```bash
npm run build -w @vibe-grid/virtualization -w @vibe-grid/tanstack-adapter
```
Expected: 둘 다 build success

- [ ] **Step 4: Commit**

```bash
git add packages/virtualization/package.json packages/tanstack-adapter/package.json
git commit -m "chore(packages): internal 2개 매니페스트 표준화 (virtualization/tanstack-adapter)"
```

---

## Task 6: 1차 의존 패키지 매니페스트 — `clipboard`, `excel`, `persistence`

**Files:**
- Modify: `packages/clipboard/package.json`
- Modify: `packages/excel/package.json`
- Modify: `packages/persistence/package.json`

- [ ] **Step 1: `packages/clipboard/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/clipboard",
  "version": "0.0.1",
  "description": "Copy/paste parsing and rectangular range application for VibeGrid",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/clipboard"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "clipboard", "paste"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "dependencies": {
    "@vibe-grid/core": "workspace:*",
    "@vibe-grid/i18n": "workspace:*"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- [ ] **Step 2: `packages/excel/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/excel",
  "version": "0.0.1",
  "description": "xlsx import/export and template pipeline for VibeGrid",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/excel"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "excel", "xlsx"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "dependencies": {
    "@vibe-grid/core": "workspace:*",
    "exceljs": "^4.4.0"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- [ ] **Step 3: `packages/persistence/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/persistence",
  "version": "0.0.1",
  "description": "Column state serialization and restoration for VibeGrid",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/persistence"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["vibe-grid", "persistence", "column-state"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "dependencies": {
    "@vibe-grid/core": "workspace:*"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- [ ] **Step 4: 검증**

```bash
npm install
npm run build -w @vibe-grid/clipboard -w @vibe-grid/excel -w @vibe-grid/persistence
```
Expected: 3개 모두 build success

- [ ] **Step 5: Commit**

```bash
git add packages/clipboard/package.json packages/excel/package.json packages/persistence/package.json
git commit -m "chore(packages): 1차 의존 3개 매니페스트 표준화 (clipboard/excel/persistence)"
```

---

## Task 7: react 매니페스트 표준화 (가장 복잡)

**Files:**
- Modify: `packages/react/package.json`

react는 5개 internal 의존 + react peerDep + tanstack 외부 의존을 모두 종합. 가장 늦게 적용.

- [ ] **Step 1: `packages/react/package.json` 전체 교체**

```json
{
  "name": "@vibe-grid/react",
  "version": "0.0.1",
  "description": "Business-grade React data grid (row-first, IBSheet-replacement-oriented)",
  "type": "module",
  "license": "MIT",
  "homepage": "https://github.com/qoxmfaktmxj/vibe-grid#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qoxmfaktmxj/vibe-grid.git",
    "directory": "packages/react"
  },
  "bugs": "https://github.com/qoxmfaktmxj/vibe-grid/issues",
  "keywords": ["grid", "datagrid", "react", "tanstack", "ibsheet", "vibe-grid"],
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "dependencies": {
    "@tanstack/react-table": "^8.21.3",
    "@vibe-grid/core": "workspace:*",
    "@vibe-grid/i18n": "workspace:*",
    "@vibe-grid/tanstack-adapter": "workspace:*",
    "@vibe-grid/theme-shadcn": "workspace:*",
    "@vibe-grid/virtualization": "workspace:*"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

- [ ] **Step 2: 검증 — 의존 그래프 전체 빌드**

```bash
npm install
npm run build:packages
```
Expected: 9개 패키지 모두 빌드 통과 (`testing`은 build script 없어 skip)

```bash
test -f packages/react/dist/index.js && test -f packages/react/dist/index.d.ts && echo "react OK"
```
Expected: `react OK`

- [ ] **Step 3: tarball pre-flight (react — 가장 복잡)**

`--dry-run`은 파일 목록만 보여주므로, `workspace:*`가 range로 변환됐는지 확인하려면 실제 tarball을 만들고 풀어봐야 함.

```bash
# 실제 .tgz 생성 (현재 디렉토리에 vibe-grid-react-0.0.1.tgz 떨어짐)
npm pack -w @vibe-grid/react

# 안의 package.json 추출해서 dependencies 확인
mkdir -p /tmp/vg-pack-check
tar -xzf vibe-grid-react-0.0.1.tgz -C /tmp/vg-pack-check
cat /tmp/vg-pack-check/package/package.json | node -e "
  const p = JSON.parse(require('fs').readFileSync('/dev/stdin'));
  console.log(JSON.stringify(p.dependencies, null, 2));
"
```
Expected: 출력에서 `@vibe-grid/core`, `@vibe-grid/i18n` 등이 `"^0.0.1"` (또는 비슷한 range)로 변환되어 있어야 함. **`workspace:*`이 그대로 보이면 안 됨.**

```bash
# 정리
rm vibe-grid-react-0.0.1.tgz
rm -rf /tmp/vg-pack-check
```

> 만약 workspace:* 가 그대로 남아있으면: `npm --version` 확인 (9+ 필요). Node 22 번들 npm은 10+ 이므로 정상이어야 함.

- [ ] **Step 4: Commit**

```bash
git add packages/react/package.json
git commit -m "chore(packages): react 매니페스트 표준화 (peerDep + workspace:*)"
```

---

## Task 8: testing 패키지 의존성 통일 (private 유지)

**Files:**
- Modify: `packages/testing/package.json`

testing은 publish 안 하지만, 의존성 표기를 일관되게 `workspace:*`로.

- [ ] **Step 1: `packages/testing/package.json` 변경**

기존 파일을 읽고, `dependencies` 안의 `@vibe-grid/*`만 `workspace:*`로 교체. 다른 필드는 유지:

```json
{
  "name": "@vibe-grid/testing",
  "version": "0.0.1",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "dependencies": {
    "@vibe-grid/clipboard": "workspace:*",
    "@vibe-grid/core": "workspace:*",
    "@vibe-grid/react": "workspace:*",
    "@vibe-grid/virtualization": "workspace:*"
  }
}
```

> testing은 빌드 안 하므로 `tsconfig.build.json`/`scripts.build`/`exports` 정교화는 불필요. `exports`는 기존처럼 `./src/index.ts` 직접 노출 유지 (apps만 사용).

- [ ] **Step 2: 검증**

```bash
npm install
npm ls --workspaces 2>&1 | head -30
```
Expected: 워크스페이스 트리 출력 + 누락된 의존성 없음

- [ ] **Step 3: Commit**

```bash
git add packages/testing/package.json
git commit -m "chore(testing): workspace:* 의존성 통일 (private 유지)"
```

---

## Task 9: 빌드 + tarball 검증 (마일스톤)

**Files:** (변경 없음, 검증만)

지금까지의 매니페스트 표준화가 정확히 작동하는지 확인하는 회귀 게이트.

- [ ] **Step 1: 클린 빌드**

```bash
npm run clean:packages
npm install
npm run build:packages
```
Expected: 9개 dist 모두 재생성, 에러 0

- [ ] **Step 2: 모든 dist의 산출물 확인**

```bash
for p in core react i18n theme-shadcn clipboard excel persistence tanstack-adapter virtualization; do
  if [ -f "packages/$p/dist/index.js" ] && [ -f "packages/$p/dist/index.d.ts" ]; then
    echo "OK $p"
  else
    echo "MISSING $p"
  fi
done
```
Expected: 9줄 모두 `OK ...`

- [ ] **Step 3: 9개 모두 tarball pre-flight**

```bash
for p in core react i18n theme-shadcn clipboard excel persistence tanstack-adapter virtualization; do
  echo "=== @vibe-grid/$p ==="
  npm pack -w "@vibe-grid/$p" --dry-run 2>&1 | grep -E "^(npm notice|Tarball|version|filename)"
done
```
Expected: 9개 패키지 각각 tarball 미리보기 출력. `version: 0.0.1` 표시 (Task 15에서 0.1.0 bump 예정).

- [ ] **Step 4: 어떤 패키지에도 src/ 가 tarball에 포함되지 않는지 확인**

```bash
npm pack -w @vibe-grid/react --dry-run 2>&1 | grep -E "src/" || echo "src 없음 OK"
```
Expected: `src 없음 OK`

- [ ] **Step 5: lint + core 테스트 회귀**

```bash
npm run lint
npm run test:core
```
Expected: 둘 다 그린

- [ ] **Step 6: Commit (검증 통과 마커)**

이 task에서 코드 변경이 없으므로 커밋은 생략. 다음 task로 진행.

---

## Task 10: Next.js apps에 `transpilePackages` 추가 + dev 회귀

**Files:**
- Modify: `apps/playground/next.config.ts`
- Modify: `apps/bench/next.config.ts`

`exports`가 dist를 가리키도록 바뀐 후, dev에서 src를 그대로 쓰려면 `transpilePackages`가 필수.

- [ ] **Step 1: `apps/playground/next.config.ts` 읽기 + 수정**

기존 파일을 읽고, `nextConfig` 객체에 `transpilePackages` 추가. 기존 다른 옵션 유지:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... 기존 옵션 유지 ...
  transpilePackages: [
    "@vibe-grid/clipboard",
    "@vibe-grid/core",
    "@vibe-grid/excel",
    "@vibe-grid/i18n",
    "@vibe-grid/persistence",
    "@vibe-grid/react",
    "@vibe-grid/tanstack-adapter",
    "@vibe-grid/testing",
    "@vibe-grid/theme-shadcn",
    "@vibe-grid/virtualization"
  ]
};

export default nextConfig;
```

- [ ] **Step 2: `apps/bench/next.config.ts` 동일하게 수정**

같은 `transpilePackages` 배열 추가.

- [ ] **Step 3: dev 서버 재시작 + 회귀 확인**

```bash
# 기존 dev server 종료 (포트 5050 점유 중이면)
# Windows: taskkill /F /IM node.exe (주의: 다른 node 프로세스도 죽임)
# 또는 background task ID 알면 그것만 stop

npm run dev:playground &
sleep 10
curl -o /dev/null -w "HTTP %{http_code}\n" http://localhost:5050
curl -o /dev/null -w "HTTP %{http_code}\n" http://localhost:5050/labs/grid
```
Expected: 둘 다 `HTTP 200`

- [ ] **Step 4: dev 로그에 transpilePackages 관련 에러 없는지 확인**

dev server output 파일을 tail해서 ERROR/Failed 없음 확인. (background task ID 기억)

- [ ] **Step 5: bench 앱도 같이 확인 (선택)**

```bash
npm run dev:bench &
sleep 10
curl -o /dev/null -w "bench HTTP %{http_code}\n" http://localhost:5051
```
Expected: `bench HTTP 200` (포트는 bench의 next.config 또는 package.json 확인)

- [ ] **Step 6: dev server 종료 + Commit**

```bash
git add apps/playground/next.config.ts apps/bench/next.config.ts
git commit -m "chore(apps): transpilePackages로 @vibe-grid/* 9개 src 사용 명시"
```

---

## Task 11: 9개 publish 패키지 README.md

**Files:**
- Create: `packages/core/README.md`
- Create: `packages/react/README.md`
- Create: `packages/i18n/README.md`
- Create: `packages/theme-shadcn/README.md`
- Create: `packages/clipboard/README.md`
- Create: `packages/excel/README.md`
- Create: `packages/persistence/README.md`
- Create: `packages/tanstack-adapter/README.md`
- Create: `packages/virtualization/README.md`

- [ ] **Step 1: 외부 surface 7개 README 작성**

각 패키지에 `README.md` 작성. 골격은 동일, "한 줄 설명"과 "빠른 예시"만 패키지별로 다름.

`packages/core/README.md`:

````markdown
# @vibe-grid/core

VibeGrid의 순수 함수 코어 — 행 상태 모델, 유효성 검증, 선택 모델, 컬럼 상태 등 모든 contracts의 진원지.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/core
```

## 빠른 예시

```ts
import { createInsertedRow, applyRowPatch, buildSaveBundle } from "@vibe-grid/core";

const row = createInsertedRow({ id: 1, name: "홍길동" });
const updated = applyRowPatch(row, { name: "이순신" });
const bundle = buildSaveBundle([updated]);
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
````

`packages/react/README.md`:

````markdown
# @vibe-grid/react

VibeGrid의 React 앱 대면 컴포넌트. IBSheet 스타일의 row-first 비즈니스 그리드.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/react react react-dom
```

## 빠른 예시

```tsx
import { VibeGrid } from "@vibe-grid/react";

export function App() {
  return (
    <VibeGrid
      columns={[{ id: "name", header: "이름", accessorKey: "name" }]}
      rows={[{ id: 1, name: "홍길동" }]}
    />
  );
}
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab/Bench 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
````

`packages/i18n/README.md`:

````markdown
# @vibe-grid/i18n

VibeGrid의 다국어 메시지 카탈로그 (ko-KR / en-US).

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/i18n
```

## 빠른 예시

```ts
import { resolveLocale, getMessage } from "@vibe-grid/i18n";

const locale = resolveLocale("ko-KR");
const msg = getMessage(locale, "filter.empty");
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)

## 라이선스

MIT
````

`packages/theme-shadcn/README.md`:

````markdown
# @vibe-grid/theme-shadcn

VibeGrid용 shadcn/ui 기반 디자인 토큰과 테마 팩토리.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다. 토큰 네이밍은 안정성 경계 문서 기준 "experimental"입니다.

## 설치

```bash
npm install @vibe-grid/theme-shadcn
```

## 빠른 예시

```ts
import { createVibeGridTheme } from "@vibe-grid/theme-shadcn";

const theme = createVibeGridTheme({ density: "compact" });
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)

## 라이선스

MIT
````

`packages/clipboard/README.md`:

````markdown
# @vibe-grid/clipboard

VibeGrid의 복사/붙여넣기 파싱 + 직사각형 범위 적용 유틸.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/clipboard
```

## 빠른 예시

```ts
import { parseTsvClipboard, applyRectanglePaste } from "@vibe-grid/clipboard";

const matrix = parseTsvClipboard(text);
const result = applyRectanglePaste(rows, anchor, matrix);
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)

## 라이선스

MIT
````

`packages/excel/README.md`:

````markdown
# @vibe-grid/excel

VibeGrid의 xlsx import/export 및 템플릿 파이프라인 (exceljs 기반).

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

```bash
npm install @vibe-grid/excel
```

## 빠른 예시

```ts
import { exportRowsToXlsx, importXlsxBuffer } from "@vibe-grid/excel";

const buffer = await exportRowsToXlsx(rows, columns);
const parsed = await importXlsxBuffer(buffer);
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)

## 라이선스

MIT
````

`packages/persistence/README.md`:

````markdown
# @vibe-grid/persistence

VibeGrid의 컬럼 상태 직렬화/복원 어댑터.

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다. 컬럼 상태 외의 광범위 영속성은 안정성 경계 기준 "experimental"입니다.

## 설치

```bash
npm install @vibe-grid/persistence
```

## 빠른 예시

```ts
import { serializeColumnState, restoreColumnState } from "@vibe-grid/persistence";

const json = serializeColumnState(state);
const restored = restoreColumnState(json);
```

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)

## 라이선스

MIT
````

> 위 "빠른 예시"의 함수명은 패키지의 실제 export와 정확히 일치하지 않을 수 있습니다 (특히 `parseTsvClipboard`, `exportRowsToXlsx` 등). 작성 시 `packages/<name>/src/index.ts` 의 export를 확인하고 실제 이름으로 교체하세요. README는 npm 페이지에 그대로 노출되므로 정확성이 중요합니다.

- [ ] **Step 2: internal 2개 README 작성**

`packages/tanstack-adapter/README.md`:

````markdown
# @vibe-grid/tanstack-adapter

> **⚠️ INTERNAL PACKAGE — Direct consumption is unsupported.**
>
> 이 패키지는 [`@vibe-grid/react`](https://www.npmjs.com/package/@vibe-grid/react) 내부에서만 사용됩니다.
> API는 minor 버전에서도 예고 없이 변경될 수 있습니다.
>
> 그리드를 사용하시려면 [`@vibe-grid/react`](https://www.npmjs.com/package/@vibe-grid/react)를 설치하세요.

## 라이선스

MIT
````

`packages/virtualization/README.md`:

````markdown
# @vibe-grid/virtualization

> **⚠️ INTERNAL PACKAGE — Direct consumption is unsupported.**
>
> 이 패키지는 [`@vibe-grid/react`](https://www.npmjs.com/package/@vibe-grid/react) 내부에서만 사용됩니다.
> API는 minor 버전에서도 예고 없이 변경될 수 있습니다.
>
> 그리드를 사용하시려면 [`@vibe-grid/react`](https://www.npmjs.com/package/@vibe-grid/react)를 설치하세요.

## 라이선스

MIT
````

- [ ] **Step 3: 검증 — 9개 모두 존재**

```bash
for p in core react i18n theme-shadcn clipboard excel persistence tanstack-adapter virtualization; do
  test -f "packages/$p/README.md" && echo "OK $p" || echo "MISSING $p"
done
```
Expected: 9줄 모두 `OK ...`

- [ ] **Step 4: react README가 npm 페이지에서 어떻게 보일지 확인 (선택)**

```bash
npm pack -w @vibe-grid/react --dry-run 2>&1 | grep README.md
```
Expected: README.md가 tarball에 포함됨

- [ ] **Step 5: Commit**

```bash
git add packages/*/README.md
git commit -m "docs(packages): 9개 publish 패키지 README 추가 (npm 페이지용)"
```

---

## Task 12: 루트 README.md 보강 + CHANGELOG 진입 슬롯

**Files:**
- Modify: `README.md` (루트)
- Modify: `CHANGELOG.md` (루트)

- [ ] **Step 1: 루트 `README.md` 상단에 npm 뱃지 + 설치 한 줄 추가**

`# VibeGrid` 라인 다음에 다음 블록 삽입:

```markdown
[![npm version](https://img.shields.io/npm/v/@vibe-grid/react.svg)](https://www.npmjs.com/package/@vibe-grid/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

```bash
npm install @vibe-grid/react react react-dom
```
```

- [ ] **Step 2: 워크스페이스 표에 npm 컬럼 추가**

기존 "### 패키지" 섹션의 표를 다음으로 교체 (헤더와 9개 publish + 1개 internal-only marking + 1개 private):

```markdown
| 패키지 | 역할 | npm |
|--------|------|-----|
| `packages/core` | 공개 계약, 행 상태, 유효성 검증, 선택 모델 — 순수 함수만 포함 | [@vibe-grid/core](https://www.npmjs.com/package/@vibe-grid/core) |
| `packages/react` | 앱 대면 React 컴포넌트 (`VibeGrid`) | [@vibe-grid/react](https://www.npmjs.com/package/@vibe-grid/react) |
| `packages/tanstack-adapter` | TanStack Table 브릿지 (internal) | [(internal)](https://www.npmjs.com/package/@vibe-grid/tanstack-adapter) |
| `packages/virtualization` | sticky/frozen/가상화 오케스트레이션 (internal) | [(internal)](https://www.npmjs.com/package/@vibe-grid/virtualization) |
| `packages/clipboard` | 복사/붙여넣기 파싱 및 직사각형 적용 | [@vibe-grid/clipboard](https://www.npmjs.com/package/@vibe-grid/clipboard) |
| `packages/excel` | xlsx 가져오기/내보내기/템플릿 파이프라인 | [@vibe-grid/excel](https://www.npmjs.com/package/@vibe-grid/excel) |
| `packages/i18n` | ko-KR / en-US 다국어 메시지 | [@vibe-grid/i18n](https://www.npmjs.com/package/@vibe-grid/i18n) |
| `packages/persistence` | 컬럼 상태 직렬화 및 복원 | [@vibe-grid/persistence](https://www.npmjs.com/package/@vibe-grid/persistence) |
| `packages/theme-shadcn` | shadcn/ui 기반 테마 토큰 | [@vibe-grid/theme-shadcn](https://www.npmjs.com/package/@vibe-grid/theme-shadcn) |
| `packages/testing` | 재사용 가능한 벤치 및 픽스처 헬퍼 | — (private) |
```

- [ ] **Step 3: "안정성 경계" 섹션에 SemVer 정책 한 줄 추가**

기존 "## 안정성 경계" 섹션 마지막에:

```markdown

> SemVer: `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다. Pilot 단계 이후 `1.0.0` 발표 시 안정 contract로 전환합니다.
```

- [ ] **Step 4: "## Release" 섹션 신규 추가**

기존 "## 배포" 섹션 직전에 다음 추가:

````markdown
## Release

GitHub Actions의 `release.yml`이 `v*.*.*` 태그 push 시 자동으로 lint/build/test 후 npm 발행합니다.

```bash
# 1) 모든 패키지 + 루트 버전 일괄 bump
npm version 0.1.1 -ws --include-workspace-root --no-git-tag-version

# 2) CHANGELOG.md 갱신 후 커밋
git commit -am "chore(release): 0.1.1"

# 3) 태그 + 푸시 → Actions 자동 트리거
git tag -a v0.1.1 -m "Release 0.1.1"
git push origin master --follow-tags
```

자세한 절차는 [`docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md`](./docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md) §7 참조.

````

- [ ] **Step 5: `CHANGELOG.md` 상단에 0.1.0 초안 슬롯 추가**

기존 `CHANGELOG.md` 맨 위에 추가 (실제 0.1.0 라인 작성은 사용자 release 시점에):

```markdown
# Changelog

## Unreleased

- vibe-grid 모노레포의 9개 패키지를 npm public registry에 publish 가능하도록 빌드/메타/워크플로우 정비
- `tsc` 단독 빌드, dual-resolution `exports`, `workspace:*` 의존, tag-driven `release.yml` (provenance)
- 자세한 설계: `docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md`
```

> 기존 CHANGELOG에 다른 항목이 있으면 그 위에 추가.

- [ ] **Step 6: 검증**

```bash
grep -c "npm install @vibe-grid/react" README.md
```
Expected: `1` 이상

```bash
grep -c "## Release" README.md
```
Expected: `1`

- [ ] **Step 7: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: 루트 README에 npm 뱃지/Release 섹션 + CHANGELOG Unreleased 추가"
```

---

## Task 13: `ci.yml` 수정 (tag-ignore)

**Files:**
- Modify: `.github/workflows/ci.yml`

tag push 시 ci.yml + release.yml 중복 실행 방지.

- [ ] **Step 1: 파일 읽기 + 트리거 부분만 수정**

기존 `.github/workflows/ci.yml`의 `on:` 블록을 다음으로 교체:

```yaml
on:
  push:
    branches: [master]
    tags-ignore: ['v*.*.*']
  pull_request:
```

다른 부분 (jobs 등)은 모두 유지.

- [ ] **Step 2: 검증**

```bash
node -e "const yaml=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); console.log(yaml.includes(\"tags-ignore: ['v*.*.*']\")?'OK':'MISSING')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: tag push에서는 ci.yml 미실행 (release.yml과 중복 차단)"
```

---

## Task 14: `release.yml` 신규 작성

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: 파일 작성**

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry-run (build/lint/test 만 돌리고 publish 생략)'
        type: boolean
        default: true

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          registry-url: 'https://registry.npmjs.org'

      - name: Install
        run: npm ci

      - name: Verify tag matches package.json versions
        if: github.event_name == 'push'
        run: |
          TAG="${GITHUB_REF#refs/tags/v}"
          ROOT=$(node -p "require('./package.json').version")
          REACT=$(node -p "require('./packages/react/package.json').version")
          CORE=$(node -p "require('./packages/core/package.json').version")
          echo "tag=$TAG root=$ROOT react=$REACT core=$CORE"
          if [ "$TAG" != "$ROOT" ] || [ "$TAG" != "$REACT" ] || [ "$TAG" != "$CORE" ]; then
            echo "::error::Tag $TAG does not match package.json versions"
            exit 1
          fi

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Lint
        run: npm run lint

      - name: Build packages (tsc)
        run: npm run build:packages

      - name: Build apps (smoke)
        run: npm run build

      - name: Core tests
        run: npm run test:core

      - name: E2E tests
        env:
          CI: '1'
        run: npm run test:e2e

      - name: Publish to npm
        if: github.event_name == 'push' && inputs.dry_run != true
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npm publish -ws --access public --provenance

      - name: Upload Playwright Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-artifacts
          path: |
            output/playwright/test-results
            output/playwright/report
          if-no-files-found: ignore
```

- [ ] **Step 2: YAML lint (선택)**

```bash
node -e "const yaml=require('fs').readFileSync('.github/workflows/release.yml','utf8'); console.log(yaml.split('\n').length, 'lines')"
```
Expected: 약 70+ 줄

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: release.yml 추가 (tag-driven publish + provenance)"
```

---

## Task 15: 종합 검증 + 사용자 release 직전 상태 확정

**Files:** (변경 없음)

이 task는 모든 변경이 통합 상태에서 작동하는지 마지막 게이트 + 사용자가 첫 release를 할 수 있는 상태인지 확인.

- [ ] **Step 1: 클린 슬레이트 빌드**

```bash
npm run clean:packages
rm -rf node_modules
npm install
npm run build:packages
```
Expected: 모든 단계 에러 0, 9개 dist 생성

- [ ] **Step 2: 풀 lint**

```bash
npm run lint
```
Expected: 그린

- [ ] **Step 3: 코어 테스트**

```bash
npm run test:core
```
Expected: 모든 테스트 통과

- [ ] **Step 4: e2e 테스트 (Windows PowerShell)**

```powershell
$env:CI='1'; npm run test:e2e
```
Expected: 모든 spec 그린

> bash 환경이면: `CI=1 npm run test:e2e`

- [ ] **Step 5: 9개 tarball pre-flight**

```bash
for p in core react i18n theme-shadcn clipboard excel persistence tanstack-adapter virtualization; do
  echo "=== @vibe-grid/$p ==="
  npm pack -w "@vibe-grid/$p" --dry-run 2>&1 | grep -E "^npm notice (Tarball Contents|version|filename|name)"
done
```
Expected: 각 패키지 출력에서 `dist/index.js`, `dist/index.d.ts`, `package.json`, `README.md` 포함 확인

- [ ] **Step 6: dev 서버 회귀 (마지막 회귀 검증)**

```bash
npm run dev:playground &
sleep 12
curl -o /dev/null -w "/ %{http_code}\n" http://localhost:5050
curl -o /dev/null -w "/labs/grid %{http_code}\n" http://localhost:5050/labs/grid
curl -o /dev/null -w "/labs/bench %{http_code}\n" http://localhost:5050/labs/bench
curl -o /dev/null -w "/labs/compatibility %{http_code}\n" http://localhost:5050/labs/compatibility
# dev server stop
```
Expected: 4개 모두 `200`

- [ ] **Step 7: 워크플로우 dry-run 사전 안내 작성**

`docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md` §7 Phase 1과 같음. 사용자가 master에 머지된 후:

1. GitHub → Actions → Release → "Run workflow" → branch `master`, `dry_run: true` → 실행
2. 그린이면 Phase 2 (로컬 검증)로 진행

이 안내는 spec과 README의 Release 섹션에 이미 포함됨. 이 step에서는 확인만:

```bash
grep -A 5 "## Release" README.md | head -20
grep -A 5 "Phase 1" docs/superpowers/specs/2026-04-27-vibe-grid-npm-publish-design.md | head -10
```
Expected: 두 군데 모두 안내 출력

- [ ] **Step 8: 최종 git 상태 확인**

```bash
git status
git log --oneline master..HEAD
```
Expected:
- working tree clean
- master로부터 약 13~14개 커밋 (Task 1~14)

- [ ] **Step 9: 사용자에게 release-ready 보고**

이 task는 코드 변경 없이 검증만 하므로 별도 commit 없음. 다음 단계는 사용자 작업:
- 이 브랜치를 master에 머지 (PR 생성 또는 직접)
- spec §7 Phase 1 (Actions UI에서 dry-run) 실행
- 그린이면 Phase 3 (로컬에서 0.1.0 bump) 진행

---

## Spec Coverage 자기점검

| Spec 섹션 | 구현 Task |
|-----------|-----------|
| §5.1 변경 대상 9개 | Task 4, 5, 6, 7 |
| §5.2 표준 package.json 패턴 | Task 4, 5, 6, 7 |
| §5.3 표준 tsconfig.build.json | Task 3 |
| §5.4 internal-only 차별화 | Task 5 |
| §5.5 루트 scripts | Task 2 |
| §5.6 .gitignore | Task 2 |
| §5.7 README | Task 11, 12 |
| §5.8 LICENSE | Task 1 |
| §5.9 Next.js apps | Task 10 |
| §6.1 release.yml | Task 14 |
| §6.2 ci.yml 수정 | Task 13 |
| §7 Run-book Phase 0 (사전 체크) | Task 15 (Step 9에서 확인) |
| §7 Run-book Phase 1~6 | 사용자 작업 (이 plan 머지 후) |
| §8 Done Definition | Task 9, 15 |

빠진 것 없음.

## Out-of-scope (이 plan에서 다루지 않는 것)

- vibe-hr 어댑터 / 마이그레이션 (별도 spec)
- 첫 0.1.0 실제 publish (사용자 작업: spec §7 Phase 3~5)
- npm org 생성 / NPM_TOKEN 발급 (사용자가 이미 완료)
- vibe-grid 자체의 새 기능 / API 추가
