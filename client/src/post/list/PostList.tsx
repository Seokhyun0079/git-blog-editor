import React from "react";
import { List, Typography, Box } from "@mui/material";
import PostPreivew from "./PostPreview";
import EmptyPage from "./EmptyPage";
interface PostListProps {
  posts: Post[];
  show: boolean;
}

const PostList: React.FC<PostListProps> = ({ show, posts }) => {
  if (!show) return null;
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Blog Posts
      </Typography>
      {posts.length === 0 ? (
        <EmptyPage />
      ) : (
        <List>
          {posts.map((post) => (
            <PostPreivew key={post.id} post={post} />
          ))}
        </List>
      )}
    </Box>
  );
};

export default PostList;
