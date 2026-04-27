# vibe-grid npm Publish 설계 (0.1.0)

- **작성일**: 2026-04-27
- **상태**: Approved (사용자 승인 완료)
- **다음 단계**: writing-plans 스킬로 구현 계획 작성 → Sonnet 세션에서 실행

---

## 1. 배경

vibe-grid는 IBSheet 스타일 비즈니스 그리드를 React로 대체하기 위한 모노레포다. 현재 `vibe-hr` 프로젝트가 AG Grid 35.1을 약 123개 파일에서 사용 중이며, 이를 vibe-grid로 마이그레이션하는 것이 vibe-grid 프로젝트의 본래 목표다 (`README.md` 참조).

vibe-grid는 현재 다음 상태이다:

- 모든 패키지가 `private: true`이고 `exports`가 `./src/index.ts`를 직접 가리킴
- 빌드 산출물이 없음 (`tsconfig.base.json`이 `noEmit: true`)
- npm registry에 publish된 적 없음
- 모노레포 내부에서만 동작 (npm workspaces)

따라서 vibe-hr이 `npm install @vibe-grid/react`로 받아 사용하려면, **vibe-grid를 npm public registry에 publish 가능한 상태로 만드는 작업**이 선행되어야 한다.

본 문서는 그 작업의 설계를 정의한다.

## 2. 범위

### 2.1 In-scope

- `@vibe-grid/*` 9개 패키지를 npm public registry에 publish 가능한 상태로 만들기
- 각 패키지에 `tsc` 빌드, 올바른 `package.json` 메타, `dist/` 산출물, dual-resolution `exports` 셋업
- GitHub Actions의 tag push → 자동 publish 워크플로우 (`release.yml`)
- 첫 릴리스 `0.1.0`까지의 release run-book
- LICENSE / README 보강 (public 패키지 최소 요구사항)

### 2.2 Out-of-scope (별도 후속 spec)

- vibe-hr 쪽 AG Grid → vibe-grid 어댑터 설계
- vibe-hr이 vibe-grid를 install하고 한 페이지 PoC 마이그레이션
- 두 저장소의 monorepo 통합
- vibe-grid 자체의 새로운 기능/API 추가
- 1.0 안정화 (`0.x` 동안은 minor bump가 breaking 가능)

### 2.3 종착 상태

> "0.1.0이 npm에 떠 있고 vibe-hr이 이론상 `npm install @vibe-grid/react`로 받을 수 있다."

이 상태가 검증되면 본 spec 완료.

## 3. 핵심 결정 (사용자 승인 5가지)

| # | 결정 항목 | 선택 | 이유 |
|---|-----------|------|------|
| Q1 | 레지스트리 | **npm public** | 가장 보편적, 외부 사용자 진입 장벽 낮음 |
| Q2 | 빌드 도구 | **`tsc` 단독** | 추가 의존성 0, file-per-file 컴파일 (트리쉐이킹 친화), `.d.ts` 자동 생성 |
| Q3 | publish 범위 | **9개 publish, `testing`만 private** | `react`가 `tanstack-adapter`/`virtualization`에 의존하므로 internal 패키지도 publish 필요. README에 internal 명시 |
| Q4 | 버전 관리 | **단일 버전 일괄 bump**, `0.1.0` 시작 | 9패키지가 한 product의 부분, 변경이 동조적. 운영 단순. SemVer `0.x` |
| Q5 | publish 트리거 | **tag push → GitHub Actions 자동** + provenance | lint/build/test 전수 통과 후에만 publish, 휴먼 에러 차단, 공급망 무결성 |

## 4. 아키텍처

### 4.1 파이프라인

```
[ 개발 시 ]                                  [ 릴리스 시 ]

playground/bench (Next.js)                  git tag v0.1.0
   │                                          │
   │ transpilePackages                        │ git push --tags
   ▼ + exports.source                         ▼
@vibe-grid/* 의 src/*.ts ← 직접 사용     GitHub Actions: release.yml
                                              │ npm ci
                                              │ tag-version 검증
                                              │ npm run lint
                                              │ npm run build:packages   ← tsc
                                              │ npm run build            ← apps smoke
                                              │ npm run test:core
                                              │ CI=1 npm run test:e2e
                                              ▼
                                     npm publish -ws
                                     --access public
                                     --provenance
                                              │
                                              ▼
                                     npm registry
                                     ─ 9개 패키지 v0.1.0
                                     ─ testing 은 private (제외)

[ vibe-hr 등 외부 소비자 ]
   npm install @vibe-grid/react
   → registry 에서 dist/index.js + dist/index.d.ts 받음
```

