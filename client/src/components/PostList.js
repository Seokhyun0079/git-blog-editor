import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';

import axios from 'axios';

const PostList = ({ posts, onDelete, onPostClick }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeletePost = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`);
      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };


  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Blog Posts
      </Typography>

      {posts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No posts have been written yet.
          </Typography>
        </Paper>
      ) : (
        <List>
          {posts.map((post, index) => (
            <Paper key={index} sx={{ mb: 2 }}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  onClick={() => onPostClick(post)}
                  primary={
                    <Typography variant="h6" component="div">
                      {post.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography
                        component="span"
                        variant="body2"
                        color="textPrimary"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        {post.content}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: 'block', mt: 1 }}
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
                  }
                />
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeletePost(post.id)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
};

export default PostList; 