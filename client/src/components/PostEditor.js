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
  IconButton,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import axios from 'axios';

// 파일 확장자 추출 함수
const getFileExtension = (filename) => {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
};

// YouTube URL에서 비디오 ID 추출 함수
const extractYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// YouTube URL 유효성 검사 함수
const isValidYouTubeUrl = (url) => {
  const videoId = extractYouTubeVideoId(url);
  return videoId;
};

const PostEditor = ({ onPostCreated, selectedPost }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [contentFiles, setContentFiles] = useState([]); // 미리보기용 base64 캐싱
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');

  // YouTube 팝업창 열기 함수
  const handleOpenYouTubeDialog = async () => {
    try {
      // 클립보드에서 텍스트 읽기
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && isValidYouTubeUrl(clipboardText)) {
        setYoutubeUrlInput(clipboardText);
      } else {
        setYoutubeUrlInput('');
      }
    } catch (error) {
      // 클립보드 접근이 실패하거나 유효하지 않은 URL인 경우
      console.log('클립보드 접근 실패 또는 유효하지 않은 URL:', error);
      setYoutubeUrlInput('');
    }
    setYoutubeDialogOpen(true);
  };

  // YouTube 팝업창 닫기 함수
  const handleCloseYouTubeDialog = () => {
    setYoutubeDialogOpen(false);
    setYoutubeUrlInput('');
  };

  // YouTube URL 확인 함수
  const handleConfirmYouTubeUrl = () => {
    const videoId = isValidYouTubeUrl(youtubeUrlInput);
    if (!!videoId) {
      const youtubeVideoUrl = "https://www.youtube.com/embed/" + videoId;
      setYoutubeVideoUrl(youtubeVideoUrl);
      setYoutubeDialogOpen(false);
      setYoutubeUrlInput('');
      setContent(prev => prev + '\n' + `<yotube src="${youtubeVideoUrl}">` + '\n');
    } else {
      alert('is not valid youtube url.');
    }
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleContentFileInsert = (event, fileType) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const uuid = crypto.randomUUID();

      // 실제 파일의 MIME 타입을 확인하여 정확한 타입 설정
      let actualType = 'image';
      if (file.type.startsWith('video/')) {
        actualType = 'video';
      } else if (file.type.startsWith('image/')) {
        actualType = 'image';
      }

      const tag = actualType === 'image'
        ? `<img src="${uuid}"/>`
        : `<video src="${uuid}"/>`;

      setContent(prev => prev + '\n' + tag + '\n');

      // 파일에 UUID 속성 추가
      const fileWithUuid = {
        ...file,
        uuid: uuid,
        type: actualType,
        name: uuid + getFileExtension(event.target.value)
      };

      setFiles(prev => [...prev, fileWithUuid]);

      // base64로 변환하여 미리보기용 캐싱
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewFile = {
          ...fileWithUuid,
          previewUrl: e.target.result
        };
        console.log('previewFile', previewFile);
        setContentFiles(prev => [...prev, previewFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveContentFile = (index) => {
    const fileToRemove = files[index];
    if (fileToRemove.uuid) {
      // 콘텐츠에서 해당 UUID 태그 제거
      const tagToRemove = fileToRemove.type === 'image'
        ? `<img src="${fileToRemove.uuid}"/>`
        : `<video src="${fileToRemove.uuid}"/>`;

      setContent(prev => prev.replace(tagToRemove, ''));
    }

    // 파일 목록에서 제거
    setFiles(prev => prev.filter((_, i) => i !== index));

    // 미리보기 목록에서도 제거
    setContentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const uuid = crypto.randomUUID();
        const tag = `<img src="${uuid}"/>`;
        setContent(prev => prev + '\n' + tag + '\n');

        const fileWithUuid = {
          ...file,
          uuid: uuid,
          type: 'image'
        };
        setFiles(prev => [...prev, fileWithUuid]);

        // base64로 변환하여 미리보기용 캐싱
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewFile = {
            ...fileWithUuid,
            previewUrl: e.target.result
          };
          setContentFiles(prev => [...prev, previewFile]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const uuid = crypto.randomUUID();
        const tag = `<video src="${uuid}"/>`;
        setContent(prev => prev + '\n' + tag + '\n');

        const fileWithUuid = {
          ...file,
          uuid: uuid,
          type: 'video'
        };
        setFiles(prev => [...prev, fileWithUuid]);

        // base64로 변환하여 미리보기용 캐싱
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewFile = {
            ...fileWithUuid,
            previewUrl: e.target.result
          };
          setContentFiles(prev => [...prev, previewFile]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (youtubeVideoUrl) {
        formData.append('youtubeVideoUrl', youtubeVideoUrl);
      }
      console.log('contentFiles', contentFiles);
      // UUID가 있는 파일들만 contentFiles로 전송
      // const contentFiles = files.filter(file => file.uuid);
      const attachedFiles = files.filter(file => !file.uuid);
      //애초에 previewUrl이 비어있었음
      if (contentFiles.length > 0) {
        const contentFilesForUpload = contentFiles.map(file => {
          //중요:어째선지 previewUrl이 비어있었음
          return {
            name: file.name,
            base64: file.previewUrl,
            uuid: file.uuid,
            type: file.type
          };
        });
        formData.append('contentFiles', JSON.stringify(contentFilesForUpload));
      }

      attachedFiles.forEach(file => {
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
        setContentFiles([]);
        setYoutubeVideoUrl('');
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
      setFiles(selectedPost.files || []);
      // selectedPost.files가 이미 base64 미리보기 URL을 포함하고 있을 수 있으므로 처리
      setContentFiles(selectedPost.files || []);
      setYoutubeVideoUrl(selectedPost.youtubeVideoUrl || '');
    }
  }, [selectedPost]);

  // UUID가 있는 파일들 (콘텐츠에 삽입된 미디어)
  const contentFilesWithUuid = files.filter(file => file.uuid);
  // UUID가 없는 파일들 (일반 첨부 파일)
  const attachedFiles = files.filter(file => !file.uuid);

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

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Content
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              multiple
              onChange={(e) => handleContentFileInsert(e, 'image')}
            />
            <label htmlFor="image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<ImageIcon />}
                size="small"
              >
                Insert Image
              </Button>
            </label>

            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="video-upload"
              type="file"
              multiple
              onChange={(e) => handleContentFileInsert(e, 'video')}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<VideoLibraryIcon />}
                size="small"
              >
                Insert Video
              </Button>
            </label>

            <Button
              variant="outlined"
              component="span"
              startIcon={<VideoLibraryIcon />}
              size="small"
              onClick={handleOpenYouTubeDialog}
            >
              Insert Youtube Video
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          margin="normal"
          required
          multiline
          rows={6}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: dragOver ? '2px dashed #1976d2' : 'none',
            backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
          }}
        />

        {dragOver && (
          <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
            파일을 여기에 드롭하여 삽입하세요
          </Typography>
        )}

        {/* YouTube 비디오 정보 표시 */}
        {youtubeVideoUrl && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <iframe
              width="560"
              height="315"
              src={`${youtubeVideoUrl}`}
              frameborder="0"
              allowfullscreen>
            </iframe>
            <Typography variant="subtitle2" gutterBottom>
              YouTube Video:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {youtubeVideoUrl}
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={() => setYoutubeVideoUrl('')}
              sx={{ mt: 1 }}
            >
              제거
            </Button>
          </Box>
        )}

        {contentFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Inserted Media Files:
            </Typography>
            <Grid container spacing={2}>
              {contentFiles.map((file, index) => {
                // base64 캐시된 미리보기 URL 사용
                const fileUrl = file.previewUrl || '';

                // 파일 타입을 더 정확하게 확인
                const isImage = file.type === 'image' || (file.type && file.type.startsWith('image/'));
                const isVideo = file.type === 'video' || (file.type && file.type.startsWith('video/'));

                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      {isImage ? (
                        <CardMedia
                          component="img"
                          height="140"
                          image={fileUrl}
                          alt={file.name || 'Image'}
                          sx={{ objectFit: 'cover' }}
                          onError={(e) => console.log('Image load error:', e)}
                        />
                      ) : isVideo ? (
                        <CardMedia
                          component="video"
                          height="140"
                          src={fileUrl}
                          controls
                          onError={(e) => console.log('Video load error:', e)}
                        />
                      ) : (
                        <Box
                          height={140}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          bgcolor="grey.200"
                        >
                          <Typography variant="body2" color="text.secondary">
                            Unknown file type
                          </Typography>
                        </Box>
                      )}
                      <CardActions>
                        <Typography variant="caption" sx={{ flexGrow: 1 }}>
                          {file.uuid || file.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveContentFile(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Attached Files:
          </Typography>
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

        {attachedFiles.length > 0 && (
          <List>
            {attachedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                />
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

      {/* YouTube URL 입력 팝업창 */}
      <Dialog
        open={youtubeDialogOpen}
        onClose={handleCloseYouTubeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>YouTube 비디오 URL 입력</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            fullWidth
            variant="outlined"
            value={youtubeUrlInput}
            onChange={(e) => setYoutubeUrlInput(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            지원되는 URL 형식: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseYouTubeDialog}>취소</Button>
          <Button
            onClick={handleConfirmYouTubeUrl}
            variant="contained"
            disabled={!youtubeUrlInput.trim()}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PostEditor; 