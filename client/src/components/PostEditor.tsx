import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  DragEvent,
} from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Card,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import axios from "axios";
import { FILE_STATUS } from "./postContst";

interface PostFile {
  id?: string;
  name: string;
  url?: string;
  size?: number;
  uuid?: string;
  type?: string;
  status?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  files?: PostFile[];
  contentFiles?: PostFile[];
  youtubeVideoUrl?: string;
  status?: string;
}

interface PostEditorProps {
  onPostCreated: () => void;
  selectedPost: Post | null;
}

// Type that adds additional properties to File type (using intersection type)
type FileWithUuid = File & {
  uuid?: string;
  url?: string;
  type?: string;
  status?: string;
};

// Extract file extension from filename
const getFileExtension = (filename: string): string => {
  if (!filename) return "";
  const lastDotIndex = filename.lastIndexOf(".");
  return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
};

// Extract video ID from YouTube URL
const extractYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Validate YouTube URL
const isValidYouTubeUrl = (url: string): string | null => {
  const videoId = extractYouTubeVideoId(url);
  return videoId;
};

const PostEditor: React.FC<PostEditorProps> = ({
  onPostCreated,
  selectedPost,
}) => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [files, setFiles] = useState<FileWithUuid[]>([]);
  const [contentFiles, setContentFiles] = useState<FileWithUuid[]>([]); // Cache base64 for preview
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState<boolean>(false);

  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState<string>("");
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState<boolean>(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>("");

  // Open YouTube dialog
  const handleOpenYouTubeDialog = async (): Promise<void> => {
    try {
      // Read text from clipboard
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && isValidYouTubeUrl(clipboardText)) {
        setYoutubeUrlInput(clipboardText);
      } else {
        setYoutubeUrlInput("");
      }
    } catch (error) {
      // Failed to access clipboard or invalid URL
      console.log("Failed to access clipboard or invalid URL:", error);
      setYoutubeUrlInput("");
    }
    setYoutubeDialogOpen(true);
  };

  // Close YouTube dialog
  const handleCloseYouTubeDialog = (): void => {
    setYoutubeDialogOpen(false);
    setYoutubeUrlInput("");
  };

  // Confirm YouTube URL
  const handleConfirmYouTubeUrl = (): void => {
    const videoId = isValidYouTubeUrl(youtubeUrlInput);
    if (!!videoId) {
      const youtubeVideoUrl = "https://www.youtube.com/embed/" + videoId;
      setYoutubeVideoUrl(youtubeVideoUrl);
      setYoutubeDialogOpen(false);
      setYoutubeUrlInput("");
      setContent(
        (prev) => prev + "\n" + `<yotube src="${youtubeVideoUrl}">` + "\n"
      );
    } else {
      alert("is not valid youtube url.");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newFiles = Array.from(event.target.files || []) as FileWithUuid[];
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index: number): void => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleContentFileInsert = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const uuid = crypto.randomUUID();
      // Check actual MIME type to set accurate type
      let actualType = "image";
      if (file.type.startsWith("video/")) {
        actualType = "video";
      } else if (file.type.startsWith("image/")) {
        actualType = "image";
      }

      const tag =
        actualType === "image"
          ? `<img src="${uuid}"/>`
          : `<video src="${uuid}"/>`;

      setContent((prev) => prev + "\n" + tag + "\n");

      // Add UUID property to file
      const fileWithUuid = Object.assign({}, file, {
        uuid: uuid,
        type: actualType,
        name: uuid + getFileExtension(event.target.value),
        status: FILE_STATUS.DRAFT,
      }) as FileWithUuid;

      setFiles((prev) => [...prev, fileWithUuid]);

      // Convert to base64 for preview caching
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewFile = Object.assign({}, fileWithUuid, {
          url: e.target?.result as string,
        }) as FileWithUuid;
        console.log("previewFile", previewFile);
        setContentFiles((prev) => [...prev, previewFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveContentFile = (index: number): void => {
    const fileToRemove = contentFiles[index];

    // Update the file marked for deletion in the original array
    setContentFiles((prev) =>
      prev.map((file, i) => (i === index ? fileToRemove : file))
    );
    if (fileToRemove.uuid) {
      // Remove UUID tag from content
      const tagToRemove =
        fileToRemove.type === "image"
          ? `<img src="${fileToRemove.uuid}"/>`
          : `<video src="${fileToRemove.uuid}"/>`;

      setContent((prev) => prev.replace(tagToRemove, ""));
    }

    // Remove from file list
    setFiles((prev) => prev.filter((_, i) => i !== index));

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
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const uuid = crypto.randomUUID();
        const tag = `<img src="${uuid}"/>`;
        setContent((prev) => prev + "\n" + tag + "\n");

        const fileWithUuid = Object.assign({}, file, {
          uuid: uuid,
          type: "image",
        }) as FileWithUuid;
        setFiles((prev) => [...prev, fileWithUuid]);

        // Convert to base64 for preview caching
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewFile = Object.assign({}, fileWithUuid, {
            url: e.target?.result as string,
          }) as FileWithUuid;
          setContentFiles((prev) => [...prev, previewFile]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        const uuid = crypto.randomUUID();
        const tag = `<video src="${uuid}"/>`;
        setContent((prev) => prev + "\n" + tag + "\n");

        const fileWithUuid = Object.assign({}, file, {
          uuid: uuid,
          type: "video",
        }) as FileWithUuid;
        setFiles((prev) => [...prev, fileWithUuid]);

        // Convert to base64 for preview caching
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewFile = Object.assign({}, fileWithUuid, {
            url: e.target?.result as string,
          }) as FileWithUuid;
          setContentFiles((prev) => [...prev, previewFile]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (youtubeVideoUrl) {
        formData.append("youtubeVideoUrl", youtubeVideoUrl);
      }
      console.log("contentFiles", contentFiles);
      // Send only files with UUID as contentFiles
      const attachedFiles = files.filter((file) => !file.uuid);
      if (contentFiles.length > 0) {
        const contentFilesForUpload = contentFiles.map((file) => {
          return {
            name: file.name,
            base64: file.url,
            uuid: file.uuid,
            type: file.type,
            status: file.status,
          };
        });
        formData.append("contentFiles", JSON.stringify(contentFilesForUpload));
      }

      attachedFiles.forEach((file) => {
        formData.append("files", file);
      });

      let response;

      if (selectedPost) {
        formData.append("id", selectedPost.id);
        response = await axios.put(
          `http://localhost:5000/api/posts/${selectedPost.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axios.post(
          "http://localhost:5000/api/posts",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (response.data.success) {
        setTitle("");
        setContent("");
        setFiles([]);
        setContentFiles([]);
        setYoutubeVideoUrl("");
        onPostCreated();
      } else {
        throw new Error(
          response.data.error || "An error occurred while creating the post."
        );
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          error.message ||
          "An error occurred while creating the post."
      );
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPost) {
      setTitle(selectedPost.title);
      setContent(selectedPost.content);
      setFiles((selectedPost.files || []) as FileWithUuid[]);
      // selectedPost.files may already include base64 preview URLs
      setContentFiles((selectedPost.contentFiles || []) as FileWithUuid[]);
      setYoutubeVideoUrl(selectedPost.youtubeVideoUrl || "");
    }
  }, [selectedPost]);

  // Files without UUID (regular attachments)
  const attachedFiles = files.filter((file) => !file.uuid);

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

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Content
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="image-upload"
              type="file"
              multiple
              onChange={(e) => handleContentFileInsert(e)}
            />
            <label htmlFor="image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<ImageIcon />}
                size="small"
              >
                Insert Image
              </Button>
            </label>

            <input
              accept="video/*"
              style={{ display: "none" }}
              id="video-upload"
              type="file"
              multiple
              onChange={(e) => handleContentFileInsert(e)}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<VideoLibraryIcon />}
                size="small"
              >
                Insert Video
              </Button>
            </label>

            <Button
              variant="outlined"
              component="span"
              startIcon={<VideoLibraryIcon />}
              size="small"
              onClick={handleOpenYouTubeDialog}
            >
              Insert Youtube Video
            </Button>
          </Box>
        </Box>

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
        {youtubeVideoUrl && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <iframe
              width="560"
              height="315"
              src={`${youtubeVideoUrl}`}
              frameBorder="0"
              allowFullScreen
            ></iframe>
            <Typography variant="subtitle2" gutterBottom>
              YouTube Video:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {youtubeVideoUrl}
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={() => setYoutubeVideoUrl("")}
              sx={{ mt: 1 }}
            >
              Remove
            </Button>
          </Box>
        )}

        {contentFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Inserted Media Files:
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {contentFiles.map((file, index) => {
                // Use cached base64 preview URL
                const fileUrl = file.url || "";

                // Check file type more accurately
                const isImage =
                  file.type === "image" ||
                  (file.type && file.type.startsWith("image/"));
                const isVideo =
                  file.type === "video" ||
                  (file.type && file.type.startsWith("video/"));

                return (
                  <Card key={index}>
                    {isImage ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={fileUrl}
                        alt={file.name || "Image"}
                        sx={{ objectFit: "cover" }}
                        onError={(e) => console.log("Image load error:", e)}
                      />
                    ) : isVideo ? (
                      <CardMedia
                        component="video"
                        height="140"
                        src={fileUrl}
                        controls
                        onError={(e) => console.log("Video load error:", e)}
                      />
                    ) : (
                      <Box
                        height={140}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor="grey.200"
                      >
                        <Typography variant="body2" color="text.secondary">
                          Unknown file type
                        </Typography>
                      </Box>
                    )}
                    <CardActions>
                      <Typography variant="caption" sx={{ flexGrow: 1 }}>
                        {file.uuid || file.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveContentFile(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Attached Files:
          </Typography>
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

        {attachedFiles.length > 0 && (
          <List>
            {attachedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={file.name}
                  secondary={
                    file.size
                      ? `${(file.size / 1024).toFixed(2)} KB`
                      : "Unknown size"
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

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
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </form>

      {/* YouTube URL input dialog */}
      <Dialog
        open={youtubeDialogOpen}
        onClose={handleCloseYouTubeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter YouTube Video URL</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            fullWidth
            variant="outlined"
            value={youtubeUrlInput}
            onChange={(e) => setYoutubeUrlInput(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Supported URL formats: youtube.com/watch?v=..., youtu.be/...,
            youtube.com/embed/...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseYouTubeDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmYouTubeUrl}
            variant="contained"
            disabled={!youtubeUrlInput.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PostEditor;
