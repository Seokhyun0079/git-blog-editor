import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
  DialogActions,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";

interface YoutubeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

// Validate YouTube URL
const isValidYouTubeUrl = (url: string): string | null => {
  const videoId = extractYouTubeVideoId(url);
  return videoId;
};

// Extract video ID from YouTube URL
const extractYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const YoutubeDialog = ({ open, onClose, onConfirm }: YoutubeDialogProps) => {
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>("");
  const getClipboardText = async (): Promise<void> => {
    try {
      // Read text from clipboard
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && isValidYouTubeUrl(clipboardText)) {
        setYoutubeUrlInput(clipboardText);
      } else {
        setYoutubeUrlInput("");
      }
    } catch (error) {
      // Failed to access clipboard or invalid URL
      console.log("Failed to access clipboard or invalid URL:", error);
      setYoutubeUrlInput("");
    }
  };

  useEffect(() => {
    (async () => {
      if (!open) return;
      await getClipboardText();
    })();
  }, [open]);

  const handleConfirm = (): void => {
    const videoId = isValidYouTubeUrl(youtubeUrlInput);
    if (!!videoId) {
      onConfirm(videoId);
    } else {
      alert("is not valid youtube url.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enter YouTube Video URL</DialogTitle>
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
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          Supported URL formats: youtube.com/watch?v=..., youtu.be/...,
          youtube.com/embed/...
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!youtubeUrlInput.trim()}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default YoutubeDialog;
