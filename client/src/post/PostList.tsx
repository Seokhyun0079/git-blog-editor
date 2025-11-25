import React from "react";
import { List, Typography, Box } from "@mui/material";
import PostPreivew from "./list/PostPreview";
import PageEmpty from "./list/PageEmpty";
import { PostListProps } from "./Props";

const PostList = ({ show, posts }: PostListProps) => {
  if (!show) return null;
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Blog Posts
      </Typography>
      {posts.length === 0 ? (
        <PageEmpty />
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
