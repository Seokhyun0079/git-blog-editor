import fs from "fs/promises";
import path from "path";
import { Octokit } from "octokit";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Function to read template files
export async function readTemplate(filename: string): Promise<string> {
  try {
    const templatePath = path.join(__dirname, "..", "templates", filename);
    return await fs.readFile(templatePath, "utf8");
  } catch (error) {
    console.error(`Error reading ${filename} template:`, error);
    throw error;
  }
}

// Function to create or update template file with retry logic
export async function createOrUpdateTemplate(
  filename: string,
  maxRetries = 3
): Promise<void> {
  // Retry logic for creating or updating template file
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let currentSha: string | null = null;
      let needsUpdate = true;
      const templateContent: string = await readTemplate(filename);

      // Check if file exists and get current SHA
      try {
        const response = await octokit.rest.repos.getContent({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          path: filename,
        });

        // Compare content if file exists
        if ("content" in response.data && "sha" in response.data) {
          const currentContent = Buffer.from(
            response.data.content,
            "base64"
          ).toString();
          if (currentContent === templateContent) {
            console.log(`${filename} is up to date`);
            needsUpdate = false;
          } else {
            console.log(`${filename} needs update`);
            currentSha = response.data.sha;
          }
        }
      } catch (error: any) {
        if (error.status === 404) {
          console.log(`${filename} does not exist. Creating new file.`);
        } else {
          throw error;
        }
      }

      // Create or update file if needed
      if (needsUpdate) {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          path: filename,
          message: currentSha ? `Update ${filename}` : `Create ${filename}`,
          content: Buffer.from(templateContent).toString("base64"),
          branch: "main",
          ...(currentSha && { sha: currentSha }),
        });
        console.log(
          currentSha
            ? `${filename} has been updated`
            : `${filename} has been created`
        );
      }

      // Exit loop on successful completion
      return;
    } catch (error: any) {
      if (error.status === 409 && attempt < maxRetries) {
        console.log(
          `${filename} SHA mismatch (attempt ${attempt}/${maxRetries}). Retrying...`
        );
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      } else {
        console.error(
          `Error checking/creating/updating ${filename} (attempt ${attempt}):`,
          error
        );
        if (attempt === maxRetries) {
          console.error(
            `Failed to update ${filename} after ${maxRetries} attempts`
          );
        }
        throw error;
      }
    }
  }
}

