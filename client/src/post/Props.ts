import { ChangeEvent } from "react";
import { Post } from "../type/Post";
import { PostFile } from "../type/File";

export interface FileComponentProps {
  file: PostFile;
}

export interface FileListProps {
  label: string;
  files: PostFile[];
  handleRemoveFile: (index: number) => void;
}

export interface MediaInsertBtnsProps {
  handleContentFileInsert: (event: ChangeEvent<HTMLInputElement>) => void;
  handleOpenYouTubeDialog: () => void;
}

export interface YoutubePreviewProps {
  youtubeVideoUrls: string[];
  setYoutubeVideoUrls: (youtubeVideoUrls: string[]) => void;
}

export interface PostListProps {
  posts: Post[];
  show: boolean;
}

export interface PostEditorProps {
  show: boolean;
  selectedPost: Post | null;
}
