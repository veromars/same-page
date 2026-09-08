# Design System: p.2

> Source: p.2 Design Philosophy & Product Definition v7.1 (2026.08.07)
> 이 문서는 impeccable 명령이 읽는 디자인 컨텍스트다. 값이 코드와 어긋나면 코드가 아니라 이 문서를 먼저 고친다.

## 1. Overview: The Book

**Creative North Star: "책(冊)"**

p.2는 앱이 아니라 책이다. 사용자는 독자이자 저자이고, 만남은 같은 책을 읽는 것에서 시작된다. 인터페이스는 종이 위의 편집물처럼 동작한다 — 따뜻한 페이퍼 그라운드, 잉크 텍스트, 형광펜과 밑줄, 그리고 책등(spine)으로 개별 유저를 식별한다.

이 은유는 장식이 아니라 구조다. 새 컴포넌트를 만들 때 첫 질문은 **"이건 책의 무엇인가"**다. 답이 없으면 그 컴포넌트는 아마 필요 없다.

**Key characteristics**

- 따뜻한 페이퍼 그라운드. 순백(`#FFFFFF`)도 순흑(`#000000`)도 쓰지 않는다.
- 라일락·라벤더 중심의 저채도 팔레트. Lime과 Peach는 악센트 면(fill)으로만.
- 책등 컬러 6종이 유저 ID 해시로 고정 — 어느 화면에서나 같은 사람은 같은 색.
- 블러가 정보 위계의 핵심 장치. 장식이 아니라 규칙이다.
- 거의 평평한 표면. 깊이는 그림자가 아니라 종이 결·헤어라인·미세한 겹침에서 나온다.
- 모션은 느리고 한 번만. 반복 애니메이션은 ♥ 펄스 하나뿐.

---

## 2. The Kit

**현재 상태: 미정립 (코드베이스 연결 후 채울 것)**

p.2에는 아직 문서화된 컴포넌트 키트가 없다. impeccable을 리포에 연결한 뒤 `/impeccable document`를 실행해 실제 코드에서 이 섹션을 생성한다. 그 전까지는 아래 인벤토리(§6)가 유일한 목록이다.

키트가 생기면 지켜야 할 규칙:

**The Kit Consumption Rule.** 새 화면을 만들 때 새 클래스를 발명하기 전에 키트 프리미티브를 먼저 찾는다. 키트에 없는 반복 패턴은 페이지 CSS가 아니라 키트에 추가한다.

**The Token Rule.** 페이지 CSS에 oklch/hex 값이나 폰트 사이즈를 직접 타이핑하지 않는다. 토큰 파일에 없는 값이 필요하다면, 토큰을 추가해야 하거나 그 순간이 진짜 일회성이거나 둘 중 하나다.

---

## 3. Colors

> **정식 색 소스는 `/tokens.css` 다.** (2026-09-08 신설) 라이트/다크를 한 곳에서 선언한다. 페이지 CSS·컴포넌트·JS 에 생 hex 를 타이핑하지 않는다. 아래 표는 그 계약의 사람용 요약이다.

### 3.0 라벤더 — 결정됨 (2026-09-08)

기존에 보라가 5개 공존했고(`#9B72CC` 하드코딩 117회 + js 91회 / `#BCA0CE` `--primary` / `#C89FDB` / `#C9A8E0` / `#D8BFD8`), 전부 크림 페이퍼 위 본문 AA(4.5:1)를 통과하지 못했다. hue 304·chroma 0.137 을 고정하고 **명도로 역할을 나누는 것**으로 정리한다.

| 토큰 | hex | OKLCH | 용도 | 대비 (페이퍼 `#FAF9F6`) |
|---|---|---|---|---|
| `--accent-text` | `#8960B8` | `oklch(57% 0.137 304)` | 페이퍼 위 **글자·아이콘·링크** | 4.5:1 ✓ 본문 AA |
| `--accent-fill` | `#8D64BC` | `oklch(58% 0.136 304)` | **흰 글자를 얹는** 채움 (버튼·FAB) | 흰 글자 4.5:1 ✓ |
| `--accent-strong` | `#9B72CC` | `oklch(63% 0.137 304)` | 큰 텍스트·보더·강조 면 | 3.5:1 (큰 텍스트만) |
| `--accent-soft` | `#C89FDB` | `oklch(76% 0.095 315)` | 배경 면 전용 (위에 Ink 만) | — |

