import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Typography, Box, Chip } from "@mui/material";
import { ReactElement } from "react";
import { Post } from "../../type/Post";
import { PostFile } from "../../type/File";

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Function to extract img tags from HTML string and convert them to React elements
const parseContentWithImages = (content: string): ReactElement[] => {
  const parts: ReactElement[] = [];
  // Regex to find img tags (<img src="..." /> or <img src="..."></img> format)
  const imgTagRegex = /<img\s+src=["']([^"']+)["'][^>]*\/?>/gi;
  const imgStyle = {
    maxWidth: "100%",
    height: "auto",
    display: "block",
    margin: "8px 0",
  };
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = imgTagRegex.exec(content)) !== null) {
    // Add text before img tag
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push(<span key={`text-${key++}`}>{textBefore}</span>);
      }
    }

    // Convert img tag to actual image
    const [matchString, imgSrc] = match;
    parts.push(
      <img
        key={`img-${key++}`}
        src={imgSrc}
        alt="Post content"
        style={imgStyle}
      />
    );
    // Update lastIndex to the end position of the matched img tag
    // This allows us to skip already processed content and find the next img tag
    // Also used later to extract text after the last img tag
    lastIndex = match.index + matchString.length;
  }

  // Add text after the last img tag
  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    if (textAfter.trim()) {
      parts.push(<span key={`text-${key++}`}>{textAfter}</span>);
    }
  }

  // Return original text if no img tags found
  if (parts.length === 0) {
    parts.push(<span key="text-0">{content}</span>);
  }

  return parts;
};

const PostContent = ({ post }: { post: Post }) => {
  const contentParts = parseContentWithImages(post.content);

  return (
    <Box>
      <Typography
        component="span"
        variant="body2"
        color="textPrimary"
        sx={{ display: "block", mt: 1 }}
      >
        {contentParts}
      </Typography>
      <Typography
        component="span"
        variant="caption"
        color="textSecondary"
        sx={{ display: "block", mt: 1 }}
      >
        Created: {formatDate(post.createdAt)}
      </Typography>
      {post.files && post.files.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {post.files.map((file: PostFile, fileIndex: number) => (
            <Chip
              key={fileIndex}
              icon={<InsertDriveFileIcon />}
              label={file.name}
              size="small"
              sx={{ mr: 1, mt: 1 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
export default PostContent;
