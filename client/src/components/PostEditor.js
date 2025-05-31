import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const PostEditor = ({ onPostCreated, selectedPost }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      files.forEach(file => {
        formData.append('files', file);
      });
      let response;
      if (selectedPost) {
        formData.append('id', selectedPost.id);
        response = await axios.put(`http://localhost:5000/api/posts/${selectedPost.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axios.post('http://localhost:5000/api/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      }


      if (response.data.success) {
        setTitle('');
        setContent('');
        setFiles([]);
        onPostCreated();
      } else {
        throw new Error(response.data.error || 'An error occurred while creating the post.');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'An error occurred while creating the post.');
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPost) {
      setTitle(selectedPost.title);
      setContent(selectedPost.content);
      setFiles(selectedPost.files);
    }
  }, [selectedPost]);

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Create New Post
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          margin="normal"
          required
          multiline
          rows={6}
        />

        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Attach Files
            </Button>
          </label>
        </Box>

        {files.length > 0 && (
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !title || !content}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default PostEditor; 