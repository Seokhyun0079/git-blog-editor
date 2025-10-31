import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Button,
  CircularProgress,
} from "@mui/material";
import PostEditor from "./components/PostEditor";
import PostList from "./components/list/PostList";
import axios from "axios";
import { FILE_STATUS } from "./type/File";

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  files?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  contentFiles?: Array<{
    id: string;
    name: string;
    url: string;
    uuid: string;
    status?: string;
  }>;
}

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (): Promise<void> => {
    try {
      const response = await axios.get("http://localhost:5000/api/posts");
      setPosts(
        response.data.data.sort(
          (a: Post, b: Post) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
    }
  };

  const handlePostCreated = (): void => {
    setShowEditor(false);
    fetchPosts();
  };

  const handlePostDelete = (): void => {
    fetchPosts();
  };

  const handlePostClick = (post: Post): void => {
    post.contentFiles = post.contentFiles?.map((contentFile) => {
      return {
        ...contentFile,
        status: FILE_STATUS.UPLOADED,
      };
    });
    setSelectedPost(post);
    setShowEditor(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GitHub Blog Editor
          </Typography>
          <Button
            color="inherit"
            onClick={() => {
              setSelectedPost(null);
              setShowEditor(!showEditor);
            }}
          >
            {showEditor ? "View List" : "New Post"}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : showEditor ? (
          <PostEditor
            onPostCreated={handlePostCreated}
            selectedPost={selectedPost}
          />
        ) : (
          <PostList
            posts={posts}
            onDelete={handlePostDelete}
            onPostClick={handlePostClick}
          />
        )}
      </Container>
    </Box>
  );
}

export default App;