다크 대응값(`tokens.css`): `--accent-text #C9A8E0` · `--accent-fill #8D64BC`(동일) · `--accent-strong #B892D6` · `--accent-soft #483D5A`.

`--pass-lilac` · `--primary-light` · `--primary-transparent` · `#EDE0FF` 는 위로 흡수. **왜 하나로 안 되나:** 크림 페이퍼에서 읽히는 라벤더는 어둡고, 다크 종이에서 읽히는 라벤더는 밝다 — 정반대라 "역할 × 테마"로 갈린다.

### 3.1 이행 상태

- `tokens.css` — 완료. 라이트 전체 + `[data-theme="dark"]` 세트. `@media (prefers-color-scheme)` 블록은 앱 다크 정식 출시까지 주석 처리.
- 랜딩 `index.html` — 시맨틱 토큰 + 다크 완료. 인라인 미러(자립용), 값은 `tokens.css` 와 일치.
- 앱 `app/index.html` — `tokens.css` 배선 + FOUC 가드 완료. 다크 토글 UI 미출시.
- 앱 `styles.css` — **생 hex 마이그레이션 완료** (449 → 15). `:root` 는 app.js 용 별칭 4개(`--bg-color`/`--text-dark`/`--text-muted`/`--primary`)만. 남은 15개는 미디어 레이어(사진 위 흰 글자, `.book-card` 폴백 `#333`, 라이트박스 `#181617`) — 테마 무관.
  - **p.2+ 초대 봉투**: 봉투 몸통은 두 테마 모두 `--invite-purple #9B7FD4` (빛나는 오브젝트). 안쪽 카드·'공유' 버튼(`--invite-btn`: 라 딥퍼플 / 다 라벤더)·'사용됨'(`--invite-used`)만 테마 대응. **컴포넌트 자체 디자인 리프레시는 별도 태스크.**
  - **teaser 카드**: `.gradient-*` 클래스는 미사용이라 제거. 실제 배경은 `app.js` `chapColors[chapter]` 인라인 → app.js 색 마이그레이션에서.
  - `.discover-like-fab`: 미사용(♥는 `.prof-fab`로 이전). 토큰만 맞춰둠.
- `app.js` — **색 리터럴 마이그레이션 완료** (raw hex 380 → 10). 인라인 `style=` 문자열의 hex를 `var(--토큰)`으로 치환 (CSS 클래스 이관은 범위가 커서 다음 기회에). 남은 10개: 책등 6색(`SPINE_COLORS` — 유저 ID 해시, 유지), 카카오 `#FEE500` ×2, 책등 폴백 그라데이션 `#DDD`, SVG 하트 `fill="#fff"`. `color: white` ~15개는 사진/미디어 위라 유지.
  - 챕터 색(`--chap-1/2/3` + `-bg`) 신설. `chapColors` 객체 3개 → 토큰. 챕터 커버 그라데이션은 `CHAP → transparent` 로 (중간 pale·흰색 stop 제거 — 다크 자동 적응).
  - SVG `fill="var(--토큰)"` / `setAttribute('fill', 'var(...)')` 는 현행 브라우저에서 정상 resolve 확인.
- **다크 활성화 남음:** `tokens.css` `@media (prefers-color-scheme)` 주석 해제 + 앱 설정에 라이트/다크/시스템 토글. 그 시점에 전 화면 시각 QA (현재는 인증 게이트로 화면별 확인 미완).

### 3.1a 상태색 (확정 — `tokens.css`)

