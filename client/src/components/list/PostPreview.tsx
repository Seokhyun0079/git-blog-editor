import {
  ListItem,
  ListItemText,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PostContent from "./PostContent";
import axios from "axios";
import { useState } from "react";

interface PostPreivewProps {
  post: Post;
  onPostClick: (post: Post) => void;
  onDelete: (id: string) => void;
}

const computePrimary = (
  open: boolean,
  post: Post,
  setOpen: (open: boolean) => void
): React.ReactNode => {
  const style = { display: "flex", alignItems: "center" };

  const onIconClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setOpen(!open);
  };

  return (
    <div style={style}>
      <IconButton size="small" sx={{ ml: 1 }} onClick={onIconClick}>
        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </IconButton>
      <Typography variant="h6" component="div">
        {post.title}
      </Typography>
    </div>
  );
};

const PostPreivew = ({ post, onPostClick, onDelete }: PostPreivewProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleDeletePost = async (id: string): Promise<void> => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`);
      onDelete(id);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleOpen = () => {
    if (onPostClick) {
      onPostClick(post);
    }
  };

  return (
    <Paper sx={{ mb: 2 }}>
      <ListItem alignItems="flex-start">
        <ListItemText
          onClick={handleOpen}
          primary={computePrimary(open, post, setOpen)}
          secondary={open && <PostContent post={post} />}
        />
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => handleDeletePost(post.id)}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon />
        </IconButton>
      </ListItem>
    </Paper>
  );
};
export default PostPreivew;
