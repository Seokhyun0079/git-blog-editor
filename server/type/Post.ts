import { MediaFile, PostFile, UploadedFile } from "./File";

export interface PostData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  files?: Array<PostFile>;
  contentFiles?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  updatedAt?: string;
}

export interface PostUpdateReq {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  files: Express.Multer.File[];
  contentFiles: MediaFile[];
  filesToDelete: UploadedFile[];
}

export interface PostCreateReq {
  title: string;
  content: string;
  files: Express.Multer.File[];
  contentFiles: MediaFile[];
}