현행 `#4CAF50`/`#E05B5B` 는 페이퍼 위 AA 실패. **거절은 빨강으로 겁주지 않는다(§7)** — 부드러운 계열로.

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--danger` | `#9A5C5C` (4.9:1) | `#D99F9F` | 거절·취소 텍스트/아이콘 |
| `--danger-bg` / `--danger-line` | `#F5EFEF` / `#E4D4D4` | `#2C2427` / `#54474A` | 취소 배너 면·선 |
| `--danger-strong` | `#C43C36` (4.9:1) | `#E8938D` | **되돌릴 수 없는 파괴적 액션 전용** (계정 탈퇴). 이것만 또렷한 빨강 |
| `--success` | `#3E8046` (4.6:1) | `#86CE91` | 완료·확정 텍스트 |
| `--success-bg` / `--success-line` | `#EDF7ED` / `#C7E3C7` | `#1F2A20` / `#3B5540` | 확정 상태 면·선 |
| `--warning` | `#E0A030` | `#E8AC44` | 대기 상태 점 (장식) |
| `--warning-ink` | `#7A5C00` (5.9:1) | `#D9B876` | 대기 안내 텍스트 |
| `--warning-bg` / `--warning-line` | `#FFF6E3` / `#F0DCB0` | `#332C1B` / `#574B33` | 대기 상태 면·선 |
| `--warning-urgent` | `#FF9E93` | `#E88778` | '마감 임박' 코랄 채움 — 위에 `--on-bright`(잉크). 흰 글자는 코랄+AA 불가 |

### 3.2 Ground / Ink

| 이름 | OKLCH | hex | 비고 |
|---|---|---|---|
| Paper | `oklch(98% 0.004 91)` | `#FAF9F6` | 코드 현행값(`--bg-color`). v7 문서는 `#F7F4F0`. |
| Ink | `oklch(29% 0.005 355)` | `#2D2A2B` | 코드 현행값(`--text-dark`). 크림 위 13.5:1 ✓ |
| Muted | — | `#858082` | 코드 현행값 |
| Border | — | `#F0EBEF` | 코드 현행값 |

**Ink도 두 개다** — 토큰 `#2D2A2B`와 하드코딩 `#2C2C2A`(23회)가 공존한다. 육안 구분이 안 되므로 `#2D2A2B`로 통일한다.

### 3.3 Accent

| 이름 | OKLCH | hex | 역할 |
|---|---|---|---|
| Lime | `oklch(95% 0.167 120)` | `#E2FF74` | 하이라이터. **면(fill)으로만.** |
| Peach | `oklch(90% 0.057 51)` | `#FFD5BD` | 부드러운 강조 면. |
| Blush | — | `#E0A6C7` | `--secondary`. 보조 악센트. |

Ink on Lime 12.52:1 ✓ · Ink on Peach 10.33:1 ✓

### 3.4 Spine Colors

유저 ID/닉네임 해시로 고정. 어느 화면에서나 동일 유저 = 동일 색.

| # | OKLCH | hex |
|---|---|---|
| 1 | `oklch(76% 0.095 315)` | `#C89FDB` |
| 2 | `oklch(79% 0.060 139)` | `#A8C5A0` |
| 3 | `oklch(81% 0.067 42)` | `#E8B4A0` |
| 4 | `oklch(77% 0.054 255)` | `#9FB8D8` |
| 5 | `oklch(80% 0.056 72)` | `#D4B896` |
| 6 | `oklch(74% 0.062 312)` | `#B8A0C8` |

발견 탭: 너비 10px, 좌→우 그라데이션 (spineColor → transparent).
메시지 탭 썸네일: 너비 3px, solid.

### Color Rules

**The One Purple Rule.** 보라는 §3.1의 4개 토큰뿐이다. 새 보라를 hex로 타이핑하지 않는다. 지금 119종인 hex 색상 수가 늘어나면 안 된다.

**The Token Or Nothing Rule.** 색은 `var(--토큰)`으로만 쓴다. `#9B72CC`가 117회 하드코딩된 상태에서는 팔레트를 한 번에 바꾸는 것이 불가능하다 — 이것이 지금 가장 비싼 부채다.

