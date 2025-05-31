import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Button,
  CircularProgress
} from '@mui/material';
import PostEditor from './components/PostEditor';
import PostList from './components/PostList';
import axios from 'axios';

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts');
      setPosts(response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    setShowEditor(false);
    fetchPosts();
  };

  const handlePostDelete = () => {
    fetchPosts();
  };

  const handlePostClick = (post) => {
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
              setSelectedPost(null)
              setShowEditor(!showEditor)
            }}
          >
            {showEditor ? 'View List' : 'New Post'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : showEditor ? (
          <PostEditor onPostCreated={handlePostCreated} selectedPost={selectedPost} />
        ) : (
          <PostList posts={posts} onDelete={handlePostDelete} onPostClick={handlePostClick} />
        )}
      </Container>
    </Box>
  );
}

export default App;
