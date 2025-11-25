import { MediaInsertBtnsProps } from "../Props";
import { Box, Button, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";

const MediaInsertBtns = ({
  handleContentFileInsert,
  handleOpenYouTubeDialog,
}: MediaInsertBtnsProps) => {
  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        Content
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <input
          accept="image/*"
          style={{ display: "none" }}
          id="image-upload"
          type="file"
          multiple
          onChange={handleContentFileInsert}
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
          style={{ display: "none" }}
          id="video-upload"
          type="file"
          multiple
          onChange={handleContentFileInsert}
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
  );
};

export default MediaInsertBtns;