### 4.2 핵심 메커니즘 5가지

1. **Dual-resolution `exports`**
   - `source` condition → `src/index.ts` (monorepo 내부 dev 전용)
   - `import` condition → `dist/index.js` (외부 npm consumer)
   - `types` condition → `dist/index.d.ts`
   - `files: ["dist", "README.md"]`로 src를 tarball에서 제외 → 외부 소비자는 dist만 보임

2. **`workspace:*` 의존 표기**
   - 현재 `"@vibe-grid/core": "0.0.1"` (정확버전) → `"@vibe-grid/core": "workspace:*"`
   - publish 시 npm이 자동으로 `^0.1.0` 같은 range로 변환 (npm 8+)
   - 모든 internal 의존 8쌍에 적용

3. **`npm publish -ws`**
   - 워크스페이스 토폴로지 순서로 자동 publish (`core` → 의존자들 → `react`)
   - `private: true`인 `testing`은 자동 skip
   - 명시적 순서 지정 불필요

4. **npm provenance**
   - `--provenance` 플래그 + `id-token: write` permission + GitHub OIDC
   - 발행된 패키지 페이지에 *"Built and signed on GitHub Actions"* 배지
   - 공급망 공격 방어

5. **Next.js `transpilePackages`**
   - `apps/playground/next.config.ts`, `apps/bench/next.config.ts`에 9개 패키지 명시
   - dev/build 모두에서 `src/*.ts` 처리 가능 (소비자가 monorepo 내부면 source, 외부면 dist)

### 4.3 빌드 산출물 형태 (per package)

```
packages/<name>/
├── src/                  ← 기존 소스 (수정 없음)
│   └── index.ts
├── dist/                 ← 새로 생성 (.gitignore 추가)
│   ├── index.js          ← ESM
│   ├── index.d.ts        ← 타입 정의
│   ├── index.js.map      ← 소스맵
│   └── ...               ← src 트리 거울
├── package.json          ← 수정
├── tsconfig.build.json   ← 신규 (build 전용)
├── README.md             ← 신규/보강
└── LICENSE               ← 루트에서 복사 또는 동일 내용
```

## 5. 패키지별 변경 사양

### 5.1 변경 대상 9개 패키지

| 패키지 | 외부 노출 | 비고 |
|--------|----------|------|
| `@vibe-grid/core` | ✅ public surface | 모든 contracts/타입의 진원지 |
| `@vibe-grid/react` | ✅ public surface | 메인 컴포넌트 |
| `@vibe-grid/i18n` | ✅ public surface | 다국어 |
| `@vibe-grid/theme-shadcn` | ✅ public surface | 테마 토큰 |
| `@vibe-grid/clipboard` | ✅ public surface | 복사/붙여넣기 |
| `@vibe-grid/excel` | ✅ public surface | xlsx 파이프라인 |
| `@vibe-grid/persistence` | ✅ public surface | 컬럼 상태 직렬화 |
| `@vibe-grid/tanstack-adapter` | ⚠️ internal-only | `react` 의존성. README에 INTERNAL 명시 |
| `@vibe-grid/virtualization` | ⚠️ internal-only | `react` 의존성. README에 INTERNAL 명시 |

`@vibe-grid/testing`은 `private: true` 유지 → publish 제외.

### 5.2 표준 `package.json` 패턴 (예: `@vibe-grid/react`)

