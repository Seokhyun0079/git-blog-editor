# GitHub Blog Editor

GitHub를 블로그로 활용하는 **정적** 에디터입니다. Express 서버 없이 브라우저에서 GitHub API를 호출하며, GitHub Pages에 무료로 배포할 수 있습니다.

## 데모

- 블로그 URL: [https://seokhyun0079.github.io/git_blog/](https://seokhyun0079.github.io/git_blog/)
- 블로그 리포지토리: [https://github.com/Seokhyun0079/git_blog](https://github.com/Seokhyun0079/git_blog)
- 에디터 (Pages): [https://seokhyun0079.github.io/git-blog-editor/](https://seokhyun0079.github.io/git-blog-editor/)

## 기능

- GitHub 저장소에 블로그 포스트 작성 / 수정 / 삭제
- 제목과 내용 작성, 파일·미디어 첨부
- JSON 형식으로 포스트 저장
- 블로그 글 페이지 댓글 (Utterances; GitHub Issues 기반)
- 설정 화면에서 PAT 입력 (localStorage) — 서버 불필요

## 사용 방법 (GitHub Pages)

공개 저장소 기준 Pages / Actions 사용은 **무료**입니다. Settings 하단의 “Start free 30 days”는 유료 플랜 체험 안내라서 Pages와 무관합니다. 누르지 않아도 됩니다.

### 1) Pages Source 설정

1. 이 저장소 → **Settings** → 왼쪽 **Pages**
2. **Build and deployment** → **Source**에서 **GitHub Actions** 선택
3. Jekyll / Static HTML 같은 **스타터 워크플로 선택 화면이 뜨면 만들지 말고 닫기**  
   (이미 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)이 있음)

### 2) 배포 실행

- 기본 브랜치(`main`)에 푸시하면 워크플로가 자동 실행됩니다.
- 또는 **Actions** 탭 → **Deploy editor to GitHub Pages** → **Run workflow**

성공하면 에디터 주소:

`https://seokhyun0079.github.io/git-blog-editor/`

### 3) 에디터 첫 설정

1. 위 에디터 URL을 연다.
2. **Personal Access Token**, **owner**, **repo**(블로그 콘텐츠 저장소)를 입력하고 Save.
   - [Fine-grained PAT](https://github.com/settings/tokens?type=beta) 권장: 해당 블로그 리포 **Contents: Read and write**만.
3. Save 시 블로그 템플릿(`index.html`, `post.html` 등)이 콘텐츠 리포에 동기화됩니다.

### 로컬 실행

```bash
cd client
npm install --legacy-peer-deps
npm start
```

### 수동 배포 (로컬에서 gh-pages 브랜치로)

```bash
cd client
npm run deploy
```

이 방식을 쓰면 Pages Source를 **Deploy from a branch** → `gh-pages` / `/(root)` 로 바꿔도 됩니다.

### 보안 주의

- PAT는 이 브라우저의 localStorage에만 저장됩니다. **공유·공용 PC에서는 사용하지 마세요.**
- 토큰 권한은 블로그 리포 쓰기로 최소화하세요.

### 블로그 댓글을 쓰려면

1. 블로그 저장소 Settings → General → Features에서 **Issues** 활성화
2. [Utterances GitHub App](https://github.com/apps/utterances) 설치
3. 에디터 Settings에서 템플릿 동기화

## 기술 스택

- Frontend: React (CRA), Octokit (browser)
- Deploy: GitHub Pages (Actions 또는 gh-pages 브랜치)
- Blog comments: Utterances
- Optional legacy backend: Node.js / Express (`server/`)

자세한 구조는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.

---

# GitHub Blog Editor

GitHub をブログとして活用する**静的**エディターです。Express サーバーなしでブラウザから GitHub API を呼び出し、GitHub Pages に無料デプロイできます。

## デモ

- ブログ URL: [https://seokhyun0079.github.io/git_blog/](https://seokhyun0079.github.io/git_blog/)
- ブログリポジトリ: [https://github.com/Seokhyun0079/git_blog](https://github.com/Seokhyun0079/git_blog)
- エディター (Pages): [https://seokhyun0079.github.io/git-blog-editor/](https://seokhyun0079.github.io/git-blog-editor/)

## 機能

- GitHub リポジトリへの投稿作成 / 更新 / 削除
- タイトル・本文・ファイル添付
- JSON 形式での投稿保存
- Utterances コメント（GitHub Issues）
- 設定画面で PAT を入力（localStorage）— サーバー不要

## 使い方（GitHub Pages）

公開リポジトリなら Pages / Actions は通常無料です。Settings 下部の「Start free 30 days」は有料プランの案内で、Pages には不要です。

1. **Settings → Pages → Source → GitHub Actions**
2. Jekyll / Static HTML のスターターが出たら **追加せず閉じる**（既存の `deploy-pages.yml` を使う）
3. `main` に push、または Actions から **Run workflow**
4. `https://seokhyun0079.github.io/git-blog-editor/` を開き、PAT / owner / repo を Save

ローカル:

```bash
cd client
npm install --legacy-peer-deps
npm start
```

## 技術スタック

- Frontend: React (CRA), Octokit (browser)
- Deploy: GitHub Pages
- Optional legacy: Node.js / Express (`server/`)

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。
