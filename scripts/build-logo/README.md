# build-logo

`p.2` 워드마크를 폰트 의존성 없는 벡터로 굳혀 `assets/logo/` 에 뿌린다.

## 무엇을 하나

- `Poppins-Black.ttf` 에서 `p`, `2` 글리프를 뽑아 SVG path 로 변환 (fontTools)
- 원본 하트 path 를 45° 기울여 합성
- 레이아웃 값(하트 위치·크기, `p`-`2` 자간)은 CSS 로 렌더한 원본 로고를
  픽셀 단위로 맞춘 상수 — `build.py` 상단 참고
- 색상 4종(purple/ink/lime/white) × SVG + PNG(128~2048), 가로형 + 정사각 여백형

## 실행

```bash
python3 -m pip install fonttools
npm i            # puppeteer 필요
NODE_PATH="$PWD/node_modules" node scripts/build-logo/gen-assets.js
```

`build.py` 단독 실행 시 stdout 으로 SVG 하나만 출력:

```bash
cd scripts/build-logo
python3 build.py '#9B72CC' > /tmp/p2.svg
# 레이아웃 미세조정: HEART_CX/HEART_CY/HEART_SQ/GAP 환경변수
HEART_CY=1000 python3 build.py currentColor
```
