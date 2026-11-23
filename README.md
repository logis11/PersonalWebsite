# portfolio

Astro 정적 사이트. 메인은 블로그, 서브는 About / Projects / Writeups / Achievements.
콘텐츠는 전부 마크다운/TS 데이터, 빌드 결과는 `dist/`의 순수 HTML.

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
| `src/site.ts` | 이름, 이메일, 링크. 빈 문자열이면 해당 링크가 안 보임 |
| `astro.config.mjs` | `site`를 실제 도메인으로 |
| `public/.well-known/security.txt` | Contact, Canonical, Encryption |
| `src/pages/about.astro` | 첫 두 문단은 네 말로 다시 쓰기 |
| `src/data/achievements.ts` | 연도·문구 확인, 공개 가능한 건만 |

## 콘텐츠 추가

파일 이름이 URL이 됨 (`src/content/blog/heap-notes.md` → `/blog/heap-notes/`).
필드 목록과 설명은 `src/content.config.ts` 스키마 주석에 있음. `draft: true`면 개발 서버에서만 보이고 배포엔 안 나감.

- **블로그** `src/content/blog/*.md` — 메인 페이지(`/`)가 이 목록. 다른 곳에 먼저 올린 글이면 `canonical:`에 원문 URL
- **프로젝트** `src/content/projects/*.md` — `order` 작을수록 위. `facts:`는 제목 아래 불릿
  - 사진은 `public/projects/<slug>/`에 넣고 frontmatter `photos:`에 `{ src, alt, caption }` 기입.
    각 프로젝트 파일에 주석으로 예시가 들어있음 (주석 풀고 파일만 넣으면 됨)
- **라이트업** `src/content/writeups/*.md` — 버그 하나짜리 분석 (CVE 재현, CTF, 타겟 분해).
  `cve:` `target:` `event:` `tags:` `links:` 전부 선택. 글이 하나도 없으면 메뉴에서 자동으로 숨겨짐
- **성과** `src/data/achievements.ts` — 그룹별 배열. 새 항목은 해당 그룹 맨 위에

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
  site.ts              이름, 링크, 네비게이션 (About / Projects / Writeups / Achievements)
  content.config.ts    콘텐츠 스키마 (frontmatter 검증)
  content/{blog,projects,writeups}/
  data/achievements.ts
  pages/               / = 블로그 목록, blog/[id], about, projects, writeups, achievements, 404
  layouts/Base.astro   헤더/푸터/메타
  styles/global.css    색·타입 토큰 (라이트 단일, 장식 없음)
public/
  projects/<slug>/     프로젝트 사진
```
