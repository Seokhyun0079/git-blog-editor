import type { Post } from "../type/Post";
import { getOctokit } from "./client";
import { requireConfig } from "./config";
import { decodeBase64ToUtf8 } from "./encoding";
import { deleteFile, getFile } from "./files";

function extractFilePath(url: string, branch: string): string | null {
  const escaped = branch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = url.match(new RegExp(`\\/${escaped}\\/(.+)$`));
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function extractUrlsFromContent(content: string): string[] {
  const urlSet = new Set<string>();
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    if (match[0].includes("raw.githubusercontent.com")) {
      urlSet.add(match[0]);
    }
  }
  return Array.from(urlSet);
}

async function getReferencedFilePaths(): Promise<Set<string>> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  const referencedPaths = new Set<string>();

  try {
    const response = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: "posts",
    });

    if (!Array.isArray(response.data)) {
      return referencedPaths;
    }

    const posts = await Promise.all(
      response.data
        .filter(
          (file: { path: string }) =>
            !file.path.endsWith("meta.json") && !file.path.endsWith(".gitkeep")
        )
        .map(async (file: { path: string }) => {
          try {
            const content = await octokit.rest.repos.getContent({
              owner: config.owner,
              repo: config.repo,
              path: file.path,
            });

            if ("content" in content.data) {
              return JSON.parse(
                decodeBase64ToUtf8(content.data.content)
              ) as Post;
            }
            return null;
          } catch (error) {
            console.error(`Error fetching post ${file.path}:`, error);
            return null;
          }
        })
    );

    for (const post of posts) {
      if (!post) continue;

      if (post.files) {
        for (const file of post.files) {
          const filePath = extractFilePath(file.url, config.branch);
          if (filePath) referencedPaths.add(filePath);
        }
      }

      if (post.contentFiles) {
        for (const contentFile of post.contentFiles) {
          const filePath = extractFilePath(contentFile.url, config.branch);
          if (filePath) referencedPaths.add(filePath);
        }
      }

      if (post.content) {
        const urls = extractUrlsFromContent(post.content);
        for (const url of urls) {
          const filePath = extractFilePath(url, config.branch);
          if (
            filePath &&
            (filePath.startsWith("images/") || filePath.startsWith("content/"))
          ) {
            referencedPaths.add(filePath);
          }
        }
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to collect referenced file paths: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return referencedPaths;
}

async function getAllFilesInDirectory(dirPath: string): Promise<string[]> {
  const config = requireConfig();
  const octokit = getOctokit(config);
  const files: string[] = [];

  try {
    const response = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: dirPath,
    });

    if (Array.isArray(response.data)) {
      for (const item of response.data) {
        if (item.type === "file") {
          files.push(item.path);
        } else if (item.type === "dir") {
          const subFiles = await getAllFilesInDirectory(item.path);
          files.push(...subFiles);
        }
      }
    }
  } catch (error: any) {
    if (error.status !== 404) {
      console.error(`Error getting files in directory ${dirPath}:`, error);
    }
  }

  return files;
}

export async function cleanupOrphanedFiles(): Promise<{
  deleted: string[];
  errors: Array<{ file: string; error: string }>;
}> {
  const deleted: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  const referencedPaths = await getReferencedFilePaths();
  const imageFiles = await getAllFilesInDirectory("images");
  const contentFiles = await getAllFilesInDirectory("content");
  const allActualFiles = [...imageFiles, ...contentFiles];

  if (referencedPaths.size === 0 && allActualFiles.length > 0) {
    throw new Error(
      "Referenced file paths collection returned empty set while actual files exist. Aborting cleanup to prevent accidental deletion of all files."
    );
  }

  const orphanedFiles = allActualFiles.filter(
    (filePath) => !referencedPaths.has(filePath)
  );

  for (const filePath of orphanedFiles) {
    try {
      const fileResponse = await getFile(filePath);
      await deleteFile(filePath, fileResponse.sha);
      deleted.push(filePath);
    } catch (error: any) {
      errors.push({
        file: filePath,
        error: error.message || String(error),
      });
    }
  }

  return { deleted, errors };
}
