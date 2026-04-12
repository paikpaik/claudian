import type { SlashCommand } from '../types';

/** A bundled command template shipped with the plugin. */
export interface PluginCommandTemplate {
  /** Unique key within the plugin commands registry. */
  key: string;
  name: string;
  description: string;
  category: string;
  argumentHint?: string;
  allowedTools?: string[];
  /** Raw prompt body — no YAML frontmatter. */
  content: string;
}

/** Converts a plugin command template to a SlashCommand ready for SlashCommandStorage.save(). */
export function templateToSlashCommand(template: PluginCommandTemplate): SlashCommand {
  return {
    id: `plugin-${template.key}`,
    name: template.name,
    description: template.description,
    argumentHint: template.argumentHint,
    allowedTools: template.allowedTools,
    content: template.content,
  };
}

export const PLUGIN_COMMANDS: PluginCommandTemplate[] = [
  {
    key: 'css',
    name: 'css',
    description: '자연어로 CSS 효과/컴포넌트 코드 생성',
    category: '디자이너',
    argumentHint: '[효과 설명]',
    allowedTools: ['Read', 'Write'],
    content: `다음 설명을 CSS로 변환해줘: $ARGUMENTS

## 생성 규칙

1. 모던 CSS 우선 (flexbox, grid, custom properties, :has(), container queries, @layer 등)
2. 필요 시 벤더 프리픽스 포함 (-webkit- 등)
3. 코드 뒤에 주요 속성의 역할을 한 줄씩 한국어로 설명
4. 최신 브라우저에서만 지원되는 속성이 있으면 호환성 주의사항 한 줄 추가
5. 모션/다크모드 접근성 미디어 쿼리가 자연스럽게 어울리면 추가
6. vault에 design-tokens/ 폴더가 있으면 CSS 변수 활용
7. 저장은 사용자가 "저장해줘"라고 할 때만

## 키워드 → 기법 가이드

| 표현 | CSS 기법 |
|------|---------|
| 유리, 글래스모피즘 | backdrop-filter: blur() + 반투명 배경 |
| 뉴모피즘, 입체감 | box-shadow 이중 (inset + normal), 같은 배경색 |
| 스켈레톤 로딩 | @keyframes shimmer + background: linear-gradient |
| 반응형, 유동적 | clamp(), min(), max(), container queries |
| 다크모드 지원 | prefers-color-scheme: dark 미디어 쿼리 |
| 호버 시 떠오름 | transform: translateY() + box-shadow transition |
| 부드러운 전환 | transition, ease, cubic-bezier |`,
  },
  {
    key: 'type-scale',
    name: 'type-scale',
    description: '수학적 비율 기반 타이포그래피 스케일 생성',
    category: '디자이너',
    argumentHint: '[기준크기] [비율] [폰트]',
    allowedTools: ['Read', 'Write'],
    content: `타이포그래피 스케일을 생성해줘: $ARGUMENTS

## 파싱 규칙

- 기준 크기: 숫자(px 또는 rem), 기본값 16px
- 비율: 숫자 또는 이름(아래 표 참고), 기본값 major-third
- 폰트: 명시된 폰트명, 기본값 system-ui
- 공식: size(n) = base × ratio^n (n=0이 body 기준)

## 비율 이름 → 값

| 이름 | 비율 | 느낌 |
|------|------|------|
| minor-second | 1.067 | 미니멀, 조밀 |
| major-second | 1.125 | 편안한, 본문 중심 |
| minor-third | 1.200 | 균형 잡힌 |
| major-third | 1.250 | 클래식, 범용 (기본) |
| perfect-fourth | 1.333 | 대담한, 제목 강조 |
| perfect-fifth | 1.500 | 극적 |
| golden | 1.618 | 예술적, 아트 디렉션 |

## 단계 이름 (8단계, -2 ~ +5)

display(+5) → h1(+4) → h2(+3) → h3(+2) → h4(+1) → body(0) → small(-1) → caption(-2)

행간(line-height): display=1.0, h1=1.1, h2=1.2, h3=1.3, h4=1.4, body=1.6, small=1.5, caption=1.5
소수점 3자리까지만 표시.

## 출력 형식

1. 마크다운 테이블: 단계 | 이름 | px | rem | 행간
2. CSS Custom Properties 코드블록 (--font-size-display 형식)
3. SCSS 변수 코드블록 ($font-size-display 형식)

vault에 design-tokens/ 폴더가 있으면 저장 여부를 물어봐줘.`,
  },
  {
    key: 'gradient',
    name: 'gradient',
    description: '자연어로 CSS 그라디언트 생성 + 레시피북 자동 저장',
    category: '디자이너',
    argumentHint: '[분위기/색상 설명]',
    allowedTools: ['Read', 'Write'],
    content: `$ARGUMENTS

## 동작 모드

생성 모드 (인수가 있을 때):
1. 자연어 설명에서 분위기·색조·방향 파악
2. 어울리는 색상 2~4개 선택 (Hex 형식)
3. CSS 코드 생성 (linear-gradient, radial-gradient, conic-gradient 중 적합한 것)
4. 한국어로 감성적인 이름 짓기
5. gradients/recipe-book.md에 항목 추가 (파일 없으면 생성 후 추가)
6. 저장 여부 묻지 않고 자동 저장

조회 모드 ("레시피북", "목록", "보여줘" 등의 키워드 포함 시):
- gradients/recipe-book.md 읽어서 목록 출력

## 레시피북 파일 초기 내용 (파일 없을 때)

파일 없으면 다음 헤더로 생성: "# 🎨 그라디언트 레시피북"

## 각 항목 추가 형식

항목 번호와 이름을 H2 제목으로, 이어서 CSS 코드블록, 키워드 줄(**키워드:** #태그), 추가일 줄(**추가일:** YYYY-MM-DD), 그리고 구분선(---)을 추가해줘.

## 분위기 → 색상 예시

- 새벽 하늘: 딥네이비 → 미드나잇 퍼플 → 차콜
- 봄 벚꽃: 연핑크 → 피치 → 크림
- 석양: 오렌지 → 핑크 → 라벤더
- 깊은 바다: 다크네이비 → 딥블루 → 청록`,
  },
  {
    key: 'design-retro',
    name: 'design-retro',
    description: '오늘 디자인 작업 회고 다이어리 작성 (대화형)',
    category: '디자이너',
    argumentHint: '[오늘 작업 내용 또는 빈칸]',
    allowedTools: ['Read', 'Write'],
    content: `오늘의 디자인 작업 회고를 도와줄게. $ARGUMENTS

## 진행 방식

인수가 없으면: 아래 3가지 질문을 한번에 출력하고 답변 대기.
인수가 있으면: 인수를 답변으로 간주하고 바로 회고 노트 작성.

## 질문 (한번에 출력, 따로따로 묻지 않기)

---

📝 오늘의 디자인 회고

아래 3가지에 간단히 답해줘:

1. 잘한 것 — 오늘 가장 만족스러운 디자인 결정이나 작업은?
2. 고민했던 것 — 막혔거나 아직 해결 못 한 부분이 있다면?
3. 내일 할 것 — 내일 시도해보고 싶은 것은?

(짧게 답해도 괜찮아. 생략하고 싶은 항목은 -로)

---

## 답변 받은 후 처리

1. 답변 분위기에 맞는 이모지 선택 (🎨 창의적, 🤔 고민, 🌱 성장, 💪 도전, ✨ 성취)
2. 내용과 관련된 디자인 원칙/팁/명언 1개 작성
3. retros/YYYY-MM-DD.md 파일 생성 (오늘 날짜 사용)

## 저장 파일 형식

- 제목: # [이모지] YYYY-MM-DD 디자인 회고
- 섹션: ## ✅ 잘한 것 / ## 🤔 고민했던 것 / ## 🚀 내일 할 것 / ## 💡 오늘의 인사이트
- 마지막 줄: *Claudian 회고 · YYYY-MM-DD*

저장 완료 후 wikilink 형식으로 파일 경로 안내: [[retros/YYYY-MM-DD]]

## 중복 처리

오늘 날짜의 retros/YYYY-MM-DD.md가 이미 있으면:
- 덮어쓰지 말고 기존 내용을 먼저 읽어서 보여주기
- "오늘 회고가 이미 있어. 추가로 기록할 게 있어?" 물어보기`,
  },
  {
    key: 'palette',
    name: 'palette',
    description: '이미지에서 컬러 팔레트 추출 또는 분위기로 생성 → CSS 변수/Tailwind 코드 출력',
    category: '디자이너',
    argumentHint: '[이미지 첨부 또는 분위기 설명]',
    allowedTools: ['Read', 'Write'],
    content: `컬러 팔레트를 추출하거나 생성해줘: $ARGUMENTS

## 동작 모드

이미지가 첨부된 경우:
- 비전으로 주요 색상 5~7개 추출
- 각 색상에 시맨틱 역할 부여 (Primary, Secondary, Background, Surface, Text, Accent, Border 등)

설명이 텍스트인 경우 (예: "따뜻한 가을", "미니멀 다크"):
- 분위기에 어울리는 색상 5~7개 생성
- 색상 간 대비와 조화를 고려

## 출력 형식

1. 마크다운 테이블: 역할 | 색상 미리보기 | Hex | 설명
   - 색상 미리보기는 반드시 인라인 HTML로 표현 (Obsidian은 외부 이미지 URL을 차단함):
     \`<span style="display:inline-block;width:14px;height:14px;background:#HEX;border:1px solid #00000022;border-radius:2px;vertical-align:middle;"></span>\`
   - 외부 서비스 URL (via.placeholder.com 등) 절대 사용 금지
2. CSS Custom Properties 코드블록
3. Tailwind theme.extend.colors 코드블록
4. WCAG 대비율 요약: 배경 대비 텍스트 색상이 AA 이상인지 체크

## 저장

사용자가 저장을 원하면 palettes/ 폴더에 저장.
파일명 형식: palettes/YYYY-MM-DD-키워드.md
저장 여부를 물어봐줘.`,
  },
  {
    key: 'a11y',
    name: 'a11y',
    description: 'WCAG 색상 대비율 검사 또는 스크린샷 접근성 감사',
    category: '디자이너',
    argumentHint: '[#배경색 #텍스트색 또는 이미지 첨부]',
    allowedTools: ['Read', 'Write'],
    content: `접근성 검사를 수행해줘: $ARGUMENTS

## 동작 모드

색상 두 개 입력 시 (예: "#6C5CE7 #FFFFFF"):
- WCAG 2.1 대비율 계산: (L1 + 0.05) / (L2 + 0.05)
- 상대 휘도 계산: sRGB → 선형 RGB → 가중 합산 (0.2126R + 0.7152G + 0.0722B)
- 아래 기준 모두 판정:
  | 기준 | 필요 대비율 |
  |------|------------|
  | AA 일반 텍스트 | 4.5:1 |
  | AA 큰 텍스트 (18px bold 또는 24px) | 3:1 |
  | AAA 일반 텍스트 | 7:1 |
  | AAA 큰 텍스트 | 4.5:1 |
- 미달 시 기준을 통과하는 가장 가까운 색상 제안

이미지가 첨부된 경우:
- 비전으로 UI 요소의 색상 조합 분석
- 텍스트 크기 추정하여 적용 기준 결정
- 색상만으로 정보 전달 여부, 포커스 인디케이터 등 추가 체크
- 이슈 목록을 심각도(오류/경고) 순으로 정리

## 출력 형식

단일 색상 검사: 대비율 + 판정 표
이미지 감사: 이슈 목록 + 각 이슈별 개선 방법

접근성 보고서를 vault에 저장할지 물어봐줘.`,
  },
  {
    key: 'svg',
    name: 'svg',
    description: 'SVG 최적화, 아이콘 생성, 접근성 속성 추가',
    category: '디자이너',
    argumentHint: '[SVG 붙여넣기 또는 아이콘 설명]',
    allowedTools: ['Read', 'Write'],
    content: `SVG를 처리해줘: $ARGUMENTS

## 동작 모드

SVG 코드가 입력된 경우 → 최적화:
1. 불필요한 메타데이터 제거 (Illustrator/Figma 내보내기 잔여물)
2. 사용하지 않는 속성 정리 (xmlns:xlink 등)
3. 경로 좌표 소수점 2자리로 단순화
4. 최적화 전/후 용량 비교 출력
5. 접근성 속성 추가 제안: role="img", aria-label, title 태그

설명이 텍스트인 경우 → 아이콘 생성:
1. 설명에 맞는 간단한 SVG 아이콘 코드 생성
2. 크기가 명시되면 그대로, 없으면 24x24 기본값
3. viewBox 정규화, 단일 패스로 최적화
4. 접근성 속성 포함

## 출력 형식

최적화된 SVG 코드블록 + 적용된 최적화 항목 요약

vault에 아이콘 라이브러리로 저장할지 물어봐줘.
저장 위치: icons/{이름}.svg 또는 icons/library.md에 코드블록으로 추가`,
  },

  // ── Phase 2 ─────────────────────────────────────────────────────────────────

  {
    key: 'animation',
    name: 'animation',
    description: '자연어로 CSS 애니메이션/키프레임 생성. prefers-reduced-motion 자동 포함',
    category: '디자이너',
    argumentHint: '[움직임 설명]',
    allowedTools: ['Read', 'Write'],
    content: `다음 설명을 CSS 애니메이션으로 만들어줘: $ARGUMENTS

## 규칙

1. CSS @keyframes + animation/transition 코드 생성
2. 성능: transform과 opacity만 애니메이션 (GPU 가속, 리플로우 없음)
3. 이징(easing) 선택 가이드:
   - 자연스러운 등장: ease-out
   - 강조/주의: ease-in-out
   - 탄성/튀는 효과: cubic-bezier(0.68, -0.55, 0.27, 1.55)
4. 반드시 prefers-reduced-motion 미디어 쿼리로 모션 민감 사용자 대응 포함:
   \`\`\`css
   @media (prefers-reduced-motion: reduce) {
     .element { animation: none; transition: none; }
   }
   \`\`\`
5. 여러 요소 순차 등장이면 nth-child 딜레이 패턴 사용
6. 이징 함수의 느낌을 한 줄로 설명 (예: "느리게 시작해 빠르게 끝남")
7. vault에 animations/snippets.md로 저장할지 물어봐줘`,
  },

  {
    key: 'layout',
    name: 'layout',
    description: '자연어로 반응형 CSS Grid/Flexbox 레이아웃 코드 생성',
    category: '디자이너',
    argumentHint: '[레이아웃 구조 설명]',
    allowedTools: ['Read', 'Write'],
    content: `다음 레이아웃을 반응형 CSS로 만들어줘: $ARGUMENTS

## 규칙

1. CSS Grid 또는 Flexbox 중 적합한 것 선택 (둘 다 사용 시 이유 설명)
   - Grid: 2차원 배치, 복잡한 레이아웃
   - Flexbox: 1차원 배치, 정렬 중심
2. 브레이크포인트 기본값:
   - sm: 640px (모바일 → 태블릿)
   - md: 1024px (태블릿 → 데스크톱)
   - lg: 1280px (넓은 데스크톱)
3. fluid 레이아웃에는 clamp(), min(), max() 활용
4. vault에 design-tokens/spacing.md가 있으면 간격 변수 참조
5. 가능하면 Container Queries 대안도 제시
6. HTML 구조 예시도 함께 제공 (클래스명 포함)
7. 주요 레이아웃 패턴 인식:
   - Holy Grail: 헤더/사이드바/메인/사이드바/푸터
   - Dashboard: 사이드 네비 + 메인 콘텐츠
   - Card Grid: 균등 카드 그리드
   - Split: 화면 반반 분할`,
  },

  {
    key: 'font-pair',
    name: 'font-pair',
    description: '프로젝트 분위기에 맞는 한글+영문 폰트 조합 3안 제안',
    category: '디자이너',
    argumentHint: '[프로젝트 분위기 또는 기존 폰트]',
    allowedTools: ['Read', 'Write'],
    content: `다음 프로젝트에 어울리는 폰트 페어링을 제안해줘: $ARGUMENTS

## 출력 형식

3가지 조합을 제안. 각 조합마다:
- 제목 폰트: 이름 + 특징 한 줄
- 본문 폰트: 이름 + 특징 한 줄
- 코드/모노: 이름 (선택)
- 전체 느낌: 한 줄 요약
- Google Fonts 또는 자체 호스팅 여부

## 한글 폰트 목록 (우선 고려)

| 폰트 | 느낌 | 특징 |
|------|------|------|
| Pretendard | 현대적, 중성적 | 가변 폰트, 다양한 굵기 |
| Noto Sans KR | 범용, 안정적 | Google Fonts, 폭넓은 지원 |
| Noto Serif KR | 격조, 전통 | 세리프, 신뢰감 |
| Spoqa Han Sans Neo | 부드러운 현대 | 균형 잡힌 가독성 |
| KoPubWorld Batang | 문학적, 고급 | 세리프, 장문 독서용 |
| Wanted Sans | 독특, 개성 | 기하학적, 스타트업 |

## 페어링 원칙

- 대비: Serif 제목 + Sans-Serif 본문 (또는 반대)
- 분위기 일치: 둘 다 기하학적 or 둘 다 인문주의적
- x-height 균형: 비슷한 비율이면 혼용 시 이질감 줄어듦

## 추가

vault에 design-tokens/typography.md가 있으면 참조.
선택된 폰트로 /type-scale도 생성할지 물어봐줘.`,
  },

  {
    key: 'microcopy',
    name: 'microcopy',
    description: 'UI 마이크로카피 생성: 버튼 레이블, 에러 메시지, 빈 상태, 툴팁 등',
    category: '디자이너',
    argumentHint: '[화면 또는 상황 설명]',
    allowedTools: ['Read', 'Write'],
    content: `다음 UI의 마이크로카피를 작성해줘: $ARGUMENTS

## 출력 형식

상황별 카피를 마크다운 테이블로:
| 상황 | 메시지 | 톤 | 설명 |
|------|--------|-----|------|

## UX 라이팅 원칙

1. **사용자를 탓하지 않음**: "잘못된 입력" ❌ → "이메일 주소를 다시 확인해 주세요" ✅
2. **다음 행동 안내**: 문제를 설명만 하지 말고, 해결 방법을 제시
3. **짧고 명확하게**: 모바일에서 두 줄이 넘으면 다시 줄이기
4. **브랜드 보이스 일관성**: 한 화면에서 존댓말/반말 혼용 금지
5. **긍정 프레임**: "최소 8자" ✅ 대신 "8자 이상이면 더 안전해요" ✅

## 상황별 톤 가이드

- **에러**: 공감 + 구체적 원인 + 해결 방법
- **성공**: 간결한 축하 + 다음 단계
- **빈 상태**: 가볍고 행동 유도하는 첫 경험 메시지
- **경고**: 결과를 명확히, 대안 제시
- **로딩**: 기다림이 의미 있음을 알려주는 짧은 문장

한국어 우선. 영어 병기가 필요하면 요청.
vault에 microcopy/{화면명}.md로 저장할지 물어봐줘.`,
  },

  {
    key: 'ddr',
    name: 'ddr',
    description: '디자인 결정 기록(Design Decision Record) 생성. ADR 패턴 적용',
    category: '디자이너',
    argumentHint: '[결정 내용]',
    allowedTools: ['Read', 'Write', 'Glob'],
    content: `다음 디자인 결정을 DDR 형식으로 기록해줘: $ARGUMENTS

## DDR 파일 생성 규칙

1. decision-records/ 폴더의 기존 DDR 파일을 Glob으로 스캔해 번호 자동 채번 (DDR-001, DDR-002...)
2. 파일 위치: decision-records/DDR-{번호}-{키워드}.md

## DDR 문서 구조

\`\`\`markdown
# DDR-{번호}: {결정 제목}

## 상태
결정됨 | 제안됨 | 폐기됨 — {날짜}

## 맥락
이 결정이 필요해진 배경과 제약 조건.

## 결정
무엇을 어떻게 결정했는가.

## 대안 검토
| 대안 | 장점 | 단점 | 결과 |
|------|------|------|------|
| 옵션 A | ... | ... | ❌ 기각 |
| 옵션 B | ... | ... | ✅ 채택 |

## 근거
왜 이 선택이 다른 대안보다 나은가. 참고한 연구/원칙 인용.

## 영향
이 결정이 미치는 범위 (레이아웃 변경 필요, 토큰 업데이트 등).

## 관련 DDR
- [[DDR-{관련번호}]]
\`\`\`

사용자가 정보를 충분히 주지 않으면 대안, 근거, 영향을 물어봐줘.`,
  },

  {
    key: 'theme',
    name: 'theme',
    description: '기존 팔레트/토큰 기반으로 다크/라이트 CSS 변수 세트 생성. WCAG 검증 포함',
    category: '디자이너',
    argumentHint: '[팔레트 노트 경로 또는 색상 목록]',
    allowedTools: ['Read', 'Write', 'Glob'],
    content: `다음 색상을 기반으로 다크/라이트 테마 CSS 변수를 생성해줘: $ARGUMENTS

## 동작

1. 입력이 파일 경로면 Read로 읽어서 색상 추출
2. palettes/ 또는 design-tokens/colors.md가 vault에 있으면 참조

## 색상 역할 매핑 (시맨틱 접근)

라이트 모드와 다크 모드는 단순 밝기 반전이 아님. 시맨틱 역할로 매핑:
- bg (배경): 라이트 #FFF → 다크 #121212 (순수 검정 ❌, 약간 밝은 다크 ✅)
- surface (카드/패널): 라이트 #F5F5F5 → 다크 #1E1E1E
- text-primary: 라이트 #1A1A1A → 다크 #E5E5E5 (순수 흰색 ❌, 약간 어두운 라이트 ✅)
- text-secondary: 라이트 #6B7280 → 다크 #9CA3AF
- primary (브랜드): 라이트보다 다크에서 더 밝게 (어두운 배경에서 충분한 대비)
- border: 라이트 rgba(0,0,0,0.1) → 다크 rgba(255,255,255,0.1)

## 출력 형식

\`\`\`css
:root {
  /* Light mode */
  --color-bg: ;
  --color-surface: ;
  --color-text: ;
  --color-text-secondary: ;
  --color-primary: ;
  --color-border: ;
}

[data-theme="dark"] {
  /* Dark mode overrides */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* 시스템 다크모드 자동 적용 */
  }
}
\`\`\`

## 검증

모든 텍스트/배경 조합의 WCAG 대비율 계산:
- 대비율 = (L1 + 0.05) / (L2 + 0.05), 상대 휘도 공식: 0.2126R + 0.7152G + 0.0722B
- AA 기준(4.5:1) 미달 시 가장 가까운 통과 값 제안

결과를 design-tokens/themes.css에 저장할지 물어봐줘.`,
  },

  {
    key: 'color-blind',
    name: 'color-blind',
    description: '색각이상 시뮬레이션 — 두 색상이 적록색약/청황색약에서 구분 가능한지 분석',
    category: '디자이너',
    argumentHint: '[#색상1 #색상2 또는 색상 역할 설명]',
    allowedTools: ['Read'],
    content: `색각이상 관점에서 색상 구분 가능성을 분석해줘: $ARGUMENTS

## 분석 대상 색각이상 유형

| 유형 | 인구 비율 | 특징 |
|------|----------|------|
| Protanopia (제1색맹) | 남성 1.3% | 빨간 빛에 무감각 |
| Deuteranopia (제2색맹) | 남성 1.2% | 초록 빛에 무감각 |
| Tritanopia (제3색맹) | 0.01% | 파란-노란 혼동 |
| Protanomaly (약한 제1색약) | 남성 1.3% | 빨강 감도 저하 |
| Deuteranomaly (약한 제2색약) | 남성 5% | 초록 감도 저하 |

## 시뮬레이션 방법 (수학적 근사)

각 유형에서 입력 색상이 "어떤 색으로 보이는지" 추정:
1. RGB → 상대 휘도 계산
2. 해당 색각이상 유형의 혼동축(confusion line)에 투영
3. 결과 색상의 HEX 값과 설명 제공 (예: "황갈색으로 보임")

## 출력 형식

| 유형 | 인구 비율 | 색상1 시뮬레이션 | 색상2 시뮬레이션 | 구분 가능? |
|------|----------|---------------|---------------|----------|
| 정상 | 92% | 원본 | 원본 | ✅ |
| Protanopia | 1.3% | ... | ... | ❌/⚠️/✅ |
| ...

## 결론 및 대안

- 구분 불가능한 조합이 있으면: 색상 외 보조 수단 제안 (아이콘, 패턴, 텍스트 레이블)
- 색상 수정 제안: 혼동 없이 사용 가능한 대체 색상 HEX 제시
- 실무 팁: "색상만으로 정보 전달 금지" 원칙 (WCAG 1.4.1)`,
  },

  {
    key: 'weekly-report',
    name: 'weekly-report',
    description: 'vault 스캔 기반 주간 디자인 활동 리포트 자동 생성',
    category: '디자이너',
    argumentHint: '[주차 또는 날짜 범위, 생략 시 이번 주]',
    allowedTools: ['Read', 'Write', 'Glob', 'Grep'],
    content: `이번 주 디자인 활동 리포트를 생성해줘. $ARGUMENTS

## 스캔 대상 폴더

Glob으로 최근 7일 내 수정된 파일 탐색:
- palettes/ — 생성된 팔레트
- design-tokens/ — 업데이트된 토큰
- component-docs/ — 새/수정된 컴포넌트 문서
- mood-boards/ — 생성된 무드보드
- retros/ — 일일 회고 (다음 주 계획 추출)
- decision-records/ — 이번 주 DDR
- gradients/ — 그라디언트 레시피
- icons/ — 추가된 아이콘

## 리포트 구조

파일 위치: reports/YYYY-WXX.md

\`\`\`markdown
# {년}년 {주차}주차 디자인 리포트 ({시작일} ~ {종료일})

## 📊 이번 주 활동 요약
- 생성된 팔레트: N개
- 업데이트된 토큰: N개
- 새 컴포넌트 문서: N개 (이름 목록)
- 회고 작성: N/5일
- 새 DDR: N개

## 🎨 주요 하이라이트
(이번 주 가장 중요한 디자인 결정이나 완성된 산출물)

## 📝 디자인 결정 (DDR 요약)
(decision-records/에서 이번 주 DDR 목록)

## 🔮 다음 주 계획
(retros/에서 "내일 할 것" 항목 수집하여 통합)

## 💡 주간 인사이트
(이번 주 작업에서 발견한 패턴이나 배운 점 한 문단)
\`\`\`

파일이 없거나 폴더가 비어 있으면 해당 섹션 생략 후 안내.`,
  },
];
