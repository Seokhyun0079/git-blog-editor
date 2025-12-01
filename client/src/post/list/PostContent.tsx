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

// Media tag parser interface
interface MediaTagParser {
  tagName: string;
  supportsClosingTag: boolean;
  parse(
    content: string,
    startKey: number
  ): {
    processedContent: string;
    placeholders: { placeholder: string; element: ReactElement }[];
    nextKey: number;
  };
}

// Base media tag parser class
abstract class BaseMediaTagParser implements MediaTagParser {
  abstract tagName: string;
  abstract supportsClosingTag: boolean;

  protected abstract createElement(src: string, key: number): ReactElement;

  parse(
    content: string,
    startKey: number
  ): {
    processedContent: string;
    placeholders: { placeholder: string; element: ReactElement }[];
    nextKey: number;
  } {
    const placeholders: {
      placeholder: string;
      element: ReactElement;
    }[] = [];
    let key = startKey;

    // Build regex pattern: self-closing or with closing tag
    const pattern = this.supportsClosingTag
      ? new RegExp(
          `<${this.tagName}\\s+src=["']([^"']+)["'][^>]*(\\/>|>[\\s\\S]*?<\\/${this.tagName}>)`,
          "gi"
        )
      : new RegExp(`<${this.tagName}\\s+src=["']([^"']+)["'][^>]*\\/?>`, "gi");

    const processedContent = content.replace(pattern, (match, src) => {
      const placeholder = `__MEDIA_PLACEHOLDER_${key}__`;
      placeholders.push({
        placeholder,
        element: this.createElement(src, key),
      });
      key++;
      return placeholder;
    });

    return { processedContent, placeholders, nextKey: key };
  }
}

// Image tag parser
class ImageParser extends BaseMediaTagParser {
  tagName = "img";
  supportsClosingTag = false;

  private imgStyle = {
    maxWidth: "100%",
    width: "100%",
    height: "auto",
    display: "block",
    margin: "8px 0",
  };

  protected createElement(src: string, key: number): ReactElement {
    return (
      <img
        key={`img-${key}`}
        src={src}
        alt="Post content"
        style={this.imgStyle}
      />
    );
  }
}

// Video tag parser
class VideoParser extends BaseMediaTagParser {
  tagName = "video";
  supportsClosingTag = true;

  private videoStyle = {
    maxWidth: "100%",
    width: "100%",
    height: "auto",
    display: "block",
    margin: "8px 0",
    borderRadius: "8px",
  };

  protected createElement(src: string, key: number): ReactElement {
    return (
      <video key={`video-${key}`} src={src} controls style={this.videoStyle} />
    );
  }
}

// YouTube tag parser
class YoutubeParser extends BaseMediaTagParser {
  tagName = "youtube";
  supportsClosingTag = true;

  private youtubeStyle = {
    width: "100%",
    maxWidth: "100%",
    aspectRatio: "16/9",
    display: "block",
    margin: "8px 0",
    border: "none",
  };

  private extractYoutubeId(src: string): string {
    if (src.includes("youtube.com/watch?v=")) {
      return src.split("v=")[1]?.split("&")[0] || src;
    }
    if (src.includes("youtu.be/")) {
      return src.split("youtu.be/")[1]?.split("?")[0] || src;
    }
    return src;
  }

  protected createElement(src: string, key: number): ReactElement {
    const youtubeId = this.extractYoutubeId(src);
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
    return (
      <iframe
        key={`youtube-${key}`}
        src={embedUrl}
        title="YouTube video"
        style={this.youtubeStyle}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
}

// Media tag factory
class MediaTagFactory {
  private static parsers: Map<string, MediaTagParser> = new Map<
    string,
    MediaTagParser
  >([
    ["img", new ImageParser()],
    ["video", new VideoParser()],
    ["youtube", new YoutubeParser()],
  ]);

  static getParser(tagName: string): MediaTagParser | undefined {
    return this.parsers.get(tagName.toLowerCase());
  }

  static getAllParsers(): MediaTagParser[] {
    return Array.from(this.parsers.values());
  }
}

// Function to extract img, video, and youtube tags from HTML string and convert them to React elements
// Also removes other HTML tags and extracts only text content
const parseContentWithMedia = (content: string): ReactElement[] => {
  const parts: ReactElement[] = [];

  let processedContent = content;
  const mediaPlaceholders: { placeholder: string; element: ReactElement }[] =
    [];
  let key = 0;

  // Use factory to get all parsers and process each tag type
  const parsers = MediaTagFactory.getAllParsers();
  parsers.forEach((parser) => {
    const result = parser.parse(processedContent, key);
    processedContent = result.processedContent;
    mediaPlaceholders.push(...result.placeholders);
    key = result.nextKey;
  });

  // Remove all remaining HTML tags (including closing tags like </video>, </p>, etc.)
  processedContent = processedContent.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  const textArea = document.createElement("textarea");
  textArea.innerHTML = processedContent;
  processedContent = textArea.value;

  // Split by placeholders and reconstruct
  const segments = processedContent.split(/(__MEDIA_PLACEHOLDER_\d+__)/);

  segments.forEach((segment, index) => {
    if (segment.match(/^__MEDIA_PLACEHOLDER_\d+__$/)) {
      const placeholderIndex = parseInt(segment.match(/\d+/)![0]);
      if (mediaPlaceholders[placeholderIndex]) {
        parts.push(
          <span key={`media-${placeholderIndex}`}>
            {mediaPlaceholders[placeholderIndex].element}
          </span>
        );
      }
    } else if (segment.trim()) {
      parts.push(<span key={`text-${index}`}>{segment}</span>);
    }
  });

  // Return original text if no content found
  if (parts.length === 0) {
    parts.push(<span key="text-0">{content.replace(/<[^>]*>/g, "")}</span>);
  }

  return parts;
};

const PostContent = ({ post }: { post: Post }) => {
  const contentParts = parseContentWithMedia(post.content);

  return (
    <Box sx={{ overflow: "hidden", wordBreak: "break-word" }}>
      <Typography
        component="span"
        variant="body2"
        color="textPrimary"
        sx={{ display: "block", mt: 1, overflow: "hidden" }}
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
