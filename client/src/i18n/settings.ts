export type Locale = "ko" | "en" | "ja";

export type SettingsCopy = {
  title: string;
  whatIsThis: string;
  howItWorksTitle: string;
  howItWorksBody: string;
  privacyTitle: string;
  privacyBody: string;
  warning: string;
  tokenLabel: string;
  tokenHelp: string;
  tokenLink: string;
  ownerLabel: string;
  ownerPlaceholder: string;
  repoLabel: string;
  repoPlaceholder: string;
  branchLabel: string;
  branchPlaceholder: string;
  testConnection: string;
  syncTemplates: string;
  saveContinue: string;
  cancel: string;
  connectedTo: (fullName: string) => string;
  connectionFailed: string;
  requiredFields: string;
  saveSuccess: string;
  saveFailed: string;
  syncSuccess: string;
  syncFailed: string;
  stepsTitle: string;
  steps: string[];
};

const COPY: Record<Locale, SettingsCopy> = {
  ko: {
    title: "GitHub Blog Editor 설정",
    whatIsThis:
      "이 페이지는 본인 GitHub 저장소에 블로그 글을 올리기 위한 설정 화면입니다. 서버에 로그인하는 서비스가 아니며, 토큰은 GitHub 공식 API 호출에만 사용됩니다.",
    howItWorksTitle: "동작 방식",
    howItWorksBody:
      "에디터는 브라우저에서만 동작합니다. 입력한 Personal Access Token(PAT)으로 지정한 블로그 저장소에 글·이미지 파일을 직접 커밋합니다. 별도 백엔드 서버로 토큰을 보내지 않습니다.",
    privacyTitle: "토큰은 어디에 저장되나요?",
    privacyBody:
      "이 브라우저의 localStorage에만 저장됩니다. GitHub이나 이 프로젝트 서버로 전송되지 않습니다. 공용 PC·다른 사람과 공유하는 브라우저에서는 사용하지 마세요.",
    warning:
      "PAT는 저장소 쓰기 권한과 같습니다. fine-grained 토큰으로 블로그 리포의 Contents 읽기/쓰기만 허용하는 것을 권장합니다.",
    tokenLabel: "Personal Access Token",
    tokenHelp: "GitHub에서 fine-grained PAT를 발급하세요 (Contents: Read and write).",
    tokenLink: "fine-grained PAT 만들기",
    ownerLabel: "Owner (GitHub 사용자/조직)",
    ownerPlaceholder: "your-github-username",
    repoLabel: "Repository (블로그 저장소 이름)",
    repoPlaceholder: "git_blog",
    branchLabel: "Branch",
    branchPlaceholder: "main",
    testConnection: "연결 테스트",
    syncTemplates: "템플릿 동기화",
    saveContinue: "저장 후 계속",
    cancel: "취소",
    connectedTo: (fullName) => `${fullName} 에 연결됨`,
    connectionFailed: "연결 실패",
    requiredFields: "토큰, owner, repo는 필수입니다",
    saveSuccess: "설정이 저장되었고 템플릿이 동기화되었습니다",
    saveFailed: "설정 저장에 실패했습니다",
    syncSuccess: "템플릿이 동기화되었습니다",
    syncFailed: "템플릿 동기화에 실패했습니다",
    stepsTitle: "설정 순서",
    steps: [
      "블로그로 쓸 GitHub 저장소를 준비합니다 (예: username/git_blog).",
      "fine-grained PAT를 만들고 해당 저장소 Contents 쓰기 권한만 줍니다.",
      "아래 칸에 토큰·owner·repo를 입력한 뒤 연결 테스트 → 저장합니다.",
    ],
  },
  en: {
    title: "GitHub Blog Editor settings",
    whatIsThis:
      "This screen configures publishing posts to your own GitHub repository. It is not a third-party login service—the token is used only to call the official GitHub API from your browser.",
    howItWorksTitle: "How it works",
    howItWorksBody:
      "The editor runs entirely in the browser. Your Personal Access Token (PAT) commits posts and media directly to the blog repository you specify. No backend server receives your token.",
    privacyTitle: "Where is the token stored?",
    privacyBody:
      "Only in this browser’s localStorage. It is not sent to GitHub beyond API calls you trigger, and not to any project server. Do not use a shared or public computer.",
    warning:
      "A PAT is equivalent to write access. Prefer a fine-grained token limited to Contents read/write on your blog repo only.",
    tokenLabel: "Personal Access Token",
    tokenHelp:
      "Create a fine-grained PAT on GitHub (Contents: Read and write for the blog repo).",
    tokenLink: "Create a fine-grained PAT",
    ownerLabel: "Owner (GitHub user/org)",
    ownerPlaceholder: "your-github-username",
    repoLabel: "Repository (blog repo name)",
    repoPlaceholder: "git_blog",
    branchLabel: "Branch",
    branchPlaceholder: "main",
    testConnection: "Test connection",
    syncTemplates: "Sync templates",
    saveContinue: "Save & continue",
    cancel: "Cancel",
    connectedTo: (fullName) => `Connected to ${fullName}`,
    connectionFailed: "Connection failed",
    requiredFields: "Token, owner, and repo are required",
    saveSuccess: "Settings saved and templates synced",
    saveFailed: "Failed to save settings",
    syncSuccess: "Templates synced",
    syncFailed: "Template sync failed",
    stepsTitle: "Setup steps",
    steps: [
      "Prepare the GitHub repo you use as a blog (e.g. username/git_blog).",
      "Create a fine-grained PAT with Contents write on that repo only.",
      "Enter token, owner, and repo below, then Test connection → Save.",
    ],
  },
  ja: {
    title: "GitHub Blog Editor 設定",
    whatIsThis:
      "この画面は、ご自身の GitHub リポジトリへブログ記事を投稿するための設定です。第三者へのログインではなく、トークンは公式 GitHub API の呼び出しにのみ使われます。",
    howItWorksTitle: "仕組み",
    howItWorksBody:
      "エディターはブラウザだけで動作します。入力した Personal Access Token (PAT) で、指定したブログ用リポジトリへ記事・画像を直接コミットします。バックエンドサーバーにトークンは送りません。",
    privacyTitle: "トークンはどこに保存されますか？",
    privacyBody:
      "このブラウザの localStorage のみです。GitHub API 以外や本プロジェクトのサーバーには送信しません。共有・公共の PC では使わないでください。",
    warning:
      "PAT はリポジトリ書き込み権限と同等です。fine-grained トークンでブログ用リポの Contents 読み書きのみに限定することを推奨します。",
    tokenLabel: "Personal Access Token",
    tokenHelp:
      "GitHub で fine-grained PAT を発行してください（Contents: Read and write）。",
    tokenLink: "fine-grained PAT を作成",
    ownerLabel: "Owner（GitHub ユーザー/組織）",
    ownerPlaceholder: "your-github-username",
    repoLabel: "Repository（ブログ用リポジトリ名）",
    repoPlaceholder: "git_blog",
    branchLabel: "Branch",
    branchPlaceholder: "main",
    testConnection: "接続テスト",
    syncTemplates: "テンプレート同期",
    saveContinue: "保存して続行",
    cancel: "キャンセル",
    connectedTo: (fullName) => `${fullName} に接続しました`,
    connectionFailed: "接続に失敗しました",
    requiredFields: "トークン・owner・repo は必須です",
    saveSuccess: "設定を保存し、テンプレートを同期しました",
    saveFailed: "設定の保存に失敗しました",
    syncSuccess: "テンプレートを同期しました",
    syncFailed: "テンプレート同期に失敗しました",
    stepsTitle: "設定手順",
    steps: [
      "ブログ用の GitHub リポジトリを用意します（例: username/git_blog）。",
      "そのリポのみ Contents 書き込みの fine-grained PAT を作成します。",
      "下の欄にトークン・owner・repo を入れ、接続テスト → 保存します。",
    ],
  },
};

/** Resolve UI locale from the browser language settings (ko / ja / en). */
export function detectLocale(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    : ["en"]
): Locale {
  for (const raw of languages) {
    const code = (raw || "").toLowerCase();
    if (code.startsWith("ko")) return "ko";
    if (code.startsWith("ja")) return "ja";
    if (code.startsWith("en")) return "en";
  }
  return "en";
}

export function getSettingsCopy(locale: Locale = detectLocale()): SettingsCopy {
  return COPY[locale];
}
