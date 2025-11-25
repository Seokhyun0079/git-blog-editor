import { PostFile } from "./File";

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  files?: PostFile[];
  youtubeVideoUrls?: string[];
  contentFiles?: PostFile[];
}
