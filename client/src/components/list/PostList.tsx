import React from "react";
import { List, Paper, Typography, Box } from "@mui/material";
import PostPreivew from "./PostPreview";
import EmptyPage from "./EmptyPage";
interface PostListProps {
  posts: Post[];
  onDelete: (id: string) => void;
  onPostClick: (post: Post) => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  onDelete,
  onPostClick,
}) => {
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
            <PostPreivew
              key={post.id}
              post={post}
              onPostClick={onPostClick}
              onDelete={onDelete}
            />
          ))}
        </List>
      )}
    </Box>
  );
};

export default PostList;
