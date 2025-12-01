import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { Octokit } from "octokit";
import dotenv from "dotenv";
import { FILE_STATUS, MediaFile, PostFile } from "../type/File";
import {
  deleteFile,
  createOrUpdateFile,
  getContent,
  createImageFile,
  createContentFile,
  deleteFiles,
} from "../git-utils";
import { PostData } from "../type/Post";
import {
  convertToPostCreateReq,
  convertToPostUpdateReq,
} from "../type/TypeConverter";
import { updateMetaJson } from "../utils/meta";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const router = Router();

// Create Octokit instance for GitHub authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 2,
    fieldSize: 1024 * 1024 * 1024 * 2,
  },
});

// Delete post endpoint
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get meta.json
    const metaContent = await getContent("posts/meta.json");
    // Get post file
    const postContent = await getContent(`posts/${id}.json`);

    // Delete attached files
    if (postContent.content.files && postContent.content.files.length > 0) {
      await deleteFiles(postContent.content.files);
    }

    // Delete post file
    await deleteFile(`posts/${id}.json`, postContent.sha);
    metaContent.content.posts = metaContent.content.posts.filter(
      (post: string) => post !== `${id}.json`
    );
    // Update meta.json
    await createOrUpdateFile(
      "posts/meta.json",
      metaContent.content,
      "Update meta.json",
      metaContent.sha
    );

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create blog post endpoint
router.post("/", upload.array("files"), async (req: Request, res: Response) => {
  try {
    const { title, content, files, contentFiles } = convertToPostCreateReq(req);
    let replacedContent = content;
    const postId = uuidv4();
    const filename = `${postId}.json`;

    // Upload contentFiles (UUID-based media) to GitHub
    const uploadedContentFiles: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
    }> = [];

    for (const file of contentFiles) {
      // Extract actual base64 part if data is in data:image/... format
      let base64Content = file.url;
      if (base64Content && base64Content.includes(",")) {
        base64Content = base64Content.split(",")[1];
      }

      if (!base64Content) {
        continue;
      }

      const contentFilePath = `content/${file.name}`;
      await createContentFile(contentFilePath, file.id, base64Content);
      uploadedContentFiles.push({
        id: file.id,
        name: file.name,
        url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${contentFilePath}`,
        type: file.type, // Preserve file type
      });
      replacedContent = replacedContent.replaceAll(
        file.id,
        `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${contentFilePath}`
      );
    }

    // Upload regular attached files to GitHub
    const uploadedFiles: Array<PostFile> = [];

    for (const file of files) {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const imagePath = `images/${fileId}${fileExtension}`;
      await createImageFile(imagePath, fileId, file);
      uploadedFiles.push({
        id: fileId,
        name: `${fileId}${fileExtension}`,
        url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${imagePath}`,
      });
    }

    // Create post data
    const postData: PostData = {
      id: postId,
      title,
      content: replacedContent,
      createdAt: new Date().toISOString(),
      files: uploadedFiles,
      contentFiles: uploadedContentFiles, // UUID-based media files
    };

    // Create post file
    await createOrUpdateFile(
      `posts/${filename}`,
      postData,
      `Create post: ${title}`,
      null
    );

    // Update meta.json
    await updateMetaJson(filename);
    res.json({ success: true, filename, postId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get blog posts endpoint
router.get("/", async (req: Request, res: Response) => {
  try {
    const response = await octokit.rest.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: "posts",
    });

    if (!Array.isArray(response.data)) {
      return res.json({ success: true, data: [] });
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

            // GitHub API returns content field, but it may be empty for files > 1MB
            // In that case, we need to use download_url instead
            const fileSize = (content.data as any).size;
            const hasContent = "content" in content.data;
            const base64Content = hasContent
              ? (content.data as any).content
              : null;
            const downloadUrl = (content.data as any).download_url;

            // If content is empty or missing, try download_url (for large files > 1MB)
            if (
              !hasContent ||
              !base64Content ||
              base64Content.trim().length === 0
            ) {
              if (downloadUrl) {
                try {
                  const downloadResponse = await fetch(downloadUrl);
                  if (!downloadResponse.ok) {
                    return null;
                  }
                  const textContent = await downloadResponse.text();
                  if (!textContent || textContent.trim().length === 0) {
                    return null;
                  }
                  const parsed = JSON.parse(textContent);
                  if (parsed === null || typeof parsed !== "object") {
                    return null;
                  }
                  return parsed;
                } catch (downloadError) {
                  return null;
                }
              } else {
                return null;
              }
            }

            // Decode base64 content for smaller files
            const decodedContent = Buffer.from(
              base64Content,
              "base64"
            ).toString();

            // Check if decoded content is empty
            if (!decodedContent || decodedContent.trim().length === 0) {
              return null;
            }

            try {
              const parsed = JSON.parse(decodedContent);
              // Validate that parsed result is an object (not null, not primitive)
              if (parsed === null || typeof parsed !== "object") {
                return null;
              }
              return parsed;
            } catch (parseError) {
              return null;
            }
          } catch (error) {
            return null;
          }
        })
    );

    // Filter out any null values from failed post fetches
    const validPosts = posts.filter((post) => post !== null);

    res.json({ success: true, data: validPosts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update blog post endpoint
router.put(
  "/:id",
  upload.array("files"),
  async (req: Request, res: Response) => {
    try {
      const { id, title, content, files, contentFiles, filesToDelete } =
        convertToPostUpdateReq(req);
      // Get post file
      const postContent = await getContent(`posts/${id}.json`);

      // Compare existing files with new files
      const existingFiles = postContent.content.files || [];

      // Compare existing contentFiles with new contentFiles
      const existingContentFiles = postContent.content.contentFiles || [];

      // Find contentFiles to delete (exist in GitHub but not in new contentFiles)
      const contentFilesToDelete = existingContentFiles.filter(
        (existingFile: MediaFile) =>
          !contentFiles.some(
            (newFile: MediaFile) => newFile.id === existingFile.id
          )
      );

      // Delete contentFiles that are no longer needed
      await deleteFiles(contentFilesToDelete);
      // Delete files that are no longer needed
      await deleteFiles(filesToDelete);

      // Upload new contentFiles (UUID-based media)
      const uploadedContentFiles: Array<MediaFile> = [];

      let replacedContent = content;
      for (const file of contentFiles) {
        // Handle case when file.name is missing
        if (!file.name) {
          continue;
        }

        // Extract actual base64 part if data is in data:image/... format
        let base64Content = file.url;
        if (base64Content && base64Content.includes(",")) {
          base64Content = base64Content.split(",")[1];
        }

        if (!base64Content || file.status === FILE_STATUS.UPLOADED) {
          continue;
        }

        const contentFilePath = `content/${file.name}`;
        await createContentFile(contentFilePath, file.id, base64Content);
        uploadedContentFiles.push({
          id: file.id,
          name: file.name,
          url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${contentFilePath}`,
          type: file.type, // Preserve file type
          status: file.status,
        });
        //TODO: Refactor this to use a more efficient method
        replacedContent = replacedContent.replaceAll(
          file.id,
          `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${contentFilePath}`
        );
      }

      // Upload new files
      const uploadedFiles: Array<{
        id: string;
        name: string;
        url: string;
      }> = [];

      for (const file of files) {
        const fileId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const imagePath = `images/${fileId}${fileExtension}`;
        await createImageFile(imagePath, fileId, file);
        uploadedFiles.push({
          id: fileId,
          name: `${fileId}${fileExtension}`,
          url: `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${imagePath}`,
        });
      }

      // Combine existing files that weren't deleted with new files
      const finalFiles = [...existingFiles, ...uploadedFiles];

      // Combine existing contentFiles that weren't deleted with new contentFiles
      const finalContentFiles = [
        ...existingContentFiles.filter((existingFile: any) =>
          contentFiles.some(
            (newFile: any) => newFile.uuid === existingFile.uuid
          )
        ),
        ...uploadedContentFiles,
      ];

      // Update post data
      const updatedPostData: PostData = {
        ...postContent.content,
        title,
        content: replacedContent,
        updatedAt: new Date().toISOString(),
        files: finalFiles,
        contentFiles: finalContentFiles, // UUID-based media files
      };

      // Update post file
      const postResponse = await getContent(`posts/${id}.json`);
      await createOrUpdateFile(
        `posts/${id}.json`,
        updatedPostData,
        `Update post: ${title}`,
        postResponse.sha
      );

      res.json({ success: true, message: "Post updated successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
