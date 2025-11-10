import { Paper, Typography } from "@mui/material";

const EmptyPage = () => {
  return (
    <Paper sx={{ p: 3, textAlign: "center" }}>
      <Typography color="textSecondary">
        No posts have been written yet.
      </Typography>
    </Paper>
  );
};
export default EmptyPage;
