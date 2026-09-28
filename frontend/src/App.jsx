import React from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(12px)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>EventFlow</Typography>
          <Button color="primary" variant="contained">Open Dashboard</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>Event Management Platform</Typography>
        <Typography color="text.secondary">Frontend shell initialized. Next batches will include the full dashboard, events, calendar, API integration, and management screens.</Typography>
      </Container>
    </Box>
  );
}
