import { Box, CircularProgress } from "@mui/material";
import "./loading.scss";
const Loading = ({ show }: { show: boolean }) => {
  if (!show) return null;
  return (
    <Box className="loading-container">
      <CircularProgress />
    </Box>
  );
};

export default Loading;
