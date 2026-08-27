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

> **이 섹션은 코드 실측 기준이다.** 2026.08.27 `styles.css` + `app.js` 스캔 결과, 팔레트가 문서와 일치하지 않는다. 아래 §3.0을 먼저 해결한 뒤 §3.1을 확정한다.

### 3.0 현황 — 보라가 다섯 개다

`styles.css`와 `app.js`에 실제로 살아있는 보라:

| 값 | 출처 | 사용 횟수 | 페이퍼 위 대비 |
|---|---|---|---|
| `#9B72CC` | 하드코딩 | **117회** | 3.52:1 |
| `#BCA0CE` | `--primary` 토큰 | (76회, var로) | 2.20:1 |
| `#C89FDB` | v7 문서 선언값 | 31회 | 2.11:1 |
| `#C9A8E0` | `--pass-lilac` 토큰 | 6회+ | 1.96:1 |
| `#D8BFD8` | `--primary-light` 토큰 | — | 1.61:1 |

부수 지표: **hex 색상 119종, 폰트 패밀리 16종.** `--primary` 토큰은 76회 쓰이는데 `#9B72CC`는 117회 하드코딩되어 있다 — 토큰 시스템이 사용되는 것보다 우회되는 횟수가 더 많다.

**접근성 결과 (WCAG AA, 본문 4.5:1 기준):**

- `#9B72CC` **텍스트** on 크림 `#FAF9F6` → **3.52:1 — 본문 크기 실패** (큰 텍스트만 통과)
- **흰 텍스트** on `#9B72CC` 채움 → **3.70:1 — 본문 크기 실패**
- 나머지 네 보라는 텍스트로 쓸 경우 전부 3.0:1 미만 — 큰 텍스트조차 통과 못 함

즉 앱의 주 브랜드 컬러가 **글자로 쓰든 배경으로 쓰든 본문 크기에서 AA를 통과하지 못한다.** 코드에 `color: #FFFFFF` 선언이 34곳 있어 상당수가 이 조합일 가능성이 높다.

### 3.1 결정 필요 — 보라 하나를 고른다

문서(`#C89FDB`)와 토큰(`#BCA0CE`)과 실제 코드(`#9B72CC`)가 서로 다르다. 셋 중 실제로 화면에 보이는 건 `#9B72CC`이므로, **이것을 기준으로 삼고 접근성만 보정하는 방향**을 제안한다. 색조(hue 304)는 유지하고 명도만 내린다:

| 토큰 | OKLCH | hex | 용도 | 대비 |
|---|---|---|---|---|
| `--purple-text` | `oklch(57% 0.137 304)` | `#8960B8` | 페이퍼 위 **텍스트·아이콘** | 4.52:1 ✓ |
| `--purple-fill` | `oklch(58% 0.137 304)` | `#8D64BC` | **흰 글자를 얹는** 채움 | 4.50:1 ✓ |
| `--purple` | `oklch(63% 0.137 304)` | `#9B72CC` | 큰 텍스트·보더·장식 면 | 3.52:1 (large only) |
| `--purple-soft` | `oklch(76% 0.095 315)` | `#C89FDB` | 배경 면 전용, 위에 Ink만 | — |

`--pass-lilac`, `--primary-light`, `#EDE0FF`는 위 4개로 흡수하고 제거한다.

*이 제안이 브랜드 감각과 맞지 않으면 §3.1만 교체하면 된다. 다만 "보라 다섯 개를 그대로 둔다"는 선택지는 없다.*

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

**The Fill-Not-Text Rule.** Lime, Peach, `--purple-soft`는 **배경으로만** 쓴다. 텍스트·아이콘 색으로 쓰지 않는다.

**The White-On-Purple Needs Fill Rule.** 흰 글자를 보라 위에 얹을 때는 반드시 `--purple-fill`(`#8D64BC`)을 쓴다. `#9B72CC` 위의 흰 글자는 3.70:1로 통과하지 못한다.

