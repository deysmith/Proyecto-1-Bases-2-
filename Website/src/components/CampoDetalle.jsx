import { Link as RouterLink } from 'react-router-dom';
import { Box, Link, Typography } from '@mui/material';

// Componente que muestra un campo de detalle con su título y valor correspondiente. Si se proporciona un enlace o una ruta, el valor se mostrará como un enlace clicable.
function CampoDetalle({ titulo, valor, enlace, ruta }) {
  const hayValor = valor !== null && valor !== undefined && valor !== '';
  let contenido = hayValor ? valor : '—';

  if (ruta && hayValor) {
    contenido = <Link component={RouterLink} to={ruta}>{valor}</Link>;
  } else if (enlace && hayValor && String(valor).startsWith('http')) {
    contenido = <Link href={valor} target="_blank" rel="noopener noreferrer">{valor}</Link>;
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