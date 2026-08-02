import { Octokit } from "octokit";
import { getConfig, requireConfig, type GitHubConfig } from "./config";

let cached: { key: string; octokit: Octokit } | null = null;

export function getOctokit(config: GitHubConfig = requireConfig()): Octokit {
  const key = `${config.token}:${config.owner}:${config.repo}:${config.branch}`;
  if (cached?.key === key) {
    return cached.octokit;
  }
  const octokit = new Octokit({ auth: config.token });
  cached = { key, octokit };
  return octokit;
}

export function invalidateOctokitCache(): void {
  cached = null;
}

export async function testConnection(
  config?: GitHubConfig
): Promise<{ ok: true; fullName: string } | { ok: false; error: string }> {
  try {
    const cfg = config ?? getConfig();
    if (!cfg) {
      return { ok: false, error: "Missing configuration" };
    }
    const octokit = getOctokit(cfg);
    const { data } = await octokit.rest.repos.get({
      owner: cfg.owner,
      repo: cfg.repo,
    });
    return { ok: true, fullName: data.full_name };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || String(error),
    };
  }
}
