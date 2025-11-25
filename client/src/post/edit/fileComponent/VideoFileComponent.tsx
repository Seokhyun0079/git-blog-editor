import { CardMedia, Dialog, Box, IconButton, Card } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { FileComponentProps } from "../../Props";

const boxSx = {
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "80vh",
  p: 2,
};

const iconButtonSx = {
  position: "absolute",
  top: 8,
  right: 8,
  color: "white",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
};

const slotProps = {
  paper: {
    sx: {
      boxShadow: "none",
    },
  },
};

const VideoFileComponent = ({ file }: FileComponentProps) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Card>
      <CardMedia
        component="video"
        height="140"
        src={file.url}
        controls
        onError={(e) => console.log("Video load error:", e)}
        onClick={handleClick}
      />
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        slotProps={slotProps}
      >
        <Box sx={boxSx}>
          <IconButton onClick={handleClose} sx={iconButtonSx}>
            <CloseIcon />
          </IconButton>
          <CardMedia
            component="video"
            src={file.url}
            controls
            onError={(e) => console.log("Video load error:", e)}
            onClick={handleClick}
          />
        </Box>
      </Dialog>
    </Card>
  );
};

export default VideoFileComponent;
