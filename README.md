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

1. 이 저장소 Settings → Pages에서 Source를 **GitHub Actions**로 설정합니다. `main` 푸시 시 `.github/workflows/deploy-pages.yml`이 에디터를 배포합니다.
2. 배포된 에디터 URL을 엽니다.
3. **Personal Access Token**, **owner**, **repo**(블로그 콘텐츠 저장소)를 입력하고 Save합니다.
   - [Fine-grained PAT](https://github.com/settings/tokens?type=beta) 권장: 해당 블로그 리포의 **Contents: Read and write**만.
4. Save 시 블로그 템플릿(`index.html`, `post.html` 등)이 콘텐츠 리포에 동기화됩니다.

로컬에서만 쓰려면:

```bash
cd client
npm install --legacy-peer-deps
npm start
```

수동 Pages 배포:

```bash
cd client
npm run deploy
```

### 보안 주의

- PAT는 이 브라우저의 localStorage에만 저장됩니다. **공유·공용 PC에서는 사용하지 마세요.**
- 토큰 권한은 블로그 리포 쓰기로 최소화하세요.

### 블로그 댓글을 쓰려면

1. 블로그 저장소 Settings → General → Features에서 **Issues** 활성화
2. [Utterances GitHub App](https://github.com/apps/utterances) 설치
3. 에디터 Settings에서 템플릿 동기화

## 기술 스택

- Frontend: React (CRA), Octokit (browser)
- Deploy: GitHub Pages
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

1. このリポジトリの Settings → Pages で Source を **GitHub Actions** に設定します。
2. デプロイされたエディター URL を開きます。
3. **PAT**・**owner**・**repo**（ブログ用リポジトリ）を入力して Save。
4. Save 時にブログ用テンプレートが同期されます。

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
