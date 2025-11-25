import { Box, Card, CardActions, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { FileListProps } from "../Props";
import FileComponent from "./fileComponent/FileComponent";
const boxSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    md: "repeat(3, 1fr)",
  },
  gap: 2,
};
const FileList = ({ label, files, handleRemoveFile }: FileListProps) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}:
      </Typography>
      <Box sx={boxSx}>
        {files.map((file, index) => (
          <Card key={index}>
            <FileComponent file={file} />
            <CardActions>
              <Typography variant="caption" sx={{ flexGrow: 1 }}>
                {file.id || file.name}
              </Typography>
              <IconButton size="small" onClick={() => handleRemoveFile(index)}>
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default FileList;
