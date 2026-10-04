import { Box, Typography } from '@mui/material';

// Título de cada página. "accion" es un botón opcional (por ejemplo "Nuevo cliente")
function EncabezadoPagina({ titulo, subtitulo, accion }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3
      }}
    >
      <Box>
        <Typography variant="h4" component="h1">{titulo}</Typography>
        <Typography color="text.secondary">{subtitulo}</Typography>
      </Box>
      {accion}
    </Box>
  );
}

export default EncabezadoPagina;