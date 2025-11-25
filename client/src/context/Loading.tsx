import { Box, CircularProgress } from "@mui/material";
import styles from "./Loading.module.scss";
const Loading = ({ show }: { show: boolean }) => {
  if (!show) return null;
  return (
    <Box className={styles.loadingContainer}>
      <CircularProgress />
    </Box>
  );
};

export default Loading;
