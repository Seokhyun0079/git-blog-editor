import { PostData, PostReq } from "./Post";
import { Request } from "express";
export const convertPostReqToPostData = (req: Request): PostReq => {
  console.log("=== PUT Request Debug ===");
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("req.files:", req.files);
  console.log(
    "req.files length:",
    Array.isArray(req.files) ? req.files.length : "not array"
  );
  console.log("req.body keys:", Object.keys(req.body));
  console.log("========================");
  return {
    id: req.params.id,
    title: req.body.title,
    content: req.body.content,
    createdAt: req.body.createdAt,
    updatedAt: req.body.updatedAt,
    files: (req.files as Express.Multer.File[]) || [],
    contentFiles: req.body.contentFiles
      ? JSON.parse(req.body.contentFiles)
      : [],
    filesToDelete: req.body.filesToDelete
      ? JSON.parse(req.body.filesToDelete)
      : [],
  };
};
