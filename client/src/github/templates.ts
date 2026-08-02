import { getOctokit } from "./client";
import { requireConfig, type GitHubConfig } from "./config";
import { encodeUtf8ToBase64, decodeBase64ToUtf8 } from "./encoding";
import { ensureDirectory } from "./files";

const TEMPLATE_FILES = ["index.html", "post.html", "utills.js", "README.md"];

function applyTemplateEnv(content: string, config: GitHubConfig): string {
  return content
    .replace(/__GITHUB_OWNER__/g, config.owner)
    .replace(/__GITHUB_REPO__/g, config.repo);
}

async function readTemplate(filename: string): Promise<string> {
  const base = process.env.PUBLIC_URL || "";
  const resolved =
    base === "" || base === "/"
      ? `/templates/${filename}`
      : `${base.replace(/\/$/, "")}/templates/${filename}`;

  const response = await fetch(resolved);
  if (!response.ok) {
    throw new Error(`Failed to load template ${filename}: ${response.status}`);
  }
  return response.text();
}

async function createOrUpdateTemplate(
  filename: string,
  maxRetries = 3
): Promise<void> {
  const config = requireConfig();
  const octokit = getOctokit(config);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let currentSha: string | null = null;
      let needsUpdate = true;
      const templateContent = applyTemplateEnv(
        await readTemplate(filename),
        config
      );

      try {
        const response = await octokit.rest.repos.getContent({
          owner: config.owner,
          repo: config.repo,
          path: filename,
        });

        if ("content" in response.data && "sha" in response.data) {
          const currentContent = decodeBase64ToUtf8(response.data.content);
          if (currentContent === templateContent) {
            needsUpdate = false;
          } else {
            currentSha = response.data.sha;
          }
        }
      } catch (error: any) {
        if (error.status !== 404) {
          throw error;
        }
      }

      if (needsUpdate) {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: config.owner,
          repo: config.repo,
          path: filename,
          message: currentSha ? `Update ${filename}` : `Create ${filename}`,
          content: encodeUtf8ToBase64(templateContent),
          branch: config.branch,
          ...(currentSha && { sha: currentSha }),
        });
      }
      return;
    } catch (error: any) {
      if (error.status === 409 && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
}

export async function syncTemplates(): Promise<void> {
  await ensureDirectory("posts");
  await ensureDirectory("images");
  await ensureDirectory("content");

  for (const file of TEMPLATE_FILES) {
    await createOrUpdateTemplate(file);
  }
}
