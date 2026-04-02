# Claudian

Claude Code를 Obsidian vault에 AI 협업자로 내장하는 플러그인. Vault가 Claude의 작업 디렉토리가 되어, 파일 읽기/쓰기, 검색, 배시 명령어, 멀티스텝 워크플로우 등 완전한 에이전트 기능을 제공한다.

## 기능

- **완전한 에이전트 기능**: Claude Code의 강력한 기능을 활용해 Obsidian vault 내에서 파일 읽기, 쓰기, 편집, 검색, 배시 명령어 실행이 가능하다.
- **컨텍스트 인식**: 현재 포커스된 노트를 자동으로 첨부하고, `@`으로 파일을 언급하거나, 태그로 노트를 제외하고, 에디터 선택 영역(하이라이트)을 포함하며, 추가 컨텍스트를 위해 외부 디렉토리에 접근할 수 있다.
- **비전 지원**: 드래그 앤 드롭, 붙여넣기, 파일 경로 입력으로 이미지를 전송해 분석할 수 있다.
- **인라인 편집**: 선택한 텍스트를 편집하거나 커서 위치에 내용을 삽입할 수 있으며, 단어 수준의 diff 미리보기와 읽기 전용 도구로 컨텍스트를 파악한다.
- **지시사항 모드 (`#`)**: 채팅 입력에서 직접 시스템 프롬프트에 커스텀 지시사항을 추가할 수 있으며, 모달에서 검토/편집이 가능하다.
- **슬래시 명령어**: `/command`로 트리거되는 재사용 가능한 프롬프트 템플릿을 만들 수 있으며, 인수 플레이스홀더, `@file` 참조, 선택적 인라인 배시 치환을 지원한다.
- **스킬**: 컨텍스트에 따라 자동으로 호출되는 재사용 가능한 기능 모듈로 Claudian을 확장하며, Claude Code의 스킬 형식과 호환된다.
- **커스텀 에이전트**: Claude가 호출할 수 있는 커스텀 서브에이전트를 정의하며, 도구 제한 및 모델 오버라이드를 지원한다.
- **Claude Code 플러그인**: CLI를 통해 설치된 Claude Code 플러그인을 활성화하며, `~/.claude/plugins`에서 자동으로 검색하고 vault별 설정이 가능하다. 플러그인의 스킬, 에이전트, 슬래시 명령어가 원활하게 통합된다.
- **MCP 지원**: Model Context Protocol 서버(stdio, SSE, HTTP)를 통해 외부 도구와 데이터 소스를 연결하며, 컨텍스트 저장 모드와 `@`-멘션 활성화를 지원한다.
- **고급 모델 제어**: Haiku, Sonnet, Opus 중 선택하고, 환경 변수로 커스텀 모델을 설정하며, 생각 예산(thinking budget)을 미세 조정하고, 1M 컨텍스트 윈도우의 Opus 및 Sonnet을 활성화할 수 있다 (Max 구독 또는 추가 사용량 필요).
- **플랜 모드**: 채팅 입력에서 Shift+Tab으로 플랜 모드를 토글한다. Claudian이 구현 전에 탐색하고 설계하여 계획을 제시하며, 새 세션에서 승인, 현재 세션에서 계속, 또는 피드백 제공 중 선택할 수 있다.
- **보안**: 권한 모드(Auto/Safe/Plan), 안전 차단 목록, 심볼릭 링크 안전 검사를 포함한 vault 제한.
- **Claude in Chrome**: `claude-in-chrome` 확장 프로그램을 통해 Claude가 Chrome과 상호작용할 수 있다.

## 요구 사항

