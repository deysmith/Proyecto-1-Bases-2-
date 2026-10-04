import {
  CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';

// Componente que muestra una tabla de datos con columnas y filas. Permite seleccionar una fila si se proporciona la función alSeleccionar. Se puede personalizar el estilo de cada fila mediante la función estiloFila.
function TablaDatos({ columnas, filas, cargando, claveFila, alSeleccionar, estiloFila }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="Resultados">
        <TableHead>
          <TableRow>
            {columnas.map((columna) => (
              <TableCell
                key={columna.campo}
                align={columna.alinear || 'left'}
                sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}
              >
                {columna.titulo}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {cargando && (
            <TableRow>
              <TableCell colSpan={columnas.length} align="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </TableCell>
            </TableRow>
          )}

          {!cargando && filas.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnas.length} align="center" sx={{ py: 4 }}>
                No se encontraron resultados con los filtros aplicados.
              </TableCell>
            </TableRow>
          )}

          {!cargando && filas.map((fila, indice) => (
            <TableRow
              hover
              key={claveFila ? fila[claveFila] : indice}
              tabIndex={alSeleccionar ? 0 : undefined}
              onClick={() => alSeleccionar && alSeleccionar(fila)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' && alSeleccionar) alSeleccionar(fila);
              }}
              sx={{
                cursor: alSeleccionar ? 'pointer' : 'default',
                ...(estiloFila ? estiloFila(fila) : {})
              }}
            >
              {columnas.map((columna) => (
                <TableCell key={columna.campo} align={columna.alinear || 'left'}>
                  {columna.formato ? columna.formato(fila[columna.campo], fila) : fila[columna.campo]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TablaDatos;