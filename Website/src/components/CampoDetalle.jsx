import { Box, Link, Typography } from '@mui/material';

// Un dato con su título pequeño arriba. Si "enlace" es true, el valor se muestra como link
function CampoDetalle({ titulo, valor, enlace }) {
  const hayValor = valor !== null && valor !== undefined && valor !== '';
  let contenido = hayValor ? valor : '—';

  if (enlace && hayValor && String(valor).startsWith('http')) {
    contenido = (
      <Link href={valor} target="_blank" rel="noopener noreferrer">{valor}</Link>
    );
  }

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {titulo}
      </Typography>
      <Typography sx={{ wordBreak: 'break-word' }}>{contenido}</Typography>
    </Box>
  );
}

export default CampoDetalle;