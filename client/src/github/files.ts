import { getOctokit } from "./client";
import { requireConfig, rawContentBaseUrl } from "./config";
import { encodeUtf8ToBase64, decodeBase64ToUtf8, fileToBase64 } from "./encoding";
import type { UploadedFile } from "../type/File";

export type GitHubFileResponse = {
  sha: string;
  content: any;
};

export async function deleteFile(filePath: string, sha: string): Promise<void> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  await octokit.rest.repos.deleteFile({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
    message: "Delete post",
    branch: config.branch,
    sha,
  });
}

export async function deleteFiles(filesToDelete: UploadedFile[]): Promise<void> {
  for (const file of filesToDelete) {
    try {
      const filePath = file.url.split(`/${requireConfig().branch}/`)[1];
      if (!filePath) continue;
      const fileResponse = await getFile(filePath);
      await deleteFile(filePath, fileResponse.sha);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }
}

export async function createOrUpdateFile(
  filePath: string,
  content: any,
  message: string,
  sha: string | null
): Promise<void> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
    message,
    content: encodeUtf8ToBase64(JSON.stringify(content, null, 2)),
    branch: config.branch,
    ...(sha && { sha }),
  });
}

export async function createImageFile(
  imagePath: string,
  fileId: string,
  file: File
): Promise<string> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  const content = await fileToBase64(file);
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: imagePath,
    message: `Upload image: ${fileId}`,
    content,
    branch: config.branch,
  });
  return `${rawContentBaseUrl(config)}/${imagePath}`;
}

export async function createContentFile(
  contentFilePath: string,
  fileId: string,
  base64: string
): Promise<string> {
  if (!base64) {
    throw new Error(`No base64 content provided for file: ${fileId}`);
  }

  const config = requireConfig();
  const octokit = getOctokit(config);

  let existingSha: string | null = null;
  try {
    const existingFile = await getFile(contentFilePath);
    existingSha = existingFile.sha;
  } catch (error: any) {
    if (error.status !== 404) {
      throw error;
    }
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: contentFilePath,
    message: `Upload content file: ${fileId}`,
    content: base64,
    branch: config.branch,
    ...(existingSha && { sha: existingSha }),
  });

  return `${rawContentBaseUrl(config)}/${contentFilePath}`;
}

export async function getContent(filePath: string): Promise<GitHubFileResponse> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  const response = await octokit.rest.repos.getContent({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
  });

  if ("content" in response.data && "sha" in response.data) {
    return {
      sha: response.data.sha,
      content: JSON.parse(decodeBase64ToUtf8(response.data.content)),
    };
  }

  throw new Error("Invalid response format");
}

export async function getFile(filePath: string): Promise<GitHubFileResponse> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  const response = await octokit.rest.repos.getContent({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
  });

  if ("content" in response.data && "sha" in response.data) {
    return {
      sha: response.data.sha,
      content: decodeBase64ToUtf8(response.data.content),
    };
  }

  throw new Error("Invalid response format");
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  const keepPath = `${dirPath}/.gitkeep`;
  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: keepPath,
      message: `Create ${dirPath} directory`,
      content: encodeUtf8ToBase64(""),
      branch: config.branch,
    });
  } catch (error: any) {
    if (error.status !== 422) {
      throw error;
    }
  }
}
