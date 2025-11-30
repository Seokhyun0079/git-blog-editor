import { Octokit } from "octokit";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { createOrUpdateTemplate } from "./template";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Initialize templates and README on server start
export async function initializeFiles(): Promise<void> {
  try {
    console.log("Starting file initialization...");

    // Create posts directory if it doesn't exist
    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: "posts/.gitkeep",
        message: "Create posts directory",
        content: Buffer.from("").toString("base64"),
        branch: "main",
      });
      console.log("Posts directory created");
    } catch (error: any) {
      if (error.status === 422) {
        console.log("Posts directory already exists");
      }
    }

    // Create images directory if it doesn't exist
    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: "images/.gitkeep",
        message: "Create images directory",
        content: Buffer.from("").toString("base64"),
        branch: "main",
      });
      console.log("Images directory created");
    } catch (error: any) {
      if (error.status === 422) {
        console.log("Images directory already exists");
      }
    }

    // List template files
    console.log("=== Templates folder files ===");
    const templatesPath = path.join(__dirname, "..", "templates");
    const files: string[] = await fs.readdir(templatesPath);
    for (const file of files) {
      console.log(`Updating ${file}...`);
      await createOrUpdateTemplate(file);
    }
    console.log("============================");
    console.log("File initialization completed successfully");
  } catch (error) {
    console.error("Error initializing files:", error);
  }
}

