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
];