**The Fill-Not-Text Rule.** Lime, Peach, `--accent-soft`는 **배경으로만** 쓴다. 텍스트·아이콘 색으로 쓰지 않는다.

**The White-On-Purple Needs Fill Rule.** 흰 글자를 보라 위에 얹을 때는 반드시 `--accent-fill`(`#8D64BC`)을 쓴다. `--accent-strong`(`#9B72CC`) 위의 흰 글자는 3.70:1로 통과하지 못한다.

**The ♥ Button Is Fill-With-White Rule.** 하트 쪽지 버튼(`.prof-fab`)은 `--accent-fill`(`#8D64BC`) 채움 + **흰 하트**다. (2026-09 결정 — `--accent-soft`는 다크에서 어두워져 잉크 하트가 안 보임. 소프트+잉크 조합 폐기.) 이미 보낸 상태(`[data-sent]`)만 `--accent-soft`로 채도를 낮춘다.

**The No-Pure Rule.** 순백(`#FFFFFF`)을 페이지 그라운드로 쓰지 않는다. 종이는 Paper다. (텍스트 색으로서의 흰색은 `--accent-fill` 위에서만.)

**The Highlighter Rule.** Lime은 형광펜이다 — 텍스트 조각 뒤에 깔리는 얇은 면. 버튼 채움이나 큰 블록 배경으로 쓰면 네온이 된다.

**The OKLCH-Only Rule.** 새 색은 OKLCH로 선언한다.

## 4. Typography

> **코드 실측 (2026.08.27):** `font-family` 선언에 **16종**의 폰트 패밀리가 등장한다 — Pretendard, Noto Serif KR 외에 **Poppins, Jost, Style Script, Outfit, Futura, Apple SD Gothic Neo**가 섞여 있다. 아래 두 얼굴 체계가 목표 상태이고, Poppins·Jost·Style Script는 정리 대상이다. (`philosophy.html`·`flow.html` 같은 문서용 페이지는 예외로 둬도 된다 — 앱 화면만 맞춘다.)

**본문·UI:** Pretendard, -apple-system, system-ui, sans-serif
**강조·감성 텍스트:** Noto Serif KR, serif
**숫자·메타:** Pretendard tabular-nums

두 얼굴 체계다. Pretendard가 인터페이스 전반을 맡고, Noto Serif KR은 **책의 목소리**가 필요한 곳에만 등장한다 — 프로필북 답변 본문, 대표 한 줄, 매칭 순간 카피, 챕터 타이틀.

### Hierarchy

| 역할 | 폰트 | 크기 | 굵기 | line-height |
|---|---|---|---|---|
| Display · 대표 한 줄 | Noto Serif KR | `clamp(1.5rem, 5vw, 2rem)` | 300 | 1.5 |
| Chapter title | Noto Serif KR | `1.25rem` | 400 | 1.4 |
| Screen title | Pretendard | `1.375rem` | 600 | 1.35 |
| Section head | Pretendard | `1rem` | 600 | 1.4 |
| Body (UI) | Pretendard | `0.9375rem` | 400 | 1.7 |
| **Body (프로필북 답변)** | Noto Serif KR | `1rem` | 400 | **1.9** |
| Caption · meta | Pretendard | `0.8125rem` | 400 | 1.5 |
| Label · 성향·태그 | Pretendard | `0.75rem` | 500 | 1.4 |

### Typography Rules

**The Serif Is The Author Rule.** Noto Serif KR은 **유저가 쓴 글**과 그 글을 감싸는 챕터 구조에만 쓴다. 시스템이 말하는 곳(버튼, 에러, 설정, 탭)은 전부 Pretendard다. 이 경계가 흐려지면 "독자이자 저자" 구조가 시각적으로 사라진다.

**The Korean Needs Air Rule.** 본문 line-height 1.7 이상, 프로필북 답변은 1.9. 최대 폭 32~38자. 한글은 촘촘하면 급격히 읽기 어려워진다.

