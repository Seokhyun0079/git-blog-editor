import { Octokit } from "octokit";
import dotenv from "dotenv";
import path from "path";
import { UploadedFile } from "./type/File";

dotenv.config({ path: path.join(__dirname, ".env") });

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface GitHubFileResponse {
  sha: string;
  content: any;
}

export const deleteFile = async (
  filePath: string,
  sha: string
): Promise<void> => {
  await octokit.rest.repos.deleteFile({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: filePath,
    message: "Delete post",
    branch: "main",
    sha: sha,
  });
};

export const deleteFiles = async (filesToDelete: UploadedFile[]) => {
  for (const file of filesToDelete) {
    try {
      const filePath = file.url.split("/main/")[1];
      console.log("file to delete:", filePath);
      const fileResponse = await getFile(filePath);
      await deleteFile(filePath, fileResponse.sha);
      console.log("file deleted");
    } catch (error: any) {
      console.error("Error deleting file:", error);
    }
  }
};

export const createOrUpdateFile = async (
  filePath: string,
  content: any,
  message: string,
  sha: string | null
): Promise<void> => {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: filePath,
    message: message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
    branch: "main",
    ...(sha && { sha }),
  });
};

export const createImageFile = async (
  imagePath: string,
  fileId: string,
  file: Express.Multer.File
): Promise<void> => {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: imagePath,
    message: `Upload image: ${fileId}`,
    content: file.buffer.toString("base64"),
    branch: "main",
  });
};

export const createContentFile = async (
  contentFilePath: string,
  fileId: string,
  base64: string
): Promise<void> => {
  console.log(
    "createContentFile",
    contentFilePath,
    fileId,
    base64 ? "base64 data present" : "no base64 data"
  );

  if (!base64) {
    throw new Error(`No base64 content provided for file: ${fileId}`);
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: contentFilePath,
    message: `Upload content file: ${fileId}`,
    content: base64,
    branch: "main",
  });
};

export const getContent = async (
  filePath: string
): Promise<GitHubFileResponse> => {
  const response = await octokit.rest.repos.getContent({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: filePath,
  });

  // Type guard to ensure response.data has the expected structure
  if ("content" in response.data && "sha" in response.data) {
    return {
      sha: response.data.sha,
      content: JSON.parse(
        Buffer.from(response.data.content, "base64").toString("utf-8")
      ),
    };
  }

  throw new Error("Invalid response format");
};

export const getFile = async (
  filePath: string
): Promise<GitHubFileResponse> => {
  const response = await octokit.rest.repos.getContent({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    path: filePath,
  });

  // Type guard to ensure response.data has the expected structure
  if ("content" in response.data && "sha" in response.data) {
    return {
      sha: response.data.sha,
      content: Buffer.from(response.data.content, "base64").toString("utf-8"),
    };
  }

  throw new Error("Invalid response format");
};
