import { CardMedia, Dialog, Box, IconButton, Card } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { FileComponentProps } from "../../Props";

const cardMediaSx = {
  height: 140,
  objectFit: "cover",
  cursor: "pointer",
};

const BoxSx = {
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "80vh",
  p: 2,
};

const IconButtonSx = {
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

const ImageFileComponent = ({ file }: FileComponentProps) => {
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
        component="img"
        image={file.url}
        alt={file.name || "Image"}
        sx={cardMediaSx}
        onClick={handleClick}
        onError={(e) => console.log("Image load error:", e)}
      />
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        slotProps={slotProps}
      >
        <Box sx={BoxSx}>
          <IconButton onClick={handleClose} sx={IconButtonSx}>
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={file.url}
            alt={file.name || "Image"}
            sx={{
              objectFit: "contain",
            }}
            onError={(e) => console.log("Image load error:", e)}
          />
        </Box>
      </Dialog>
    </Card>
  );
};

export default ImageFileComponent;
