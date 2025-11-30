import { Octokit } from "octokit";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface MetaContent {
  posts: string[];
}

// Function to update meta.json
export async function updateMetaJson(newPostFile: string): Promise<void> {
  try {
    let metaContent: MetaContent;
    let currentSha: string | null = null;

    // Try to get existing meta.json
    try {
      const response = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: "posts/meta.json",
      });

      if ("content" in response.data && "sha" in response.data) {
        metaContent = JSON.parse(
          Buffer.from(response.data.content, "base64").toString()
        );
        currentSha = response.data.sha;
      } else {
        metaContent = { posts: [] };
      }
    } catch (error: any) {
      if (error.status === 404) {
        // Create new meta.json if it doesn't exist
        metaContent = { posts: [] };
      } else {
        throw error;
      }
    }

    // Add new post file to the list if it's not already there
    if (!metaContent.posts.includes(newPostFile)) {
      metaContent.posts.push(newPostFile);
    }

    // Update meta.json
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: "posts/meta.json",
      message: "Update meta.json",
      content: Buffer.from(JSON.stringify(metaContent, null, 2)).toString(
        "base64"
      ),
      branch: "main",
      ...(currentSha && { sha: currentSha }),
    });

    console.log("meta.json has been updated");
  } catch (error) {
    console.error("Error updating meta.json:", error);
    throw error;
  }
}

