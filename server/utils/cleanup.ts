import { Octokit } from "octokit";
import dotenv from "dotenv";
import path from "path";
import { PostData } from "../type/Post";
import { getFile, deleteFile } from "../git-utils";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Extract file path from URL
 * Example: https://raw.githubusercontent.com/owner/repo/main/images/file.jpg -> images/file.jpg
 */
function extractFilePath(url: string): string | null {
  // Use regex to extract path after /main/
  const match = url.match(/\/main\/(.+)$/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Extract URLs from content string
 */
function extractUrlsFromContent(content: string): string[] {
  const urlSet = new Set<string>();

  // Extract all URL patterns (raw.githubusercontent.com)
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    if (match[0].includes("raw.githubusercontent.com")) {
      urlSet.add(match[0]);
    }
  }

  return Array.from(urlSet);
}

/**
 * Collect all file paths referenced from all posts
 */
async function getReferencedFilePaths(): Promise<Set<string>> {
  const referencedPaths = new Set<string>();

  try {
    // Get all posts
    const response = await octokit.rest.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: "posts",
    });

    if (!Array.isArray(response.data)) {
      return referencedPaths;
    }

    const posts = await Promise.all(
      response.data
        .filter(
          (file) =>
            !file.path.endsWith("meta.json") && !file.path.endsWith(".gitkeep")
        )
        .map(async (file) => {
          try {
            const content = await octokit.rest.repos.getContent({
              owner: process.env.GITHUB_OWNER!,
              repo: process.env.GITHUB_REPO!,
              path: file.path,
            });

            if ("content" in content.data) {
              return JSON.parse(
                Buffer.from(content.data.content, "base64").toString()
              ) as PostData;
            }
            return null;
          } catch (error) {
            console.error(`Error fetching post ${file.path}:`, error);
            return null;
          }
        })
    );

    // Collect referenced files from each post
    for (const post of posts) {
      if (!post) continue;

      // URLs from files array
      if (post.files) {
        for (const file of post.files) {
          const filePath = extractFilePath(file.url);
          if (filePath) {
            referencedPaths.add(filePath);
          }
        }
      }

      // URLs from contentFiles array
      if (post.contentFiles) {
        for (const contentFile of post.contentFiles) {
          const filePath = extractFilePath(contentFile.url);
          if (filePath) {
            referencedPaths.add(filePath);
          }
        }
      }

      // Extract URLs from content string
      if (post.content) {
        const urls = extractUrlsFromContent(post.content);
        for (const url of urls) {
          const filePath = extractFilePath(url);
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
    console.error("Error getting referenced file paths:", error);
    // Propagate error instead of returning empty set to prevent accidental deletion of all files
    throw new Error(
      `Failed to collect referenced file paths: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return referencedPaths;
}

/**
 * Get all file paths in a GitHub directory (recursively)
 */
async function getAllFilesInDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const response = await octokit.rest.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: dirPath,
    });

    if (Array.isArray(response.data)) {
      for (const item of response.data) {
        if (item.type === "file") {
          files.push(item.path);
        } else if (item.type === "dir") {
          // Recursively explore subdirectories
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

/**
 * Find and delete orphaned files
 */
export async function cleanupOrphanedFiles(): Promise<{
  deleted: string[];
  errors: Array<{ file: string; error: string }>;
}> {
  const deleted: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  try {
    console.log("Starting orphaned files cleanup...");

    // 1. Collect referenced file paths
    // This must succeed - if it fails, we cannot safely identify orphaned files
    console.log("Collecting referenced file paths...");
    const referencedPaths = await getReferencedFilePaths();
    console.log(`Found ${referencedPaths.size} referenced files`);

    // 2. Get actual file lists from GitHub
    console.log("Getting actual file lists from GitHub...");
    const imageFiles = await getAllFilesInDirectory("images");
    const contentFiles = await getAllFilesInDirectory("content");
    const allActualFiles = [...imageFiles, ...contentFiles];
    console.log(
      `Found ${allActualFiles.length} actual files (${imageFiles.length} images, ${contentFiles.length} content files)`
    );

    // 3. Find orphaned files
    // Safety check: if referencedPaths is empty but we have actual files, abort to prevent mass deletion
    if (referencedPaths.size === 0 && allActualFiles.length > 0) {
      throw new Error(
        "Referenced file paths collection returned empty set while actual files exist. Aborting cleanup to prevent accidental deletion of all files."
      );
    }

    const orphanedFiles = allActualFiles.filter(
      (filePath) => !referencedPaths.has(filePath)
    );
    console.log(`Found ${orphanedFiles.length} orphaned files`);

    // 4. Delete orphaned files
    for (const filePath of orphanedFiles) {
      try {
        console.log(`Deleting orphaned file: ${filePath}`);
        const fileResponse = await getFile(filePath);
        await deleteFile(filePath, fileResponse.sha);
        deleted.push(filePath);
      } catch (error: any) {
        console.error(`Error deleting file ${filePath}:`, error);
        errors.push({
          file: filePath,
          error: error.message || String(error),
        });
      }
    }

    console.log(
      `Cleanup completed. Deleted: ${deleted.length}, Errors: ${errors.length}`
    );
  } catch (error: any) {
    console.error("Error in cleanup process:", error);
    throw error;
  }

  return { deleted, errors };
}