```json
{
  "name": "@vibe-grid/react",
  "version": "0.1.0",
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

**모든 9개 publish 패키지에 공통 적용되는 변경 8가지:**

1. `private: true` 제거
2. `version: 0.1.0`
3. `license: "MIT"` + `repository`/`homepage`/`bugs`/`keywords`/`description` 추가
4. `react`를 `dependencies`에서 빼고 `peerDependencies`로 (해당 publish 패키지: `@vibe-grid/react`, `@vibe-grid/tanstack-adapter`, `@vibe-grid/virtualization`. `testing`은 publish 안 되므로 무관하지만 일관성을 위해 동일 적용)
5. `@vibe-grid/*` 의존을 `"0.0.1"` → `"workspace:*"`
6. `exports`를 dual-resolution 형태로
7. `files: ["dist", "README.md"]`
8. `publishConfig: { access: "public", provenance: true }`

추가로 각 패키지에 `scripts.build` 추가.

### 5.3 표준 `tsconfig.build.json` 패턴

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

9개 모두 동일 — `extends`로 base 끌어오고 `noEmit` override.

### 5.4 internal-only 패키지 차별화

`@vibe-grid/tanstack-adapter`와 `@vibe-grid/virtualization`은:

- `package.json` `description`을 `[INTERNAL] ...` 접두로 명시
- `keywords`에 `"internal"` 추가
- README에 INTERNAL 경고 (5.7 참조)

### 5.5 루트 `package.json` scripts 추가

```json
{
  "scripts": {
    "clean:packages": "npm run clean -ws --if-present",
    "build:packages": "npm run build -ws --if-present",
    "prepublishOnly": "npm run lint && npm run build:packages && npm run test:core"
  }
}
```

`-ws --if-present`: workspace 전체에 forward, `build` 스크립트 없는 패키지(testing)는 skip.

루트 `package.json`에 추가:
```json
"license": "MIT",
"author": "minseok kim",
"repository": "github:qoxmfaktmxj/vibe-grid"
```

### 5.6 루트 `.gitignore` 추가

```
packages/*/dist
packages/*/*.tsbuildinfo
```

### 5.7 README 변경

#### 루트 `README.md` 보강

- 상단에 npm 뱃지(`@vibe-grid/react` 버전, MIT) + `npm install` 한 줄
- 워크스페이스 표에 "npm" 컬럼 추가 (publish 대상엔 npm 링크, internal엔 `—`)
- "안정성 경계" 섹션에 SemVer 정책 한 줄 추가: *"`0.x` 동안은 minor bump가 breaking change 포함 가능"*
- "## Release" 섹션 신규 (배포 섹션 위에 위치):
  ```bash
  npm version 0.1.1 -ws --include-workspace-root --no-git-tag-version
  git commit -am "chore(release): 0.1.1"
  git tag -a v0.1.1 -m "Release 0.1.1"
  git push origin master --follow-tags
  ```

#### 패키지별 `README.md`

**외부 surface 7개 (`core`, `react`, `clipboard`, `excel`, `i18n`, `persistence`, `theme-shadcn`)** — 공통 골격:

```markdown
# @vibe-grid/<name>

<한 줄 설명>

> ⚠️ `0.x` 동안은 minor bump가 breaking change를 포함할 수 있습니다.

## 설치

\`\`\`bash
npm install @vibe-grid/<name>
\`\`\`

## 빠른 예시

<패키지별 최소 사용 예제>

## 문서

- [전체 README](https://github.com/qoxmfaktmxj/vibe-grid#readme)
- [공개 API 안정성 경계](https://github.com/qoxmfaktmxj/vibe-grid/blob/master/docs/release/public-api-stability.md)
- [Lab/Bench 데모](https://grid.minseok91.cloud)

## 라이선스

MIT
```

**internal 2개 (`tanstack-adapter`, `virtualization`)** — 경고 README:

```markdown
# @vibe-grid/<name>

> **⚠️ INTERNAL PACKAGE — Direct consumption is unsupported.**
>
> 이 패키지는 [`@vibe-grid/react`](https://www.npmjs.com/package/@vibe-grid/react) 내부에서만 사용됩니다.
> API는 minor 버전에서도 예고 없이 변경될 수 있습니다.
>
> 그리드를 사용하시려면 [`@vibe-grid/react`](https://www.npmjs.com/package/@vibe-grid/react)를 설치하세요.

## 라이선스

MIT
```

### 5.8 LICENSE

루트에 `LICENSE` 파일 신규 작성 (MIT, Copyright `(c) 2026 minseok kim`).

각 패키지의 `files: ["dist", "README.md"]`에 LICENSE는 명시되지 않지만, npm은 상위 디렉토리의 LICENSE를 자동으로 tarball에 포함시킨다. 명시적 안전을 위해 각 패키지 디렉토리에도 동일 LICENSE 복사 권장 (선택).

### 5.9 Next.js apps 변경

`apps/playground/next.config.ts` & `apps/bench/next.config.ts`에 추가:

```ts
const nextConfig: NextConfig = {
  // 기존 설정 유지
  transpilePackages: [
    "@vibe-grid/core",
    "@vibe-grid/react",
    "@vibe-grid/clipboard",
    "@vibe-grid/excel",
    "@vibe-grid/i18n",
    "@vibe-grid/persistence",
    "@vibe-grid/tanstack-adapter",
    "@vibe-grid/testing",
    "@vibe-grid/theme-shadcn",
    "@vibe-grid/virtualization"
  ]
};
```

## 6. Release Workflow

### 6.1 신규 파일 `.github/workflows/release.yml`

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
      id-token: write       # provenance OIDC 발급에 필수
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

### 6.2 기존 `ci.yml` 수정

tag push 시 ci.yml + release.yml 중복 방지:

```yaml
on:
  push:
    branches: [master]
    tags-ignore: ['v*.*.*']
  pull_request:
```

### 6.3 npm provenance 발급 조건 (체크리스트)

- ✅ Node 22 (`setup-node`에 명시)
- ✅ npm ≥ 9.5 (Node 22 번들 npm은 10+)
- ✅ `id-token: write` permission
- ✅ `--provenance` 플래그
- ✅ public 패키지 (private은 provenance 불가)
- ✅ workflow가 GitHub Actions에서 직접 실행

## 7. 첫 릴리스 Run-book

본 spec의 구현 PR이 master에 머지된 다음 실행한다.

### Phase 0. 사전 체크 (1회)

- [ ] master에 5장/6장의 모든 변경이 머지됨
- [ ] `NPM_TOKEN` secret이 GitHub repo에 등록됨
- [ ] `vibe-grid` npm org이 존재 + 본인이 owner/maintainer
- [ ] 9개 패키지 모두 `private: true` 제거됨 (`testing`만 유지)
- [ ] 루트 LICENSE 존재
- [ ] 9개 publish 대상 패키지에 `README.md` 존재

### Phase 1. Dry-run 검증

GitHub → Actions → "Release" workflow → **Run workflow** → branch `master`, `dry_run: true` → 실행.

통과: lint/build/test 다 그린 → Phase 2.
실패: 문제 수정 PR → 머지 → 재시도.

### Phase 2. 로컬 사전 검증

```bash
git pull origin master
npm ci
npm run lint
npm run build:packages
npm run build
npm run test:core
$env:CI='1'; npm run test:e2e

# tarball pre-flight: workspace:* 가 ^0.1.0 으로 변환되는지
npm pack -w @vibe-grid/react --dry-run
```

### Phase 3. 버전 일괄 bump

```bash
npm version 0.1.0 -ws --include-workspace-root --no-git-tag-version

# CHANGELOG.md 한 줄 추가
#   ## 0.1.0 — 2026-04-XX
#   - first public release on npm

git add -A
git commit -m "chore(release): 0.1.0"
```

### Phase 4. 태그 + 푸시

```bash
git tag -a v0.1.0 -m "Release 0.1.0"
git push origin master --follow-tags
```

### Phase 5. 모니터링

- GitHub Actions → Release run 진행 상황
- 마지막 step "Publish to npm" 통과 확인
- npm 페이지 9개 모두 확인:
  - `https://www.npmjs.com/package/@vibe-grid/core`
  - `https://www.npmjs.com/package/@vibe-grid/react`
  - `https://www.npmjs.com/package/@vibe-grid/i18n`
  - `https://www.npmjs.com/package/@vibe-grid/theme-shadcn`
  - `https://www.npmjs.com/package/@vibe-grid/clipboard`
  - `https://www.npmjs.com/package/@vibe-grid/excel`
  - `https://www.npmjs.com/package/@vibe-grid/persistence`
  - `https://www.npmjs.com/package/@vibe-grid/tanstack-adapter`
  - `https://www.npmjs.com/package/@vibe-grid/virtualization`
- "Built and signed on GitHub Actions" 배지 확인 → provenance 성공

### Phase 6. 사후 스모크 테스트

`@vibe-grid/*` 는 ESM-only 패키지이므로 dynamic import 또는 `.mjs` 사용:

```bash
mkdir /tmp/vg-smoke && cd /tmp/vg-smoke
npm init -y
npm pkg set type=module
npm install @vibe-grid/react@0.1.0 react@19 react-dom@19

# dynamic import 로 export 키 확인
node -e "import('@vibe-grid/react').then(m => console.log(Object.keys(m)))"
# VibeGrid, VibeGridPlaceholder, createVibeGridTheme, ... 등이 출력되면 OK

# 타입 체크: 별도 ts 파일 만들어 tsc --noEmit 으로 확인 (선택)
```

### 흔한 함정

| 증상 | 원인 | 대응 |
|------|------|------|
| `403 Forbidden` on publish | NPM_TOKEN 만료/권한 부족 | npm token 재발급 |
| `400 cannot publish over previously published versions` | 동일 버전 재발행 시도 | patch bump |
| `private: true` 잔존 | manifest 변경 누락 | private 제거 PR |
| `workspace:*` 그대로 publish | npm 8 미만 | npm 버전 확인, 9+ 사용 |
| provenance 발급 실패 | `id-token: write` 누락, npm < 9.5 | workflow permissions, Node 22 확인 |

### 롤백 / 사고 대응

- **24h 내**: `npm unpublish @vibe-grid/<name>@0.1.0` (한 번만, 영구히 그 버전 재사용 불가)
- **24h 이후**: `npm deprecate @vibe-grid/<name>@0.1.0 "Use 0.1.1 instead"` + patch bump
- **정책**: `unpublish`는 최후 수단. 가능하면 `deprecate + patch bump`.

## 8. Done Definition

본 spec의 구현이 완료된 것으로 간주하는 기준:

1. master 브랜치에서 `npm run build:packages` 실행 시 9개 `dist/` 디렉토리가 모두 생성됨
2. master 브랜치에서 `npm run dev:playground` 실행 시 기존과 동일하게 5050에서 동작 (회귀 없음)
3. `npm pack -w @vibe-grid/react --dry-run` 출력에서 의존성이 `^0.1.0` 형태로 변환됨을 확인
4. GitHub Actions에서 `release.yml` dry-run이 그린으로 통과
5. 실제 publish (Phase 4) 후 9개 패키지가 npm registry에서 조회 가능 + provenance 배지 표시
6. Phase 6 스모크 테스트가 통과 (`@vibe-grid/react` exports 정상)

## 9. 변경 영향 영역

| 영역 | 변경 | 위험도 |
|------|------|--------|
| `packages/*/package.json` | 9개 매니페스트 표준화 | 중 (workspace:* 변환 동작 검증 필요) |
| `packages/*/tsconfig.build.json` | 9개 신규 | 낮음 |
| `packages/*/README.md` | 9개 신규/보강 | 낮음 |
| `package.json` (루트) | scripts/license/repository 추가 | 낮음 |
| `apps/playground/next.config.ts` | `transpilePackages` 추가 | 중 (dev 동작 검증) |
| `apps/bench/next.config.ts` | `transpilePackages` 추가 | 중 (dev 동작 검증) |
| `tsconfig.base.json` | 변경 없음 (build config가 override) | 0 |
| `.github/workflows/release.yml` | 신규 | 중 (첫 publish 시 검증) |
| `.github/workflows/ci.yml` | tag-ignore 추가 | 낮음 |
| `LICENSE` | 신규 | 0 |
| `.gitignore` | dist 추가 | 0 |

기존 코드(`packages/*/src/**`)는 변경하지 않는다.

## 10. 참고

- `docs/release/public-api-stability.md` — 어떤 API가 stable/experimental인지
- `docs/roadmap/current-execution-plan.md` — 현재 실행 우선순위
- `README.md` — 모노레포 안내
- 본 spec의 결정은 사용자와 5번의 Q&A를 거쳐 합의되었다 (Q1=B, Q2=A, Q3=A, Q4=A, Q5=A).
