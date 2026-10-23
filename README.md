# portfolio

Astro 정적 사이트. 콘텐츠는 전부 마크다운/JSON, 빌드 결과는 `dist/`의 순수 HTML.

## 로컬 실행

Node 22.23.4 이상 필요 (`.nvmrc`는 24).

```bash
npm install
npm run dev      # http://localhost:4321 — draft 글도 보임
npm run build    # dist/ 생성 — draft 글은 빠짐
npm run preview  # 빌드 결과 확인
```

## 먼저 고칠 곳

| 파일 | 할 일 |
|---|---|
| `src/site.ts` | 이메일, PGP, CV 경로. 빈 문자열이면 해당 링크가 안 보임 |
| `astro.config.mjs` | `site`를 실제 도메인으로 |
| `public/.well-known/security.txt` | Contact, Canonical, Encryption |
| `src/pages/about.astro` | 초안이니 첫 두 문단은 네 말로 다시 쓰기 |
| `src/data/research.json` | 연도·요약 확인, 공개 가능한 건만 추가 |

## 콘텐츠 추가

파일 이름이 URL이 됨 (`src/content/ctf/heap-notes.md` → `/ctf/heap-notes/`).
필드 목록과 설명은 `src/content.config.ts` 스키마 주석에 있음. `draft: true`면 개발 서버에서만 보이고 배포엔 안 나감.

- **CTF 문제** `src/content/ctf/*.md`
  - 핸드아웃 파일은 `public/ctf/<slug>/`에 넣고 frontmatter `handouts`에 경로 기입
  - `writeup: open | folded | hidden` — 기본 `folded` (클릭해서 펼침)
  - 플래그 들어간 파일·서버 소스는 올리기 전에 확인
- **연구** `src/data/research.json` — `kind`: `Disclosure` / `1-day reproduction` / `Analysis`
- **프로젝트** `src/content/projects/*.md` — `order` 작을수록 위. 사진은 `public/projects/<slug>/cover.jpg`(4:3)에 넣고 `cover:`·`coverAlt:` 기입
- **랜딩 Recent work 슬라이더** `src/site.ts`의 `RECENT` — 프로젝트·블로그 파일 이름을 순서대로
- **블로그** `src/content/blog/*.md` — Velog 글 번역본이면 `canonical:`에 원문 URL

## 배포 (GitHub Pages)

1. GitHub에 레포 만들고 push (`main` 브랜치)
2. 레포 Settings → Pages → Source: **GitHub Actions**
3. push할 때마다 `.github/workflows/deploy.yml`이 빌드·배포

도메인 없이 `https://<user>.github.io/<repo>/`로 쓸 거면 `astro.config.mjs`에 `base: '/<repo>'` 추가.
레포 이름을 `<user>.github.io`로 하면 base 필요 없음.

## 커스텀 도메인 연결

1. `public/CNAME` 파일에 도메인 한 줄 (`example.com`)
2. DNS (Cloudflare 등):
   - apex(`example.com`): A 레코드 4개 → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www`: CNAME → `<user>.github.io`
   - Cloudflare면 GitHub 인증서 발급될 때까지 프록시(주황 구름) 끄기
3. Settings → Pages → Custom domain 입력, **Enforce HTTPS** 체크
4. `astro.config.mjs`의 `site`, `security.txt`의 Canonical 수정

Cloudflare Pages로 갈 거면 워크플로 대신 Cloudflare 대시보드에서 레포 연결:
build command `npm run build`, output `dist`, 환경변수 `NODE_VERSION=24`.

## 구조

```
src/
  site.ts              이름, 링크, 네비게이션
  content.config.ts    콘텐츠 스키마 (frontmatter 검증)
  content/{blog,ctf,projects}/
  data/research.json
  pages/               라우트
  components/          ResearchList, EntryList, Abyss (랜딩 심해 배경 캔버스)
  scripts/abyss.ts     심해 배경 + Huntail 장어 애니메이션 엔진 (의존성 없음)
  layouts/Base.astro   헤더/푸터/메타 + 배경. 섹션별 수심은 site.ts NAV의 depth
  styles/global.css    색·타입 토큰 (심해 팔레트 단일, 라이트 모드 없음)
public/                그대로 복사되는 정적 파일
```