- [Claude Code CLI](https://code.claude.com/docs/en/overview) 설치 (Native Install 방식 강력 권장)
- Obsidian v1.8.9 이상
- Claude 구독/API 또는 Anthropic API 형식을 지원하는 커스텀 모델 제공자 ([Openrouter](https://openrouter.ai/docs/guides/guides/claude-code-integration), [Kimi](https://platform.moonshot.ai/docs/guide/agent-support), [GLM](https://docs.z.ai/devpack/tool/claude), [DeepSeek](https://api-docs.deepseek.com/guides/anthropic_api) 등)
- 데스크탑 전용 (macOS, Linux, Windows)

### BRAT 사용

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tester)를 사용하면 GitHub에서 직접 플러그인을 설치하고 자동 업데이트할 수 있다.

1. Obsidian 커뮤니티 플러그인에서 BRAT 플러그인 설치
2. 설정 → 커뮤니티 플러그인에서 BRAT 활성화
3. BRAT 설정을 열고 "Add Beta plugin" 클릭
4. 저장소 URL 입력: `https://github.com/paikpaik/claudian`
5. "Add Plugin" 클릭하면 BRAT이 Claudian을 자동으로 설치
6. 설정 → 커뮤니티 플러그인에서 Claudian 활성화

> **팁**: BRAT은 자동으로 업데이트를 확인하고 새 버전이 나오면 알려준다.

### 소스에서 설치 (개발)

1. Vault의 플러그인 폴더에 저장소 클론:
   ```bash
   cd /path/to/vault/.obsidian/plugins
   git clone https://github.com/paikpaik/claudian.git
   cd claudian
   ```

2. 의존성 설치 및 빌드:
   ```bash
   npm install
   npm run build
   ```

3. Obsidian에서 플러그인 활성화:
   - 설정 → 커뮤니티 플러그인 → "Claudian" 활성화

### 개발

```bash
# 감시 모드
npm run dev

# 프로덕션 빌드
npm run build
```

> **팁**: `.env.local.example`을 `.env.local`로 복사하거나 `npm install`로 vault 경로를 설정하면 개발 중 파일이 자동으로 복사된다.

## 사용법

**두 가지 모드:**
1. 리본의 봇 아이콘 클릭 또는 명령 팔레트로 채팅 열기
2. 텍스트 선택 + 단축키로 인라인 편집

Claude Code처럼 사용하면 된다 — vault 내 파일 읽기, 쓰기, 편집, 검색이 가능하다.

### 컨텍스트

- **파일**: 현재 포커스된 노트 자동 첨부; `@`를 입력해 다른 파일 첨부
- **@-멘션 드롭다운**: `@`를 입력하면 MCP 서버, 에이전트, 외부 컨텍스트, vault 파일이 표시됨
  - `@Agents/` — 커스텀 에이전트 선택
  - `@mcp-server` — 컨텍스트 저장 MCP 서버 활성화
  - `@folder/` — 외부 컨텍스트 폴더로 파일 필터링 (예: `@workspace/`)
  - 기본적으로 vault 파일 표시
- **선택 영역**: 에디터에서 텍스트 선택 또는 캔버스에서 요소 선택 후 채팅 — 선택 내용이 자동으로 포함됨
- **이미지**: 드래그 앤 드롭, 붙여넣기, 경로 입력; `![[image]]` 임베드를 위한 미디어 폴더 설정 가능
- **외부 컨텍스트**: 툴바의 폴더 아이콘을 클릭해 vault 외부 디렉토리에 접근

### 기능

- **인라인 편집**: 텍스트 선택 + 단축키로 단어 수준 diff 미리보기와 함께 노트에서 직접 편집
- **지시사항 모드**: `#`을 입력해 시스템 프롬프트에 지시사항 추가
- **슬래시 명령어**: `/`를 입력해 커스텀 프롬프트 템플릿 또는 스킬 사용
- **스킬**: `~/.claude/skills/` 또는 `{vault}/.claude/skills/`에 `skill/SKILL.md` 파일 추가 (Claude Code로 스킬 관리 권장)
- **커스텀 에이전트**: `~/.claude/agents/` (전역) 또는 `{vault}/.claude/agents/` (vault 전용)에 `agent.md` 파일 추가; 채팅에서 `@Agents/`로 선택하거나 Claudian에게 에이전트 호출 요청
- **Claude Code 플러그인**: 설정 → Claude Code 플러그인에서 활성화 (Claude Code로 플러그인 관리 권장)
- **MCP**: 설정 → MCP 서버에서 외부 도구 추가; 채팅에서 `@mcp-server`로 활성화

## 설정

### 설정 항목

**커스터마이징**
- **사용자 이름**: 개인화된 인사말을 위한 이름
- **제외 태그**: 노트 자동 로드를 방지하는 태그 (예: `sensitive`, `private`)
- **미디어 폴더**: 임베드 이미지 지원을 위해 vault가 첨부파일을 저장하는 위치 설정 (예: `attachments`)
- **커스텀 시스템 프롬프트**: 기본 시스템 프롬프트에 추가되는 지시사항 (지시사항 모드 `#`에서 여기에 저장됨)
- **자동 스크롤 활성화**: 스트리밍 중 하단으로 자동 스크롤 토글 (기본값: 켜짐)
- **대화 제목 자동 생성**: 첫 번째 사용자 메시지 전송 후 AI 기반 제목 생성 토글
- **제목 생성 모델**: 대화 제목 자동 생성에 사용할 모델 (기본값: Auto/Haiku)
- **Vim 스타일 네비게이션 매핑**: `map w scrollUp`, `map s scrollDown`, `map i focusInput` 형식으로 키 바인딩 설정

**단축키**
- **인라인 편집 단축키**: 선택한 텍스트에 인라인 편집을 트리거하는 단축키
- **채팅 열기 단축키**: 채팅 사이드바를 여는 단축키

**슬래시 명령어**
- 커스텀 `/commands` 생성/편집/가져오기/내보내기 (선택적으로 모델 및 허용 도구 오버라이드 가능)

**MCP 서버**
- 컨텍스트 저장 모드를 지원하는 MCP 서버 설정 추가/편집/검증/삭제

**Claude Code 플러그인**
- `~/.claude/plugins`에서 검색된 Claude Code 플러그인 활성화/비활성화
- 사용자 범위 플러그인은 모든 vault에서 사용 가능; 프로젝트 범위 플러그인은 일치하는 vault에서만 사용 가능

**보안**
- **사용자 Claude 설정 로드**: `~/.claude/settings.json` 로드 (사용자의 Claude Code 권한 규칙이 Safe 모드를 우회할 수 있음)
- **명령어 차단 목록 활성화**: 위험한 배시 명령어 차단 (기본값: 켜짐)
- **차단된 명령어**: 차단할 패턴 (정규식 지원, 플랫폼별)
- **허용된 내보내기 경로**: vault 외부에서 파일을 내보낼 수 있는 경로 (기본값: `~/Desktop`, `~/Downloads`). `~`, `$VAR`, `${VAR}`, `%VAR%` (Windows) 지원.

**환경**
- **커스텀 변수**: Claude SDK를 위한 환경 변수 (KEY=VALUE 형식, `export ` 접두사 지원)
- **환경 스니펫**: 환경 변수 설정 저장 및 복원

**고급**
- **Claude CLI 경로**: Claude Code CLI의 커스텀 경로 (자동 감지를 원하면 비워둠)

## 보안 및 권한

| 범위 | 접근 권한 |
|------|-----------|
| **Vault** | 전체 읽기/쓰기 (`realpath`를 통한 심볼릭 링크 안전 검사) |
| **내보내기 경로** | 쓰기 전용 (예: `~/Desktop`, `~/Downloads`) |
| **외부 컨텍스트** | 전체 읽기/쓰기 (세션 한정, 폴더 아이콘으로 추가) |

- **Auto 모드**: 승인 프롬프트 없음; 모든 도구 호출이 자동으로 실행됨 (기본값)
- **Safe 모드**: 도구 호출마다 승인 프롬프트; Bash는 정확히 일치해야 하고, 파일 도구는 접두사 일치 허용
- **플랜 모드**: 구현 전에 계획을 탐색하고 설계. 채팅 입력에서 Shift+Tab으로 토글

## 개인 정보 및 데이터 사용

- **API로 전송**: 입력, 첨부 파일, 이미지, 도구 호출 출력. 기본값: Anthropic; `ANTHROPIC_BASE_URL`로 커스텀 엔드포인트 설정 가능.
- **로컬 저장소**: 설정, 세션 메타데이터, 명령어는 `vault/.claude/`에 저장; 세션 메시지는 `~/.claude/projects/` (SDK 네이티브); 이전 세션은 `vault/.claude/sessions/`에 저장.
- **텔레메트리 없음**: 설정된 API 제공자 외에는 추적 없음.

## 문제 해결

### Claude CLI를 찾을 수 없음

`spawn claude ENOENT` 또는 `Claude CLI not found`가 발생하면, 플러그인이 Claude 설치를 자동으로 감지하지 못한 것이다. nvm, fnm, volta 같은 Node 버전 관리자를 사용할 때 자주 발생한다.

**해결책**: CLI 경로를 찾아 설정 → 고급 → Claude CLI 경로에 입력하라.

| 플랫폼 | 명령어 | 경로 예시 |
|--------|--------|-----------|
| macOS/Linux | `which claude` | `/Users/you/.volta/bin/claude` |
| Windows (native) | `where.exe claude` | `C:\Users\you\AppData\Local\Claude\claude.exe` |
| Windows (npm) | `npm root -g` | `{root}\@anthropic-ai\claude-code\cli.js` |

> **참고**: Windows에서는 `.cmd` 래퍼를 피하고 `claude.exe` 또는 `cli.js`를 사용하라.

**대안**: 설정 → 환경 → 커스텀 변수에서 Node.js bin 디렉토리를 PATH에 추가하라.

### npm CLI와 Node.js가 같은 디렉토리에 없음

npm으로 CLI를 설치한 경우, `claude`와 `node`가 같은 디렉토리에 있는지 확인하라:
```bash
dirname $(which claude)
dirname $(which node)
```

다른 경우, Obsidian 같은 GUI 앱이 Node.js를 찾지 못할 수 있다.

**해결책**:
1. 네이티브 바이너리 설치 (권장)
2. 설정 → 환경에서 Node.js 경로 추가: `PATH=/path/to/node/bin`

## 아키텍처

```
src/
├── main.ts                      # 플러그인 진입점
├── core/                        # 핵심 인프라
│   ├── agent/                   # Claude Agent SDK 래퍼 (ClaudianService)
│   ├── agents/                  # 커스텀 에이전트 관리 (AgentManager)
│   ├── commands/                # 슬래시 명령어 관리 (SlashCommandManager)
│   ├── hooks/                   # PreToolUse/PostToolUse 훅
│   ├── images/                  # 이미지 캐싱 및 로딩
│   ├── mcp/                     # MCP 서버 설정, 서비스, 테스트
│   ├── plugins/                 # Claude Code 플러그인 검색 및 관리
│   ├── prompts/                 # 에이전트를 위한 시스템 프롬프트
│   ├── sdk/                     # SDK 메시지 변환
│   ├── security/                # 승인, 차단 목록, 경로 검증
│   ├── storage/                 # 분산 스토리지 시스템
│   ├── tools/                   # 도구 상수 및 유틸리티
│   └── types/                   # 타입 정의
├── features/                    # 기능 모듈
│   ├── chat/                    # 메인 채팅 뷰 + UI, 렌더링, 컨트롤러, 탭
│   ├── inline-edit/             # 인라인 편집 서비스 + UI
│   └── settings/                # 설정 탭 UI
├── shared/                      # 공유 UI 컴포넌트 및 모달
│   ├── components/              # 입력 툴바, 드롭다운, 선택 하이라이트
│   ├── mention/                 # @-멘션 드롭다운 컨트롤러
│   ├── modals/                  # 지시사항 모달
│   └── icons.ts                 # 공유 SVG 아이콘
├── i18n/                        # 국제화 (10개 로케일)
├── utils/                       # 모듈형 유틸리티 함수
└── style/                       # 모듈형 CSS (→ styles.css)
```

## 버전 히스토리

| 버전 | 변경 내용 |
|------|-----------|
| **1.1.0** | 자연어 Slack 일정 비서 — "3시에 회의있어"처럼 자연어로 입력하면 Obsidian Daily Note에 일정 기록 + Slack 즉시/예약 알림 자동 전송. `/schedule` 슬래시 커맨드, 설정 탭 알림 채널/리마인더 시간 설정 추가 |
| **1.0.1** | 한국어 UI 지원 강화 — 슬래시 커맨드 모달, 인사말 등 미번역 영역 완전 한국어화. Auto/Safe/Plan 모드명 변경 |
| **1.0.0** | 최초 공개 릴리즈 |

## 로드맵

- [x] Claude Code 플러그인 지원
- [x] 커스텀 에이전트(서브에이전트) 지원
- [x] Claude in Chrome 지원
- [x] `/compact` 명령어
- [x] 플랜 모드
- [x] `rewind` 및 `fork` 지원 (`/fork` 명령어 포함)
- [x] `!command` 지원
- [x] 도구 렌더러 개선
- [x] 1M Opus 및 Sonnet 모델
- [x] 자연어 Slack 일정 비서 (`/schedule` + 시스템 프롬프트 자연어 감지)
- [ ] 훅 및 기타 고급 기능
- [ ] 더 많은 기능 예정!

# LICENSE

paikpaik/Claudian은 YishenTu/Claudian을 포크하여 개발.
개인적이고 주관적인 개발 및 기능 추가 예정.
마음대로 사용하셔도 되며 법적 책임은 없습니다.