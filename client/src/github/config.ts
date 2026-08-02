const STORAGE_KEY = "git-blog-editor:config";

export type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

export function getConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GitHubConfig>;
    if (!parsed.token || !parsed.owner || !parsed.repo) return null;
    return {
      token: parsed.token,
      owner: parsed.owner,
      repo: parsed.repo,
      branch: parsed.branch || "main",
    };
  } catch {
    return null;
  }
}

export function saveConfig(config: GitHubConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: config.token.trim(),
      owner: config.owner.trim(),
      repo: config.repo.trim(),
      branch: (config.branch || "main").trim(),
    })
  );
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasConfig(): boolean {
  return getConfig() !== null;
}

export function requireConfig(): GitHubConfig {
  const config = getConfig();
  if (!config) {
    throw new Error("GitHub settings are not configured");
  }
  return config;
}

export function rawContentBaseUrl(config: GitHubConfig = requireConfig()): string {
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}`;
}
