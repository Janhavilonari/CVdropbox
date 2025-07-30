import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import App from './App';

const theme = createTheme({
  palette: { mode: 'light' },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 24 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' } } },
  },
});

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <ThemeProvider theme={theme}>
    <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
      <CssBaseline />
      <App />
    </SnackbarProvider>
  </ThemeProvider>
); 