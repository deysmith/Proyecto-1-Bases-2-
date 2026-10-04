import { Box, IconButton, MenuItem, Select, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function Paginacion({ pagina, cantidad, cantidadFilas, alCambiarPagina, alCambiarCantidad }) {
  const esUltima = cantidadFilas < cantidad;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        py: 1.5
      }}
    >
      <Typography variant="body2">Filas por página:</Typography>
      <Select
        size="small"
        value={cantidad}
        onChange={(evento) => alCambiarCantidad(Number(evento.target.value))}
        inputProps={{ 'aria-label': 'Filas por página' }}
      >
        {[10, 20, 50].map((numero) => (
          <MenuItem key={numero} value={numero}>{numero}</MenuItem>
        ))}
      </Select>

      <Typography variant="body2">Página {pagina}</Typography>

      <Box>
        <IconButton
          aria-label="Página anterior"
          disabled={pagina === 1}
          onClick={() => alCambiarPagina(pagina - 1)}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          aria-label="Página siguiente"
          disabled={esUltima}
          onClick={() => alCambiarPagina(pagina + 1)}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default Paginacion;