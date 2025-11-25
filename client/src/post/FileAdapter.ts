import { FILE_STATUS, PostFile, UploadedFile } from "../type/File";
import { Post } from "../type/Post";

export const convertUploadedFileToPostFile = (file: UploadedFile): PostFile => {
  // Check actual MIME type to set accurate type
  let actualType = "";
  if (file.name.endsWith(".mp4") || file.name.endsWith(".mov")) {
    actualType = "video";
  } else if (
    file.name.endsWith(".jpg") ||
    file.name.endsWith(".jpeg") ||
    file.name.endsWith(".png")
  ) {
    actualType = "image";
  } else {
    actualType = "unknown";
  }

  return Object.assign({}, file, {
    type: actualType,
    name: file.name,
    status: FILE_STATUS.UPLOADED,
    url: file.url,
    id: file.id,
  }) as PostFile;
};

export const convertFileToPostFile = (file: File, url: string): PostFile => {
  // Check actual MIME type to set accurate type
  let actualType = "";
  if (file.type.startsWith("video/")) {
    actualType = "video";
  } else if (file.type.startsWith("image/")) {
    actualType = "image";
  } else {
    actualType = "unknown";
  }

  return Object.assign({}, file, {
    id: crypto.randomUUID(),
    type: actualType,
    name: file.name,
    status: FILE_STATUS.DRAFT,
    url: url,
  }) as PostFile;
};

export const processPost = (post: Post): Post => ({
  ...post,
  files: post.files?.map((file: UploadedFile) =>
    convertUploadedFileToPostFile(file)
  ),
});
