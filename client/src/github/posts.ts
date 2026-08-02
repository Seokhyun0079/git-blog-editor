import { FILE_STATUS, type PostFile, type UploadedFile } from "../type/File";
import type { Post } from "../type/Post";
import { getOctokit } from "./client";
import { requireConfig } from "./config";
import { stripDataUrlPrefix, decodeBase64ToUtf8 } from "./encoding";
import {
  createContentFile,
  createImageFile,
  createOrUpdateFile,
  deleteFile,
  deleteFiles,
  getContent,
} from "./files";
import { updateMetaJson } from "./meta";

export type ContentFileInput = {
  id: string;
  name: string;
  url: string;
  type: string;
  status?: string;
};

export type CreatePostInput = {
  title: string;
  content: string;
  files: File[];
  contentFiles: ContentFileInput[];
};

export type UpdatePostInput = {
  id: string;
  title: string;
  content: string;
  files: File[];
  contentFiles: ContentFileInput[];
  filesToDelete: UploadedFile[];
};

export type PostMutationResult = {
  success: true;
  filename?: string;
  postId?: string;
  message?: string;
  uploadedContentFiles: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    status?: string;
  }>;
};

function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
}

export async function listPosts(): Promise<{ success: true; data: Post[] }> {
  const config = requireConfig();
  const octokit = getOctokit(config);

  try {
    const response = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: "posts",
    });

    if (!Array.isArray(response.data)) {
      return { success: true, data: [] };
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

            const hasContent = "content" in content.data;
            const base64Content = hasContent
              ? (content.data as any).content
              : null;
            const downloadUrl = (content.data as any).download_url;

            if (
              !hasContent ||
              !base64Content ||
              base64Content.trim().length === 0
            ) {
              if (!downloadUrl) return null;
              const downloadResponse = await fetch(downloadUrl);
              if (!downloadResponse.ok) return null;
              const textContent = await downloadResponse.text();
              if (!textContent || textContent.trim().length === 0) return null;
              const parsed = JSON.parse(textContent);
              if (parsed === null || typeof parsed !== "object") return null;
              return parsed as Post;
            }

            const decodedContent = decodeBase64ToUtf8(base64Content);
            if (!decodedContent || decodedContent.trim().length === 0) {
              return null;
            }
            const parsed = JSON.parse(decodedContent);
            if (parsed === null || typeof parsed !== "object") return null;
            return parsed as Post;
          } catch {
            return null;
          }
        })
    );

    return {
      success: true,
      data: posts.filter((post: Post | null): post is Post => post !== null),
    };
  } catch (error: any) {
    if (error.status === 404) {
      return { success: true, data: [] };
    }
    throw error;
  }
}

export async function createPost(
  input: CreatePostInput
): Promise<PostMutationResult> {
  let replacedContent = input.content;
  const postId = crypto.randomUUID();
  const filename = `${postId}.json`;

  const uploadedContentFiles: PostMutationResult["uploadedContentFiles"] = [];

  for (const file of input.contentFiles) {
    let base64Content = file.url ? stripDataUrlPrefix(file.url) : "";
    if (!base64Content) continue;

    const contentFilePath = `content/${file.name}`;
    const url = await createContentFile(
      contentFilePath,
      file.id,
      base64Content
    );
    uploadedContentFiles.push({
      id: file.id,
      name: file.name,
      url,
      type: file.type,
    });
    replacedContent = replacedContent.split(file.id).join(url);
  }

  const uploadedFiles: PostFile[] = [];
  for (const file of input.files) {
    const fileId = crypto.randomUUID();
    const ext = fileExtension(file.name);
    const imagePath = `images/${fileId}${ext}`;
    const url = await createImageFile(imagePath, fileId, file);
    uploadedFiles.push({
      id: fileId,
      name: `${fileId}${ext}`,
      url,
      type: file.type,
      status: FILE_STATUS.UPLOADED,
    });
  }

  const postData = {
    id: postId,
    title: input.title,
    content: replacedContent,
    createdAt: new Date().toISOString(),
    files: uploadedFiles,
    contentFiles: uploadedContentFiles,
  };

  await createOrUpdateFile(
    `posts/${filename}`,
    postData,
    `Create post: ${input.title}`,
    null
  );
  await updateMetaJson(filename);

  return {
    success: true,
    filename,
    postId,
    uploadedContentFiles,
  };
}

export async function updatePost(
  input: UpdatePostInput
): Promise<PostMutationResult> {
  const postContent = await getContent(`posts/${input.id}.json`);
  const existingFiles = postContent.content.files || [];
  const existingContentFiles = postContent.content.contentFiles || [];

  const contentFilesToDelete = existingContentFiles.filter(
    (existingFile: ContentFileInput) =>
      !input.contentFiles.some((newFile) => newFile.id === existingFile.id)
  );

  await deleteFiles(contentFilesToDelete);
  await deleteFiles(input.filesToDelete);

  const uploadedContentFiles: PostMutationResult["uploadedContentFiles"] = [];
  let replacedContent = input.content;

  for (const file of input.contentFiles) {
    if (!file.name) continue;

    let base64Content = file.url ? stripDataUrlPrefix(file.url) : "";
    if (!base64Content || file.status === FILE_STATUS.UPLOADED) {
      continue;
    }

    const contentFilePath = `content/${file.name}`;
    const url = await createContentFile(
      contentFilePath,
      file.id,
      base64Content
    );
    uploadedContentFiles.push({
      id: file.id,
      name: file.name,
      url,
      type: file.type,
      status: file.status,
    });
    replacedContent = replacedContent.split(file.id).join(url);
  }

  const uploadedFiles: Array<{ id: string; name: string; url: string }> = [];
  for (const file of input.files) {
    const fileId = crypto.randomUUID();
    const ext = fileExtension(file.name);
    const imagePath = `images/${fileId}${ext}`;
    const url = await createImageFile(imagePath, fileId, file);
    uploadedFiles.push({
      id: fileId,
      name: `${fileId}${ext}`,
      url,
    });
  }

  const finalFiles = [...existingFiles, ...uploadedFiles];
  const finalContentFiles = [
    ...existingContentFiles.filter((existingFile: ContentFileInput) =>
      input.contentFiles.some((newFile) => newFile.id === existingFile.id)
    ),
    ...uploadedContentFiles,
  ];

  const updatedPostData = {
    ...postContent.content,
    title: input.title,
    content: replacedContent,
    updatedAt: new Date().toISOString(),
    files: finalFiles,
    contentFiles: finalContentFiles,
  };

  const postResponse = await getContent(`posts/${input.id}.json`);
  await createOrUpdateFile(
    `posts/${input.id}.json`,
    updatedPostData,
    `Update post: ${input.title}`,
    postResponse.sha
  );

  return {
    success: true,
    message: "Post updated successfully",
    uploadedContentFiles,
  };
}

export async function deletePost(
  id: string
): Promise<{ success: true; message: string }> {
  const metaContent = await getContent("posts/meta.json");
  const postContent = await getContent(`posts/${id}.json`);

  if (postContent.content.files && postContent.content.files.length > 0) {
    await deleteFiles(postContent.content.files);
  }

  await deleteFile(`posts/${id}.json`, postContent.sha);
  metaContent.content.posts = metaContent.content.posts.filter(
    (post: string) => post !== `${id}.json`
  );
  await createOrUpdateFile(
    "posts/meta.json",
    metaContent.content,
    "Update meta.json",
    metaContent.sha
  );

  return {
    success: true,
    message: "Post deleted successfully",
  };
}
