# CLAUDE.md

## 프로젝트 개요

Claudian - Claude Code를 사이드바 채팅 인터페이스로 내장한 Obsidian 플러그인. Vault 디렉토리가 Claude의 작업 디렉토리가 되어, 파일 읽기/쓰기, 배시 명령어, 멀티스텝 워크플로우 등 완전한 에이전트 기능을 제공한다.

## 명령어

```bash
npm run dev        # 개발 (감시 모드)
npm run build      # 프로덕션 빌드
npm run typecheck  # 타입 검사
npm run lint       # 린트 검사
npm run lint:fix   # 린트 자동 수정
npm run test       # 테스트 실행
npm run test:watch # 테스트 감시 모드
```

## 아키텍처

| 레이어 | 역할 | 세부 사항 |
|--------|------|-----------|
| **core** | 인프라 (기능 의존성 없음) | [`src/core/CLAUDE.md`](src/core/CLAUDE.md) 참조 |
| **features/chat** | 메인 사이드바 인터페이스 | [`src/features/chat/CLAUDE.md`](src/features/chat/CLAUDE.md) 참조 |
| **features/inline-edit** | 인라인 편집 모달 | `InlineEditService`, 읽기 전용 도구 |
| **features/settings** | 설정 탭 | 모든 설정을 위한 UI 컴포넌트 |
| **shared** | 재사용 가능한 UI | 드롭다운, 지시사항 모달, 포크 타겟 모달, @-멘션, 아이콘 |
| **i18n** | 국제화 | 10개 로케일 |
| **utils** | 유틸리티 함수 | date, path, env, editor, session, markdown, diff, context, sdkSession, frontmatter, slashCommand, mcp, claudeCli, externalContext, externalContextScanner, fileLink, imageEmbed, inlineEdit |
| **style** | 모듈형 CSS | [`src/style/CLAUDE.md`](src/style/CLAUDE.md) 참조 |

## 테스트

```bash
npm run test -- --selectProjects unit        # 유닛 테스트 실행
npm run test -- --selectProjects integration # 통합 테스트 실행
npm run test:coverage -- --selectProjects unit # 유닛 커버리지
```

테스트는 `tests/unit/`과 `tests/integration/` 아래에 `src/` 구조를 그대로 반영한다.

## 저장소

| 파일 | 내용 |
|------|------|
| `.claude/settings.json` | CC 호환: 권한, env, enabledPlugins |
| `.claude/claudian-settings.json` | Claudian 전용 설정 (모델, UI 등) |
| `.claude/settings.local.json` | 로컬 오버라이드 (gitignored) |
| `.claude/mcp.json` | MCP 서버 설정 |
| `.claude/commands/*.md` | 슬래시 명령어 (YAML 프론트매터) |
| `.claude/agents/*.md` | 커스텀 에이전트 (YAML 프론트매터) |
| `.claude/skills/*/SKILL.md` | 스킬 정의 |
| `.claude/sessions/*.meta.json` | 세션 메타데이터 |
| `~/.claude/projects/{vault}/*.jsonl` | SDK 네이티브 세션 메시지 |

## 개발 참고사항

- **SDK 우선**: 커스텀 구현보다 네이티브 Claude SDK 기능을 적극 활용한다. SDK가 기능을 제공한다면 그것을 사용하고, 재발명하지 않는다. 이는 Claude Code와의 호환성을 보장한다.
- **SDK 탐색**: SDK 관련 기능 개발 시, 실제 SDK를 호출하는 임시 테스트 스크립트를 `dev/`에 작성한다. 실제 응답 형태, 이벤트 시퀀스, 엣지 케이스를 관찰하라. 실제 출력은 `~/.claude/` 또는 `{vault}/.claude/`에 저장된다 — 패턴과 형식을 이해하기 위해 해당 파일을 검사하라. 구현이나 테스트 작성 전에 이 단계를 먼저 수행한다. 실제 출력이 타입과 형식을 추측하는 것보다 훨씬 낫다. 이것이 모든 SDK 통합 작업의 기본 첫 단계다.
- **주석**: WHY(왜)만 주석으로 남기고, WHAT(무엇)은 쓰지 않는다. 함수명을 그대로 반복하는 JSDoc (`getServers()`에 `/** Get servers. */`), 코드를 설명하는 인라인 주석 (`new Channel()` 앞에 `// Create the channel`), barrel `index.ts` 파일의 모듈 수준 문서는 작성하지 않는다. 비명확한 맥락(엣지 케이스, 제약사항, 예상치 못한 동작)을 추가할 때만 JSDoc을 유지한다.
- **TDD 워크플로우**: 새 함수/모듈 및 버그 수정 시 red-green-refactor를 따른다:
  1. `tests/unit/` (또는 `tests/integration/`) 하위 미러링된 경로에 실패하는 테스트를 먼저 작성
  2. `npm run test -- --selectProjects unit --testPathPattern <패턴>`으로 실행해 실패 확인
  3. 테스트를 통과시키는 최소한의 구현 작성
  4. 테스트가 초록색을 유지하면서 리팩터링
  - 버그 수정 시, 수정 전에 버그를 재현하는 테스트를 먼저 작성
  - 내부 구현 세부사항이 아닌 동작과 공개 API를 테스트
  - 단순 변경(이름 변경, 파일 이동, 설정 수정)에는 TDD를 건너뛰어도 되지만, 기존 테스트 통과는 반드시 확인
- 편집 후 `npm run typecheck && npm run lint && npm run test && npm run build` 실행
- 프로덕션 코드에 `console.*` 사용 금지
  - 사용자에게 알림이 필요하면 Obsidian 알림 시스템 사용
  - 디버깅에는 `console.log`를 사용하되, 커밋 전에 반드시 제거
- 생성된 문서/테스트 스크립트는 `dev/`에 저장
