import React from "react";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useTheme } from "./theme/useTheme";
import { HealthCheck } from "./components/HealthCheck";
import "./App.css";

// Main app content component
const AppContent: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meeting Summarizer
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom align="center">
            Meeting Summarizer
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            align="center"
            color="text.secondary"
          >
            AI-Powered Meeting Transcription and Summarization
          </Typography>

          <HealthCheck />
        </Box>
      </Container>
    </>
  );
};

// Main app component with theme provider
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
