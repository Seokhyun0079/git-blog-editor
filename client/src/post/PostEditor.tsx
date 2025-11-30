import { useEffect, useState, ChangeEvent, FormEvent, DragEvent } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { FILE_STATUS, PostFile } from "../type/File";
import { usePostPageContext } from "../context/PostPageContext";
import { useLoadingContext } from "../context/LoadingContext";
import YoutubeDialog from "./edit/YoutubeDialog";
import FileList from "./edit/FileList";
import MediaInsertBtns from "./edit/MediaInsertBtns";
import YoutubePreview from "./edit/YotubePreview";
import { PostEditorProps } from "./Props";
import { convertFileToPostFile } from "./FileAdapter";
import { TOAST_TYPES, useToastContext } from "../context/ToastContext";

const requestHeaders = {};

const fileProcess = (
  file: File,
  invokeSetters: (file: File, postFile: PostFile) => void
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const postFile = convertFileToPostFile(file, e.target?.result as string);
    invokeSetters(file, postFile);
  };
  reader.readAsDataURL(file);
};

const PostEditor = ({ show, selectedPost }: PostEditorProps) => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [contentFiles, setContentFiles] = useState<PostFile[]>([]); // Cache base64 for preview
  const [attachedFiles, setAttachedFiles] = useState<PostFile[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<PostFile[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState<boolean>(false);

  const [youtubeVideoUrls, setYoutubeVideoUrls] = useState<string[]>([]);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState<boolean>(false);
  const { onPostCreated } = usePostPageContext();
  const { post, put } = useLoadingContext();
  const { showToast } = useToastContext();

  // Open YouTube dialog
  const handleOpenYouTubeDialog = (): void => {
    setYoutubeDialogOpen(true);
  };

  // Close YouTube dialog
  const handleCloseYouTubeDialog = (): void => {
    setYoutubeDialogOpen(false);
  };

  // Confirm YouTube URL
  const handleConfirmYouTubeUrl = (videoId: string): void => {
    const youtubeVideoUrl = `https://www.youtube.com/embed/${videoId}`;
    setYoutubeVideoUrls((prev) => [...prev, youtubeVideoUrl]);
    setYoutubeDialogOpen(false);
    setContent((prev) => prev + `\n<youtube src="${youtubeVideoUrl}">\n`);
  };
  const setAttachedMedia = (file: File, postFile: PostFile) => {
    setAttachedFiles((prev) => [...prev, postFile]);
    setFiles((prev) => [...prev, file]);
  };

  const setContentMedia = (file: File, postFile: PostFile) => {
    const tagType = postFile.type === "image" ? "img" : "video";
    const tag = `<${tagType} src="${postFile.id}"/>`;
    setContentFiles((prev) => [...prev, postFile]);
    setContent((prev) => prev + "\n" + tag + "\n");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newFiles = Array.from(event.target.files || []) as File[];
    newFiles.forEach((file) => fileProcess(file, setAttachedMedia));
  };

  const handleRemoveFile = (index: number): void => {
    console.log("handleRemoveFile");
    setDeletedFiles((prev) => [...prev, attachedFiles[index]]);
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) =>
      prev.filter((file, i) => file.name !== attachedFiles[index].name)
    );
  };

  const handleContentFileInsert = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => fileProcess(file, setContentMedia));
  };

  const handleRemoveContentFile = (index: number): void => {
    const fileToRemove = contentFiles[index];

    // Update the file marked for deletion in the original array
    setContentFiles((prev) =>
      prev.map((file, i) => (i === index ? fileToRemove : file))
    );
    if (fileToRemove.id) {
      // Remove UUID tag from content
      const srcValue =
        fileToRemove.status === FILE_STATUS.UPLOADED
          ? fileToRemove.url
          : fileToRemove.id;
      const tagType = fileToRemove.type === "image" ? "img" : "video";
      // Escape special regex characters in srcValue
      const escapedSrc = srcValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match the entire tag from start to end
      const tagRegex = new RegExp(
        `<${tagType}\\s+src="${escapedSrc}"\\s*/>`,
        "g"
      );
      setContent((prev) => prev.replace(tagRegex, ""));
    }
    // Remove from preview list
    setContentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => fileProcess(file, setContentMedia));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    console.log("handleSubmit");
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      // Send only files with UUID as contentFiles
      formData.append("contentFiles", JSON.stringify(contentFiles));
      files.forEach((file) => {
        formData.append("files", file);
      });
      let response;

      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      if (selectedPost) {
        formData.append("id", selectedPost.id);
        formData.append("filesToDelete", JSON.stringify(deletedFiles));
        response = await put(
          `${apiUrl}/api/posts/${selectedPost.id}`,
          formData,
          requestHeaders
        );
      } else {
        response = await post(`${apiUrl}/api/posts`, formData, requestHeaders);
      }

      if (response.success) {
        setTitle("");
        setContent("");
        setFiles([]);
        setContentFiles([]);
        setYoutubeVideoUrls([]);
        onPostCreated();
        showToast("Post registered successfully", TOAST_TYPES.SUCCESS);
      } else {
        throw new Error(
          response.error || "An error occurred while creating the post."
        );
      }
    } catch (error: any) {
      setError(
        error.response?.error ||
          error.message ||
          "An error occurred while creating the post."
      );
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializePost = () => {
    if (selectedPost) {
      setTitle(selectedPost.title);
      setContent(selectedPost.content);
      setAttachedFiles(selectedPost.files || []);
      // selectedPost.files may already include base64 preview URLs
      setContentFiles((selectedPost.contentFiles || []) as PostFile[]);
      setYoutubeVideoUrls(selectedPost.youtubeVideoUrls || []);
    } else {
      setTitle("");
      setContent("");
      setFiles([]);
      setContentFiles([]);
      setAttachedFiles([]);
      setYoutubeVideoUrls([]);
    }
  };

  useEffect(() => {
    initializePost();
    // eslint-disable-next-line
  }, [selectedPost]);

  // Files without UUID (regular attachments)
  // const attachedFiles = files.filter((file) => !file.uuid);
  if (!show) return null;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Create New Post
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
        />
        <MediaInsertBtns
          handleContentFileInsert={handleContentFileInsert}
          handleOpenYouTubeDialog={handleOpenYouTubeDialog}
        />
        <TextField
          fullWidth
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          margin="normal"
          required
          multiline
          rows={6}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: dragOver ? "2px dashed #1976d2" : "none",
            backgroundColor: dragOver
              ? "rgba(25, 118, 210, 0.04)"
              : "transparent",
          }}
        />

        {dragOver && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ mt: 1, display: "block" }}
          >
            Drop files here to insert
          </Typography>
        )}

        {/* Display YouTube video information */}
        <YoutubePreview
          youtubeVideoUrls={youtubeVideoUrls}
          setYoutubeVideoUrls={setYoutubeVideoUrls}
        />
        <FileList
          label="Inserted Media Files"
          files={contentFiles}
          handleRemoveFile={handleRemoveContentFile}
        />

        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept="*/*"
            style={{ display: "none" }}
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Attach Files
            </Button>
          </label>
        </Box>
        <FileList
          label="Attached Files"
          files={attachedFiles}
          handleRemoveFile={handleRemoveFile}
        />
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !title || !content}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </form>

      {/* YouTube URL input dialog */}
      <YoutubeDialog
        open={youtubeDialogOpen}
        onClose={handleCloseYouTubeDialog}
        onConfirm={handleConfirmYouTubeUrl}
      />
    </Paper>
  );
};

export default PostEditor;