**The No Tracked Hangul Rule.** 한글에 letter-spacing을 넓게 주지 않는다. 라틴 대문자 트래킹 감각을 한글에 그대로 적용하면 글자가 분해되어 보인다. 로마자 라벨(`p.2+`, `F/B/V`)에만 허용.

**The Number Is Not A Score Rule.** 숫자를 크게 쓰지 않는다. 남은 권수, 정원, 진행률은 전부 caption 크기다. 숫자가 커지는 순간 성과 지표처럼 읽힌다.

---

## 5. Elevation and Material

거의 평평하다. 깊이는 그림자가 아니라 **겹침**에서 나온다 — 북 스택의 카드가 실제로 포개진 것.

### Shadow Vocabulary

- **Book Stack:** 겹친 카드 각 층에 `0 2px 8px oklch(29% 0.004 107 / 0.06)`. 종이 한 장 두께.
- **Bottom Sheet:** `0 -8px 32px oklch(29% 0.004 107 / 0.12)`.
- **하트 쪽지 버튼 (구 Floating ♥):** `0 4px 16px oklch(76% 0.095 315 / 0.35)` — 라벤더 계열 소프트 글로우. 발견탭 카드에서 프로필 상세로 이전됐다.
- **No Default Card Shadow:** 일반 카드는 헤어라인과 배경 차이로 구분한다.

### Blur Vocabulary

블러는 이 제품의 핵심 정보 장치다. 값이 정해져 있고 임의로 바꾸지 않는다.

| 위치 | 블러 | 의미 |
|---|---|---|
| 발견 탭 북커버 | 실루엣 수준 | "표지만 보고 판단하지 말 것" |
| 세부 프로필 (매칭 전/후 동일) | **없음** | 사진·글 자유롭게 |
| 잠긴 챕터 (뷰어 락) | 8px (강함) | "내 챕터를 먼저 채우면 볼 수 있음" |
| 다시보기 탭 | 1.5px (약함) | 되살리기 가능 신호 |
| 지난 하트 아카이브 | 블러 없음 — 목록 자체가 접힘 | 개수만 표시("지난 하트 N개"), 24시간 일회성 결제로 언락 |
| 매칭 성사 | 20px → 0, 0.8s | 유일한 "이벤트" 모션 |

받은 하트 리스트의 "책 덮기(거절)" 상태는 블러가 아니라 채도·투명도로 물러난다: 행 테두리 `dashed`, 배경 투명, 아바타 `grayscale(100%)` + `opacity: 0.55`, 텍스트 `#8B8689`. 사라진 게 아니라 접어둔 상태 — 언제든 되돌릴 수 있다(기존 `closedBooks` 로직 재사용, 다시보기 탭의 덮은 책과 같은 표현).

### Material Rules

**The Blur Is Meaning Rule.** 블러 세기가 곧 의미다. 8px = 잠김, 1.5px = 흐려짐, 실루엣 = 아직 안 열림. 미학적 이유로 값을 조정하지 않는다.

**The Hairline First Rule.** 그림자를 추가하기 전에 1px 헤어라인으로 해결되는지 먼저 본다.

**The Radius Is Small Rule.** 코너 반경 12~14px 상한. 책과 카드는 각이 있다. 20px 넘는 라운드는 SaaS 위젯처럼 읽힌다.

**The One Animation Rule.** 반복 애니메이션은 ♥ 펄스 하나뿐. 나머지는 전부 트리거 시 1회. `prefers-reduced-motion`에서 펄스는 완전 정지, 전환은 즉시.

---

## 6. Components

현재 구현된 인벤토리. `/impeccable document` 실행 시 이 목록을 코드와 대조한다.

### 발견 (Discovery)