**The ♥ Button Is Ink-On-Soft Rule.** 플로팅 ♥ 버튼을 `--purple-soft` 채움으로 할 경우 하트는 **Ink**다 (6.29:1). 흰 하트를 쓰려면 채움을 `--purple-fill`로 바꾼다.

**The No-Pure Rule.** 순백(`#FFFFFF`)을 페이지 그라운드로 쓰지 않는다. 종이는 Paper다. (텍스트 색으로서의 흰색은 `--purple-fill` 위에서만.)

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
- **Floating ♥:** `0 4px 16px oklch(76% 0.095 315 / 0.35)` — 라벤더 계열 소프트 글로우.
- **No Default Card Shadow:** 일반 카드는 헤어라인과 배경 차이로 구분한다.

### Blur Vocabulary

블러는 이 제품의 핵심 정보 장치다. 값이 정해져 있고 임의로 바꾸지 않는다.

| 위치 | 블러 | 의미 |
|---|---|---|
| 발견 탭 북커버 | 실루엣 수준 | "표지만 보고 판단하지 말 것" |
| 세부 프로필 (매칭 전/후 동일) | **없음** | 사진·글 자유롭게 |
| 받은 ♥ 탭 | 8px (강함) | p.2+ 게이트 |
| 다시보기 탭 | 1.5px (약함) | 되살리기 가능 신호 |
| 매칭 성사 | 20px → 0, 0.8s | 유일한 "이벤트" 모션 |

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
- **Book Cover** — 대표 사진(블러) + 닉네임 + 나이·지역·성향(F/B/V) + 책등 10px 그라데이션.
- **Floating ♥** — 56px 원형, Lavender 채움, **Ink 하트**, 펄스. 우측 하단.
- **Toast** — "paged her", 1.5초 페이드아웃.
- **Filter Bottom Sheet** — 나이 레인지 슬라이더, 성향 선택, 거리 슬라이더(0~200km, 기본 200).
- **Empty / Exhausted State** — "다음 월요일에 새로운 프로필북이 도착해요" + 날짜 + 다시보기 목록.

### 프로필북 (Profile Book)

- **Photo Grid** — 3열×2행, 최대 6장. 롱프레스 삭제, 드래그 리오더.
- **Preview Carousel** — 내 프로필 미리보기.
- **Chapter Accordion** — Ch.1 나 / Ch.2 사랑 / Ch.3 관계, 각 9문항.
- **Answer Block** — Noto Serif KR, line-height 1.9.
- **대표 한 줄 Selector** — 27답변 중 1개.
- **지금 이 순간** — 무드 한 마디, 즉시 반영.
- **5축 10문항** — "나는 A vs B" 이항 선택, 중간값 없음.

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

### 공통

- **Bottom Tab Bar** — 5탭, 아이콘만 (텍스트 라벨 없음 → `aria-label` 필수).
- **Notification List** — 매칭·모임·p.M·시스템 통합.
- **p.2+ Gate** — 블러 + 언블러 티저 1개.
- **Watermark** — 각 탭 스크롤 하단 p.2 인그레이브드.

---

## 7. Do and Do Not

### Do

- Do 책 은유를 구조로 쓴다 — 새 컴포넌트마다 "이건 책의 무엇인가"를 먼저 답한다.
- Do Lime과 Peach를 면(fill)으로만 쓴다.
- Do 라벤더 텍스트·아이콘에는 Lavender Deep `#8E5DA4`를 쓴다.
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
- Do not 조회수·좋아요 수·랭킹·인기도를 노출한다.
- Do not 매칭에 폭죽·컨페티·사운드를 붙인다.
- Do not 반복 애니메이션을 추가한다 (♥ 펄스 외).
- Do not 카드 안에 카드를 중첩한다.
- Do not 재참여 유도 푸시를 늘린다.
- Do not 무료 유저의 핵심 경험(모임·매칭·채팅)을 잠근다.
