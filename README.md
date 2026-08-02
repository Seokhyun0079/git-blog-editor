# GitHub Blog Editor

**GitHub 저장소 하나를 블로그처럼 쓰고, 글은 브라우저 에디터로 올리는 도구**입니다.

- 별도의 서버·호스팅 계약 없이, GitHub Pages로 블로그를 공개할 수 있습니다.
- 에디터도 웹에서 바로 씁니다. 글을 저장하면 본인 저장소에 파일이 커밋됩니다.
- 토큰은 이 서비스 서버로 보내지 않고, **내 브라우저 ↔ GitHub API** 사이에서만 사용됩니다.

## 바로 열기

| | URL |
|--|--|
| **에디터 (글 쓰는 곳)** | [https://seokhyun0079.github.io/git-blog-editor/](https://seokhyun0079.github.io/git-blog-editor/) |
| **블로그 예시** | [https://seokhyun0079.github.io/git_blog/](https://seokhyun0079.github.io/git_blog/) |
| **블로그 저장소 예시** | [https://github.com/Seokhyun0079/git_blog](https://github.com/Seokhyun0079/git_blog) |

## 무엇을 할 수 있나요?

- 포스트 작성 / 수정 / 삭제
- 본문에 이미지·영상 등 미디어 첨부
- 저장소에 JSON + 정적 HTML로 블로그 구성
- (선택) Utterances로 GitHub Issues 기반 댓글

---

## 사용 방법 (공개 에디터 기준)

에디터를 **자기 블로그에 연결**하려면, 아래를 순서대로 하면 됩니다.

### 1. 블로그용 GitHub 저장소 만들기

1. GitHub에서 **새 저장소**를 만듭니다. (예: `git_blog`)
2. **Public**으로 두는 것을 권장합니다. (GitHub Pages로 무료 공개하기 쉽습니다.)
3. 기본 브랜치는 보통 `main`입니다.

> 에디터 저장소(`git-blog-editor`)와 **블로그 글이 쌓이는 저장소는 별개**입니다.  
> 글·이미지·블로그 HTML은 방금 만든 블로그용 저장소에 들어갑니다.

### 2. 블로그 저장소에 GitHub Pages 켜기

1. 블로그용 저장소 → **Settings** → **Pages**
2. Source를 **Deploy from a branch**로 두고, 브랜치 `main` / 폴더 `/ (root)` 를 선택해 저장합니다.
3. 잠시 후 블로그 주소가 생깁니다.  
   예: `https://<내아이디>.github.io/<저장소이름>/`

(에디터에서 설정을 저장하면 `index.html`, `post.html` 같은 템플릿이 이 저장소 루트에 자동으로 올라갑니다.)

### 3. Personal Access Token(PAT) 만들기

에디터가 **내 저장소에 글을 쓸 수 있도록** GitHub 토큰이 필요합니다.

1. [Fine-grained personal access token 만들기](https://github.com/settings/tokens?type=beta)
2. Repository access에서 **블로그용 저장소만** 선택
3. Permissions → **Contents: Read and write**
4. 토큰을 발급해 복사해 둡니다. (다시 볼 수 없으니 안전한 곳에 잠시 보관)

권한은 최소화하세요. 다른 저장소·불필요한 권한은 주지 않는 것이 안전합니다.

### 4. 에디터에서 연결하기

1. [에디터](https://seokhyun0079.github.io/git-blog-editor/)를 엽니다.
2. 설정 화면에 다음을 입력합니다.
   - **Personal Access Token** — 방금 만든 PAT
   - **Owner** — GitHub 아이디 (또는 조직명)
   - **Repository** — 블로그용 저장소 이름 (예: `git_blog`)
   - **Branch** — 보통 `main`
3. **연결 테스트**로 확인한 뒤 **저장 후 계속**을 누릅니다.
4. 저장 시 블로그용 템플릿이 저장소에 동기화됩니다.

화면 언어는 브라우저 언어 설정(한국어 / English / 日本語)을 따릅니다.

### 5. 글 쓰고 블로그에서 확인하기

1. 에디터에서 **New Post**로 글을 작성·저장합니다.
2. 블로그 Pages 주소로 들어가 목록·글을 확인합니다.
3. 이후에 설정 변경이 필요하면 에디터 메뉴의 **Settings**를 사용합니다.

### 6. (선택) 댓글 쓰기 — Utterances

1. 블로그용 저장소 **Settings → General → Features**에서 **Issues**를 켭니다.
2. [Utterances](https://github.com/apps/utterances)를 그 저장소에 설치합니다.
3. 에디터 Settings에서 **템플릿 동기화**를 한 번 더 실행합니다.

---

## 보안 안내

- PAT는 **내 브라우저 localStorage**에만 저장됩니다. 공용 PC에서는 쓰지 마세요.
- 이 에디터는 “남의 계정에 로그인하는 사이트”가 아니라, **본인 GitHub에 글을 올리는 도구**입니다.
- 토큰이 유출되면 해당 저장소를 수정할 수 있으니, 의심되면 GitHub에서 토큰을 즉시 폐기하세요.

---

## 개발자용

로컬 실행·구조·배포 파이프라인은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.

```bash
cd client
npm install --legacy-peer-deps
npm start
```

---

# GitHub Blog Editor

**GitHub リポジトリをブログとして使い、ブラウザのエディターから記事を投稿するツール**です。

- 別サーバーなしで GitHub Pages にブログを公開できます。
- エディターも Web でそのまま使えます。保存すると自分のリポジトリにコミットされます。
- トークンはこのサービスのサーバーには送られず、**ブラウザ ↔ GitHub API** の間だけで使われます。

## リンク

| | URL |
|--|--|
| **エディター** | [https://seokhyun0079.github.io/git-blog-editor/](https://seokhyun0079.github.io/git-blog-editor/) |
| **ブログ例** | [https://seokhyun0079.github.io/git_blog/](https://seokhyun0079.github.io/git_blog/) |
| **ブログリポジトリ例** | [https://github.com/Seokhyun0079/git_blog](https://github.com/Seokhyun0079/git_blog) |

## 使い方（公開エディター）

1. **ブログ用リポジトリを新規作成**（例: `git_blog`、Public 推奨）
2. そのリポで **Settings → Pages** → branch `main` / `/ (root)` を有効化
3. [Fine-grained PAT](https://github.com/settings/tokens?type=beta) を作成（そのリポの **Contents: Read and write** のみ）
4. [エディター](https://seokhyun0079.github.io/git-blog-editor/) を開き、PAT / owner / repo を入力して保存
5. 記事を書いて、`https://<user>.github.io/<repo>/` で確認

（任意）コメント: リポで Issues を有効化し、[Utterances](https://github.com/apps/utterances) をインストール → エディターでテンプレート同期

## セキュリティ

- PAT はこのブラウザの localStorage のみ。共有 PC では使わないでください。
- 第三者ログインではなく、自分の GitHub へ投稿するためのツールです。

開発者向けは [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。