- **Book Stack** — 카드 겹침 구조. 주간 3~6권.
- **Book Cover** — 대표 사진(블러) + 닉네임 + 나이·지역·성향(F/B/V) + 책등 10px 그라데이션. **표지 단계에서는 하트를 보낼 수 없다** — Floating ♥는 프로필 상세로 이전됐다(§프로필북 "하트 쪽지 버튼" 참조).
- **Toast** — "하트를 보냈어요 ♥", 1.5초 페이드아웃.
- **Filter Bottom Sheet** — 나이 레인지 슬라이더, 성향 선택, 거리 슬라이더(0~200km, 기본 200).
- **Book Quote (카드 인용문)** — 27답변 중 하나를 **매 렌더마다 무작위로** 보여준다.

> **The Quote Rotates On Purpose Rule.** 이 무작위성은 버그가 아니라 결정이다 (Dawn, 2026.08.27 확인). 같은 사람의 카드를 다시 볼 때마다 다른 문장이 보이는 것 — 책을 아무 데나 펼치는 감각 — 이 의도된 연출이다. 자동 검토 도구는 이것을 "저자가 고른 문장이 시스템에 의해 바뀐다"고 읽고 결정론적 선택으로 고치려 하지만, **고치지 않는다.**
>
> 유저가 직접 고르는 **대표 한 줄**은 이것과 별개의 필드이며, 그쪽은 고정이다. 둘을 혼동하지 말 것.

- **Empty / Exhausted State** — "다음 월요일에 새로운 프로필북이 도착해요" + 날짜 + 다시보기 목록.

### 프로필북 (Profile Book)

- **Photo Grid** — 3열×2행, 최대 6장. 롱프레스 삭제, 드래그 리오더.
- **Preview Carousel** — 내 프로필 미리보기.
- **Chapter Accordion** — Ch.1 나 / Ch.2 사랑 / Ch.3 관계, 각 9문항.
- **Answer Block** — Noto Serif KR, line-height 1.9.
- **대표 한 줄 Selector** — 27답변 중 1개.
- **지금 이 순간** — 무드 한 마디, 즉시 반영.
- **5축 10문항** — "나는 A vs B" 이항 선택, 중간값 없음.
- **Page Heart** — 챕터 개별 페이지의 익명 ♥. 감상 표현이지 관심 신호가 아니다. 개수는 프로필 소유자 본인만 보고, 알고리즘에 반영되지 않는다.
- **하트 쪽지 버튼** — 프로필 상세페이지 전용 FAB. 56px 원형, `--accent-fill` 채움 + 흰 아이콘, **하트 + 말풍선 결합 아이콘**. 프로필북을 열람한 뒤에만 활성. 탭 시 한마디 입력 시트(선택 입력, 비워도 전송) + "하트 보내기" 전송 버튼. 이미 보낸 상대에게는 `--accent-soft` 채움(비활성). 발견탭 Floating ♥의 대체 컴포넌트.

### 모임 (Meetups)

- **Meetup Card × 3 타입** — 일반 / 커뮤니티 / 행사. 타입별 표시 필드가 다르다 (v7 §CH04 표 참조).
- **Search + Filter Row** — 검색바, 지역·카테고리 필터.
- **Capacity Progress Bar** — caption 크기.
- **Meetup Detail Tabs** — 정보 / 게시판 / 참여자.
- **Restricted Profile Popup** — 닉네임·나이·태그만, "더 알려면 매칭 필요".
- **Create Form** — 드럼롤 피커(시간·연령대), 캘린더 피커, 조건부 필드(링크는 행사·커뮤니티만).

### 메시지 · p.M

