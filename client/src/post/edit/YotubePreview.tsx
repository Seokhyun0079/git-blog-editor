import { useState } from "react";
import { YoutubePreviewProps } from "../Props";
import { Box, Button, Typography, IconButton } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import styles from "./YotubePreview.module.scss";

const YoutubePreview = ({
  youtubeVideoUrls,
  setYoutubeVideoUrls,
}: YoutubePreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (youtubeVideoUrls.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? youtubeVideoUrls.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === youtubeVideoUrls.length - 1 ? 0 : prev + 1
    );
  };

  const handleRemove = () => {
    const newUrls = youtubeVideoUrls.filter(
      (_, index) => index !== currentIndex
    );
    setYoutubeVideoUrls(newUrls);
    if (newUrls.length > 0) {
      setCurrentIndex((prev) => Math.min(prev, newUrls.length - 1));
    }
  };

  return (
    <Box className={styles.youtubePreview}>
      <Box className={styles.youtubePreviewContainer}>
        {youtubeVideoUrls.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              className={`${styles.youtubePreviewNavButton} ${styles.youtubePreviewNavButtonPrev}`}
            >
              <ArrowBackIosIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              className={`${styles.youtubePreviewNavButton} ${styles.youtubePreviewNavButtonNext}`}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </>
        )}
        <Box
          className={styles.youtubePreviewSlider}
          sx={{
            width: `${youtubeVideoUrls.length * 560}px`,
            transform: `translateX(-${currentIndex * 560}px)`,
          }}
        >
          {youtubeVideoUrls.map((url, index) => (
            <iframe
              key={index}
              title={url}
              width="560"
              height="315"
              src={url}
              allowFullScreen
              style={{ flexShrink: 0 }}
            ></iframe>
          ))}
        </Box>
      </Box>
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        YouTube Video ({currentIndex + 1}/{youtubeVideoUrls.length}):
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {youtubeVideoUrls[currentIndex]}
      </Typography>
      <Button size="small" color="error" onClick={handleRemove} sx={{ mt: 1 }}>
        Remove
      </Button>
    </Box>
  );
};

export default YoutubePreview;
