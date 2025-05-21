import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const PostList = ({ posts }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        블로그 포스트
      </Typography>

      {posts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            아직 작성된 포스트가 없습니다.
          </Typography>
        </Paper>
      ) : (
        <List>
          {posts.map((post, index) => (
            <Paper key={index} sx={{ mb: 2 }}>
              <ListItem alignItems="flex-start">
                <ListItemText
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
                        작성일: {formatDate(post.createdAt)}
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
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
};

export default PostList; 