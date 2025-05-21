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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts');
      setPosts(response.data.data);
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GitHub Blog Editor
          </Typography>
          <Button
            color="inherit"
            onClick={() => setShowEditor(!showEditor)}
          >
            {showEditor ? '목록 보기' : '새 글 작성'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : showEditor ? (
          <PostEditor onPostCreated={handlePostCreated} />
        ) : (
          <PostList posts={posts} />
        )}
      </Container>
    </Box>
  );
}

export default App;
