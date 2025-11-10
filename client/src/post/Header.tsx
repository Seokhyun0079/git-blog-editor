import { Typography, AppBar, Toolbar, Button } from "@mui/material";
interface HeaderProps {
  showEditor: boolean;
  clickButton: () => void;
}

const Header = ({ showEditor, clickButton }: HeaderProps) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GitHub Blog Editor
        </Typography>
        <Button color="inherit" onClick={clickButton}>
          {showEditor ? "View List" : "New Post"}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
