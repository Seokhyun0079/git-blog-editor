import {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
} from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CustomImage } from "./edit/CustomImage";
import { Video, YouTube } from "./edit/TiptapExtensions";
import Placeholder from "@tiptap/extension-placeholder";
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
  const [files, setFiles] = useState<File[]>([]);
  const [contentFiles, setContentFiles] = useState<PostFile[]>([]); // Cache base64 for preview
  const [attachedFiles, setAttachedFiles] = useState<PostFile[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<PostFile[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [editorContent, setEditorContent] = useState<string>("");

  const [youtubeVideoUrls, setYoutubeVideoUrls] = useState<string[]>([]);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState<boolean>(false);
  const { onPostCreated } = usePostPageContext();
  const { post, put } = useLoadingContext();
  const { showToast } = useToastContext();

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Video,
      YouTube,
      Placeholder.configure({
        placeholder: "Enter your content here...",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      // Update editor content state to trigger re-render
      setEditorContent(editor.getText());
    },
  });

  // Open YouTube dialog
  const handleOpenYouTubeDialog = (): void => {
    setYoutubeDialogOpen(true);
  };

  // Close YouTube dialog
  const handleCloseYouTubeDialog = (): void => {
    setYoutubeDialogOpen(false);
  };

  // Helper function to get focused chain
  const getFocusedChain = () => {
    if (!editor) return null;
    return editor.chain().focus();
  };

  // Confirm YouTube URL
  const handleConfirmYouTubeUrl = (videoId: string): void => {
    if (!editor) return;
    const youtubeVideoUrl = `https://www.youtube.com/embed/${videoId}`;
    setYoutubeVideoUrls((prev) => [...prev, youtubeVideoUrl]);
    setYoutubeDialogOpen(false);
    getFocusedChain()
      ?.insertContent({
        type: "youtube",
        attrs: { src: youtubeVideoUrl },
      })
      .run();
  };
  const setAttachedMedia = (file: File, postFile: PostFile) => {
    setAttachedFiles((prev) => [...prev, postFile]);
    setFiles((prev) => [...prev, file]);
  };

  const insertMediaContent = (type: "image" | "video", postFile: PostFile) => {
    getFocusedChain()
      ?.insertContent({
        type,
        attrs: {
          src: postFile.url,
          uuid: postFile.id,
        },
      })
      .run();
  };

  const setContentMedia = (file: File, postFile: PostFile) => {
    if (!editor) return;
    setContentFiles((prev) => [...prev, postFile]);

    if (postFile.type === "image" || postFile.type === "video") {
      insertMediaContent(postFile.type, postFile);
    }
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
    if (!editor) return;
    const fileToRemove = contentFiles[index];

    // Find and remove the node from editor
    const srcValue =
      fileToRemove.status === FILE_STATUS.UPLOADED
        ? fileToRemove.url
        : fileToRemove.id;

    // Find nodes with matching UUID or src
    editor.state.doc.descendants((node, pos) => {
      if (fileToRemove.type === "image" && node.type.name === "image") {
        const nodeUuid = node.attrs.uuid || node.attrs.src;
        if (nodeUuid === srcValue || nodeUuid === fileToRemove.id) {
          getFocusedChain()
            ?.deleteRange({ from: pos, to: pos + node.nodeSize })
            .run();
        }
      } else if (fileToRemove.type === "video" && node.type.name === "video") {
        const nodeUuid = node.attrs.uuid || node.attrs.src;
        if (nodeUuid === srcValue || nodeUuid === fileToRemove.id) {
          getFocusedChain()
            ?.deleteRange({ from: pos, to: pos + node.nodeSize })
            .run();
        }
      }
    });

    // Remove from preview list
    setContentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle file drop on editor
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      if (!editor) return;
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      files.forEach((file) => fileProcess(file, setContentMedia));
    },
    [editor]
  );

  // Convert Tiptap HTML to legacy format for server compatibility
  const convertTiptapToLegacyFormat = (html: string): string => {
    let converted = html;

    // Convert Tiptap image nodes to legacy format
    converted = converted.replace(
      /<img[^>]+data-uuid="([^"]+)"[^>]*src="([^"]+)"[^>]*>/gi,
      (match, uuid, src) => {
        return `<img src="${uuid}"/>`;
      }
    );

    // Convert Tiptap video nodes to legacy format
    converted = converted.replace(
      /<video[^>]+data-uuid="([^"]+)"[^>]*src="([^"]+)"[^>]*>/gi,
      (match, uuid, src) => {
        return `<video src="${uuid}"/>`;
      }
    );

    // Convert YouTube nodes to legacy format
    converted = converted.replace(
      /<youtube[^>]+src="([^"]+)"[^>]*>/gi,
      (match, src) => {
        return `<youtube src="${src}">`;
      }
    );

    return converted;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    if (!editor) return;
    console.log("handleSubmit");
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);

      // Get HTML from Tiptap and convert to legacy format
      const tiptapHtml = editor.getHTML();

      // Extract blob URLs from editor and convert to base64
      const blobUrls = new Set<string>();
      const imgRegex = /<img[^>]+(?:src|data-uuid)="(blob:[^"]+)"[^>]*>/gi;
      const videoRegex = /<video[^>]+(?:src|data-uuid)="(blob:[^"]+)"[^>]*>/gi;

      let match;
      while ((match = imgRegex.exec(tiptapHtml)) !== null) {
        blobUrls.add(match[1]);
      }
      while ((match = videoRegex.exec(tiptapHtml)) !== null) {
        blobUrls.add(match[1]);
      }

      // Convert blob URLs to base64 and add to contentFiles if not already present
      const finalContentFiles = [...contentFiles];
      const blobUrlToUuidMap: Record<string, string> = {};

      for (const blobUrl of Array.from(blobUrls)) {
        // Check if this blob URL is already in contentFiles
        const existingFile = finalContentFiles.find(
          (file) => file.id === blobUrl || file.url === blobUrl
        );

        if (!existingFile) {
          try {
            // Fetch blob URL and convert to base64
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            // Create PostFile from blob
            const fileExtension = blob.type.includes("video")
              ? ".mp4"
              : blob.type.includes("image/png")
              ? ".png"
              : blob.type.includes("image/jpeg")
              ? ".jpg"
              : ".jpg";
            const fileId = crypto.randomUUID();
            const fileName = `${fileId}${fileExtension}`;
            const postFile: PostFile = {
              id: fileId,
              name: fileName,
              type: blob.type.startsWith("video/") ? "video" : "image",
              status: FILE_STATUS.DRAFT,
              url: dataUrl,
            };
            finalContentFiles.push(postFile);
            blobUrlToUuidMap[blobUrl] = fileId;
          } catch (error) {
            console.error("Error converting blob URL to base64:", error);
          }
        } else {
          // Use existing file's ID
          blobUrlToUuidMap[blobUrl] = existingFile.id;
        }
      }

      // Replace blob URLs with UUIDs in HTML before converting to legacy format
      let htmlWithUuids = tiptapHtml;
      for (const [blobUrl, uuid] of Object.entries(blobUrlToUuidMap)) {
        const escapedBlobUrl = blobUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Replace blob URL in img tags: update both src and data-uuid
        htmlWithUuids = htmlWithUuids.replace(
          new RegExp(`<img([^>]*?)src="${escapedBlobUrl}"([^>]*?)>`, "gi"),
          (match, before, after) => {
            // Check if data-uuid already exists
            if (match.includes("data-uuid=")) {
              // Extract existing data-uuid value
              const uuidMatch = match.match(/data-uuid="([^"]+)"/);
              const existingUuid = uuidMatch ? uuidMatch[1] : null;
              // If data-uuid is also a blob URL, replace it with UUID, otherwise keep it
              // Replace both src and data-uuid (if data-uuid was blob URL)
              let result = match.replace(
                new RegExp(`src="${escapedBlobUrl}"`, "g"),
                `src="${uuid}"`
              );
              if (existingUuid && existingUuid.startsWith("blob:")) {
                result = result.replace(
                  new RegExp(`data-uuid="${escapedBlobUrl}"`, "g"),
                  `data-uuid="${uuid}"`
                );
              }
              return result;
            } else {
              return `<img${before}src="${uuid}" data-uuid="${uuid}"${after}>`;
            }
          }
        );
        // Replace blob URL in video tags: update both src and data-uuid
        htmlWithUuids = htmlWithUuids.replace(
          new RegExp(`<video([^>]*?)src="${escapedBlobUrl}"([^>]*?)>`, "gi"),
          (match, before, after) => {
            // Check if data-uuid already exists
            if (match.includes("data-uuid=")) {
              // Extract existing data-uuid value
              const uuidMatch = match.match(/data-uuid="([^"]+)"/);
              const existingUuid = uuidMatch ? uuidMatch[1] : null;
              // If data-uuid is also a blob URL, replace it with UUID, otherwise keep it
              // Replace both src and data-uuid (if data-uuid was blob URL)
              let result = match.replace(
                new RegExp(`src="${escapedBlobUrl}"`, "g"),
                `src="${uuid}"`
              );
              if (existingUuid && existingUuid.startsWith("blob:")) {
                result = result.replace(
                  new RegExp(`data-uuid="${escapedBlobUrl}"`, "g"),
                  `data-uuid="${uuid}"`
                );
              }
              return result;
            } else {
              return `<video${before}src="${uuid}" data-uuid="${uuid}"${after}>`;
            }
          }
        );
      }

      // For already uploaded files (data-uuid has GitHub URL but src has blob URL),
      // replace src with data-uuid value
      htmlWithUuids = htmlWithUuids.replace(
        /<img([^>]*?)data-uuid="([^"]+)"([^>]*?)src="(blob:[^"]+)"([^>]*?)>/gi,
        (match, before, uuid, middle, blobUrl, after) => {
          // Only replace if data-uuid is not a blob URL (i.e., it's already a GitHub URL or UUID)
          if (!uuid.startsWith("blob:")) {
            return `<img${before}data-uuid="${uuid}"${middle}src="${uuid}"${after}>`;
          }
          return match;
        }
      );
      htmlWithUuids = htmlWithUuids.replace(
        /<video([^>]*?)data-uuid="([^"]+)"([^>]*?)src="(blob:[^"]+)"([^>]*?)>/gi,
        (match, before, uuid, middle, blobUrl, after) => {
          // Only replace if data-uuid is not a blob URL (i.e., it's already a GitHub URL or UUID)
          if (!uuid.startsWith("blob:")) {
            return `<video${before}data-uuid="${uuid}"${middle}src="${uuid}"${after}>`;
          }
          return match;
        }
      );

      // Handle base64 data URLs: find base64 in src and match with contentFiles
      // Create base64 to UUID mapping from contentFiles
      const base64ToUuidMap: Record<string, string> = {};
      finalContentFiles.forEach((file) => {
        if (file.url && file.url.startsWith("data:")) {
          // Use full data URL as key for matching
          base64ToUuidMap[file.url] = file.id;
        }
      });

      // Replace base64 data URLs with UUIDs in img tags
      htmlWithUuids = htmlWithUuids.replace(
        /<img([^>]*?)src="(data:[^"]+)"([^>]*?)>/gi,
        (match, before, base64Url, after) => {
          const uuid = base64ToUuidMap[base64Url];
          if (uuid) {
            // Check if data-uuid already exists
            if (match.includes("data-uuid=")) {
              return match.replace(
                new RegExp(
                  `src="${base64Url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
                  "g"
                ),
                `src="${uuid}"`
              );
            } else {
              return `<img${before}src="${uuid}" data-uuid="${uuid}"${after}>`;
            }
          }
          return match;
        }
      );

      // Replace base64 data URLs with UUIDs in video tags
      htmlWithUuids = htmlWithUuids.replace(
        /<video([^>]*?)src="(data:[^"]+)"([^>]*?)>/gi,
        (match, before, base64Url, after) => {
          const uuid = base64ToUuidMap[base64Url];
          if (uuid) {
            // Check if data-uuid already exists
            if (match.includes("data-uuid=")) {
              return match.replace(
                new RegExp(
                  `src="${base64Url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
                  "g"
                ),
                `src="${uuid}"`
              );
            } else {
              return `<video${before}src="${uuid}" data-uuid="${uuid}"${after}>`;
            }
          }
          return match;
        }
      );

      const legacyContent = convertTiptapToLegacyFormat(htmlWithUuids);
      formData.append("content", legacyContent);

      // Send files with UUID as contentFiles (including newly converted blob URLs)
      formData.append("contentFiles", JSON.stringify(finalContentFiles));
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
        // Update editor: replace UUID src with GitHub URLs for uploaded files
        if (
          response.uploadedContentFiles &&
          response.uploadedContentFiles.length > 0
        ) {
          const currentHtml = editor.getHTML();
          let updatedHtml = currentHtml;

          // Create UUID to GitHub URL mapping
          const uuidToUrlMap: Record<string, string> = {};
          response.uploadedContentFiles.forEach(
            (file: { id: string; url: string }) => {
              uuidToUrlMap[file.id] = file.url;
            }
          );

          // Create reverse mapping: from blob URL or data URL to UUID
          // Check contentFiles state to find original URLs
          const urlToUuidMap: Record<string, string> = {};
          contentFiles.forEach((file) => {
            if (
              file.url &&
              (file.url.startsWith("blob:") || file.url.startsWith("data:"))
            ) {
              urlToUuidMap[file.url] = file.id;
            }
          });
          // Also check uploaded files - match by ID to find original blob/data URLs
          response.uploadedContentFiles.forEach(
            (file: { id: string; url: string }) => {
              const originalFile = contentFiles.find((f) => f.id === file.id);
              if (
                originalFile &&
                originalFile.url &&
                (originalFile.url.startsWith("blob:") ||
                  originalFile.url.startsWith("data:"))
              ) {
                urlToUuidMap[originalFile.url] = file.id;
              }
            }
          );

          // Replace UUID or blob/data URL src with GitHub URL for images
          updatedHtml = updatedHtml.replace(
            /<img([^>]*?)(?:data-uuid="([^"]+)")?([^>]*?)src="([^"]+)"([^>]*?)>/gi,
            (match, before, uuid, middle, src, after) => {
              // Try to find UUID from data-uuid attribute, or from src if it's a blob/data URL
              const finalUuid = uuid || urlToUuidMap[src];
              const githubUrl = finalUuid ? uuidToUrlMap[finalUuid] : null;

              // Only replace if src is UUID/blob/data URL and we have GitHub URL
              if (
                githubUrl &&
                (src === finalUuid ||
                  src.startsWith("data:") ||
                  src.startsWith("blob:"))
              ) {
                // Keep data-uuid if it exists, otherwise don't add it
                if (uuid) {
                  return `<img${before}data-uuid="${finalUuid}"${middle}src="${githubUrl}"${after}>`;
                } else {
                  return `<img${before}${middle}src="${githubUrl}"${after}>`;
                }
              }
              return match;
            }
          );

          // Replace UUID or blob/data URL src with GitHub URL for videos
          updatedHtml = updatedHtml.replace(
            /<video([^>]*?)(?:data-uuid="([^"]+)")?([^>]*?)src="([^"]+)"([^>]*?)>/gi,
            (match, before, uuid, middle, src, after) => {
              // Try to find UUID from data-uuid attribute, or from src if it's a blob/data URL
              const finalUuid = uuid || urlToUuidMap[src];
              const githubUrl = finalUuid ? uuidToUrlMap[finalUuid] : null;

              // Only replace if src is UUID/blob/data URL and we have GitHub URL
              if (
                githubUrl &&
                (src === finalUuid ||
                  src.startsWith("data:") ||
                  src.startsWith("blob:"))
              ) {
                // Keep data-uuid if it exists, otherwise don't add it
                if (uuid) {
                  return `<video${before}data-uuid="${finalUuid}"${middle}src="${githubUrl}"${after}>`;
                } else {
                  return `<video${before}${middle}src="${githubUrl}"${after}>`;
                }
              }
              return match;
            }
          );

          // Update editor content
          editor.commands.setContent(updatedHtml);

          // Update contentFiles status to UPLOADED and update URLs
          setContentFiles((prev) =>
            prev.map((file) => {
              const uploadedFile = response.uploadedContentFiles.find(
                (uf: { id: string }) => uf.id === file.id
              );
              if (uploadedFile) {
                return {
                  ...file,
                  url: uploadedFile.url,
                  status: FILE_STATUS.UPLOADED,
                };
              }
              return file;
            })
          );
        }

        setTitle("");
        editor.commands.clearContent();
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

  // Convert legacy format to Tiptap HTML
  const convertLegacyToTiptapFormat = (
    content: string,
    contentFiles: PostFile[]
  ): string => {
    let converted = content;

    // Create UUID to file mapping
    const uuidToFileMap: Record<string, PostFile> = {};
    contentFiles.forEach((file) => {
      uuidToFileMap[file.id] = file;
    });

    // Convert legacy img tags to Tiptap format
    converted = converted.replace(
      /<img\s+src="([^"]+)"\s*\/?>/gi,
      (match, uuid) => {
        const file = uuidToFileMap[uuid];
        if (file) {
          return `<img src="${file.url}" data-uuid="${file.id}" />`;
        }
        return match;
      }
    );

    // Convert legacy video tags to Tiptap format
    converted = converted.replace(
      /<video\s+src="([^"]+)"\s*\/?>/gi,
      (match, uuid) => {
        const file = uuidToFileMap[uuid];
        if (file) {
          return `<video src="${file.url}" data-uuid="${file.id}" controls style="max-width: 100%; height: auto;"></video>`;
        }
        return match;
      }
    );

    // Convert legacy youtube tags to Tiptap format
    converted = converted.replace(
      /<youtube\s+src="([^"]+)"[^>]*>/gi,
      (match, src) => {
        return `<youtube src="${src}"></youtube>`;
      }
    );

    return converted;
  };

  const initializePost = () => {
    if (selectedPost && editor) {
      setTitle(selectedPost.title);
      setAttachedFiles(selectedPost.files || []);
      const postContentFiles = (selectedPost.contentFiles || []) as PostFile[];
      setContentFiles(postContentFiles);
      setYoutubeVideoUrls(selectedPost.youtubeVideoUrls || []);

      // Convert legacy content to Tiptap format
      const tiptapContent = convertLegacyToTiptapFormat(
        selectedPost.content,
        postContentFiles
      );
      editor.commands.setContent(tiptapContent);
      setEditorContent(editor.getText());
    } else {
      setTitle("");
      if (editor) {
        editor.commands.clearContent();
        setEditorContent("");
      }
      setFiles([]);
      setContentFiles([]);
      setAttachedFiles([]);
      setYoutubeVideoUrls([]);
    }
  };

  useEffect(() => {
    if (editor) {
      initializePost();
    }
    // eslint-disable-next-line
  }, [selectedPost, editor]);

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
        <Box
          sx={{
            mt: 2,
            mb: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            minHeight: 300,
            overflow: "hidden",
            "& .ProseMirror": {
              outline: "none",
              padding: 2,
              minHeight: 300,
              maxWidth: "100%",
              wordWrap: "break-word",
              "& img": {
                maxWidth: "100%",
                height: "auto",
                display: "block",
                margin: "1rem 0",
              },
              "& video": {
                maxWidth: "100%",
                height: "auto",
                display: "block",
                margin: "1rem 0",
              },
              "& p.is-editor-empty:first-of-type::before": {
                color: "#adb5bd",
                content: "attr(data-placeholder)",
                float: "left",
                height: 0,
                pointerEvents: "none",
              },
            },
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {editor && <EditorContent editor={editor} />}
        </Box>

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
            disabled={loading || !title || !editorContent.trim()}
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
