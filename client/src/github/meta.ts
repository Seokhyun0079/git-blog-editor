import { getOctokit } from "./client";
import { requireConfig } from "./config";
import { encodeUtf8ToBase64, decodeBase64ToUtf8 } from "./encoding";

type MetaContent = {
  posts: string[];
};

export async function updateMetaJson(newPostFile: string): Promise<void> {
  const config = requireConfig();
  const octokit = getOctokit(config);

  let metaContent: MetaContent;
  let currentSha: string | null = null;

  try {
    const response = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: "posts/meta.json",
    });

    if ("content" in response.data && "sha" in response.data) {
      metaContent = JSON.parse(decodeBase64ToUtf8(response.data.content));
      currentSha = response.data.sha;
    } else {
      metaContent = { posts: [] };
    }
  } catch (error: any) {
    if (error.status === 404) {
      metaContent = { posts: [] };
    } else {
      throw error;
    }
  }

  if (!metaContent.posts.includes(newPostFile)) {
    metaContent.posts.push(newPostFile);
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: "posts/meta.json",
    message: "Update meta.json",
    content: encodeUtf8ToBase64(JSON.stringify(metaContent, null, 2)),
    branch: config.branch,
    ...(currentSha && { sha: currentSha }),
  });
}