- **Match Reveal** — blur 20px → 0, 0.8s. "on the same page ♥".
- **p.M Choice Set** — 5선택지 (💜 🤝 👋 ✨ 🚫).
- **1:1 Chat** — "함께 갈 모임" 배너.
- **새로운 하트** — (구 "새로운 매치") 메시지탭 상단 가로 스크롤 카드. `unread` 상태 프로필북 하트만. 우측 하단 안읽음 점. 탭 시 상세(프로필북 + 한마디) 열람 → `read`로 전환.
- **받은 하트** — (구 "매칭된 프로필북") "전체 보기 →"로 진입하는 상태별 리스트. `unread` = 점 / `read` = 점 없음, 리스트 유지 / **책 덮기(거절)** = 테두리 `dashed` + 아바타 `grayscale(100%)` `opacity: 0.55` + 텍스트 `#8B8689`, 리스트에 남되 되돌리기 가능(§5) / `matched` = 리스트에서 제거, "대화 중"으로 이동. 정렬은 최신 수신순.
- **받은 하트 상세** — 헤더(발신자 이름·나이·거리) + 한마디 인용(`.pm-bubble`) + 프로필북 전체 + 하단 고정 액션("하트 보내기" / "책 덮기"). 덮은 상태에서는 "되돌리기"만.
- **지난 하트 아카이브** — 1개월 초과 하트. 리스트에서 접히고 "지난 하트 N개 · 1개월이 지난 하트예요" 한 줄만 표시(자물쇠 글리프, `dashed` 테두리). 탭 시 24시간 일회성 언락 시트(구독 아님, "₩2,900 · 1회"). 언락 후 24시간 동안 전체 열람·회신 가능.

### 공통

- **Bottom Tab Bar** — 5탭, 아이콘만 (텍스트 라벨 없음 → `aria-label` 필수).
- **Notification List** — 매칭·모임·p.M·시스템 통합.
- **p.2+ Gate (다시보기 되살리기)** — 지난주 프로필북 카드에 `blur(1.5px)` + "되살리기 🔒" pill + `p.2+` 배지. 탭 시 구독 바텀시트. (구 "받은 ♥ 탭의 블러 + 언블러 티저 1개"는 폐기 — 받은 하트가 라이브러리에서 빠졌다.)
- **원타임 언락 시트** — 지난 하트 아카이브 전용. p.2+ 구독과 별개의 24시간 일회성 결제. 바텀시트 패턴은 동일(`sheetUp` 0.25s), 가격 문구만 "₩2,900 · 1회 (24시간)" 단일.
- **Watermark** — 각 탭 스크롤 하단 p.2 인그레이브드.

---

## 7. Do and Do Not

### Do

- Do 책 은유를 구조로 쓴다 — 새 컴포넌트마다 "이건 책의 무엇인가"를 먼저 답한다.
- Do Lime과 Peach를 면(fill)으로만 쓴다.
- Do 라벤더 텍스트·아이콘에는 `--accent-text`(라이트 `#8960B8` / 다크 `#C9A8E0`)를 쓴다.
- Do 프로필북 답변에 Noto Serif KR과 line-height 1.9를 준다.
- Do 블러 값을 의미대로 유지한다 (8px 잠김 / 1.5px 흐려짐 / 실루엣 미개봉).
- Do 숫자를 caption 크기로 유지한다.
- Do 코너 반경을 12~14px 이하로 둔다.
- Do 어깨너머로 화면을 본 사람이 무엇을 알게 되는지 모든 화면에서 검토한다.

### Do Not

- Do not Pass 버튼, 스와이프 제스처, O/X 판단을 되살린다.
- Do not 순백·순흑을 쓴다.
- Do not 흰 하트·흰 텍스트를 라벤더 위에 올린다 (2.23:1).
- Do not Lime을 버튼 채움이나 큰 블록 배경으로 쓴다.
- Do not 한글에 넓은 letter-spacing을 준다.
- Do not 시스템 UI에 Noto Serif KR을 쓴다.
- Do not 조회수·좋아요 수·랭킹·인기도를 노출한다. (예외: 페이지 하트 개수는 프로필 소유자 본인에게만 보이는 비공개 카운트 — PRODUCT.md §매칭 구조.)
- Do not 매칭에 폭죽·컨페티·사운드를 붙인다.
- Do not 반복 애니메이션을 추가한다 (♥ 펄스 외).
- Do not 카드 안에 카드를 중첩한다.
- Do not 재참여 유도 푸시를 늘린다.
- Do not 무료 유저의 핵심 경험(모임·매칭·채팅)을 잠근다.
