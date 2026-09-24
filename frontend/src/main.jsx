import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2f6fed' },
    secondary: { main: '#7c3aed' },
    background: { default: '#f5f7fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
