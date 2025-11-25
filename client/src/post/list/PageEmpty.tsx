import { Paper, Typography } from "@mui/material";

const PageEmpty = () => {
  return (
    <Paper sx={{ p: 3, textAlign: "center" }}>
      <Typography color="textSecondary">
        No posts have been written yet.
      </Typography>
    </Paper>
  );
};
export default PageEmpty;
