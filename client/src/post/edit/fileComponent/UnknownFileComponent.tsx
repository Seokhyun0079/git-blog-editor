import React from "react";
import { Box, Typography } from "@mui/material";
import { FileComponentProps } from "../../Props";

const UnknownFileComponent = ({ file }: FileComponentProps) => {
  return (
    <Box
      height={140}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="grey.200"
    >
      <Typography variant="body2" color="text.secondary">
        Unknown file type
      </Typography>
    </Box>
  );
};

export default UnknownFileComponent;
