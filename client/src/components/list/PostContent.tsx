import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Typography, Box, Chip } from "@mui/material";

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PostContent = ({ post }: { post: Post }) => {
  return (
    <Box>
      <Typography
        component="span"
        variant="body2"
        color="textPrimary"
        sx={{ display: "block", mt: 1 }}
      >
        {post.content}
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
          {post.files.map((file, fileIndex) => (
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
