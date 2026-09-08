# styles.css 다크 마이그레이션 맵

> 상태: **일시중단** (2026-09-08). 다른 세션이 `app.js` + `styles.css`("안전 — 차단·신고" 기능)를 편집 중.
> 그 변경분이 커밋되면 재개. 그동안 `tokens.css` / 랜딩만 건드림.
> 스캔 시점 raw 색상 등장 = **449회 / ~70 섹션**.

---

## 완료 ✅

공통 헤더·워터마크 · 하단 nav · splash 화면 · 발견 탭(book stack 제외 — 이미지 레이어) ·
role badge/tooltip · `.btn-primary`(AA 수정) · `.input-field` · `.fatal-error-*` · `.avatar-upload`

신규 토큰: `--accent-wash --overlay-pill --shadow-accent --nav-active --on-bright --disabled-fill`

---

## 배치 A — 기계적 치환, 라이트 변화 0 (~250회)

최근 작성된 섹션들(대략 L4600~ 한글 주석 구역: 안전 시트, 미설정 배너, 프로필 편집,
모임 호스트/신청, p.M 등)은 **이미 목표값을 하드코딩**하고 있음. 순수 find/replace:

| 현재 하드코딩 | → 토큰 | 등장 |
|---|---|---|
| `#8960B8` | `var(--accent-text)` | ~60 |
| `#8D64BC` | `var(--accent-fill)` | ~12 |
| `#9B72CC` | `var(--accent-strong)` (텍스트면 `--accent-text` 검토) | ~30 |
| `#C89FDB` | `var(--accent-soft)` (활성/아이콘이면 `--nav-active`/`--accent-text`) | ~25 |
| `#FFF` `#FFFFFF` `white` | `var(--surface)` (카드·시트) / `var(--on-accent)` (채움 위 글자) | ~55 |
| `#2D2A2B` `#2C2C2A` | `var(--ink)` | ~20 |
| `#FAF9F6` `#F7F4F0` | `var(--paper)` | ~5 |
| `#E2FF74` / `#2D2A2B`(lime 위) | `var(--lime)` / `var(--on-bright)` | ~8 |
| `#6E696B` | **새 토큰 `--muted-deep`** (아래) | ~30 |
| `rgba(137, 96, 184, .08~.14)` | `var(--accent-soft-15)` 계열 or `--accent-tint` (새) | ~15 |

`#FFF`/`#9B72CC`는 문맥 확인 필요 (채움인지 텍스트인지 / 카드bg인지 글자인지) — 완전 자동 아님.

## 배치 B — 판단 필요 (~120회)

- **회색 사다리**: `#888 #999 #aaa #bbb #ccc #DDD #EEE #F0F0F0 #F8F8F8 #E0E0E0 #EDEDED #F5F5F5 #6E696B #948F91 #8B8689 #A9A4A6 #5F5E5A #4A4547` …
  → `--ink` / `--ink-40` / `--ink-55` / `--muted` / `--muted-deep`(신규) / `--hairline` / `--border` / `--surface-2`(신규?) 로 수렴.
  각각 "on paper 대비 몇 :1 인지" 재서 매핑.
- **상태색**: `#E53935` `#E05B5B` `#FF8A80` `#9A5C5C`(거절) `#5A9C5E` `#5F8E63`(수락) `#E0A030` `#7A5C00`(대기) `#FFF6E3` `#EDF7ED`(상태 배경)
  → tokens.css `--danger` `--success` + `--warning`(신규) + 각 `-bg` 변형. §3.1a 확정 필요.
- **틴트 배경**: `#F4F0F9 #F8F0FC #F0EBF8 #F8F4FC #FAF7FF #F3F0F1 #E4DEE8 #EDEAE5 #F0EBEF` …
  → `--accent-wash` / `--wash` / `--surface-2` 로 통합.
- **p.2+ 게이트(State: Active/Used/Unused)**: `#9B7FD4 #4A3060 #1a1a1a #8A6FC4 #D8D0E8` — 자체 미니 팔레트. 다크에서 통째로 재설계 필요.

## 배치 C — 건드리지 않음 (이미지/미디어 레이어)

- `.book-card` `.book-overlay` `.book-bg-photo` `.saved-book-cover` — 블러 사진 + 어두운 오버레이 (`rgba(0,0,0,.06~.42)`), `#333` 폴백, 흰 글자. 사진 위라 테마 무관.
- 사진 라이트박스 `#181617` 배경, `rgba(255,255,255,.x)` 컨트롤.
- 대부분의 `rgba(0,0,0,.02~.15)` `box-shadow` — 그림자. 다크에서 안 보이지만 해로울 것 없음. 필요하면 `--shadow-page` 계열로 일괄.

---

## tokens.css 에 추가 예정

```
--muted-deep:  #6E696B;   /* 라벤더 계열 옆 짙은 회색 라벨. --muted(#858082)보다 어두움 */
--surface-2:   #F3F0F1;   /* 카드 안 한 단계 들어간 면 (편집 행 등) */
--accent-tint: rgba(137, 96, 184, 0.10);  /* 라벤더 아주 옅은 배경 틴트 */
--warning:     #A97B1E;   /* 대기/주의 (§3.1a 확정 시) */
--warning-bg:  #FFF6E3;
--success-bg:  #EDF7ED;
--danger-bg:   #F5EFEF;
```
(각 다크값 포함, tokens.css 3블록 동기)

---

## 재개 순서 (다른 세션 커밋 후)

1. 배치 A find/replace — `#8960B8`/`#8D64BC` 먼저 (가장 안전, 최신 화면 다크 즉시 동작)
2. `#6E696B` `#2C2C2A` `#FFF` — 문맥 훑으며
3. 회색 사다리 정리 (배치 B) — 섹션별
4. 상태색 확정 + 치환
5. p.2+ 게이트 다크 재설계
6. `app.js` 색 리터럴 (`#9B72CC` 91회 등) — CSS 클래스 이관
7. 전 화면 다크 QA → tokens.css `@media (prefers-color-scheme)` 주석 해제 → 앱에 토글 UI
