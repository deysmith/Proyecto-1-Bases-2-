import {
  CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';

// columnas: [{ campo: 'CustomerName', titulo: 'Cliente', alinear: 'left' | 'right', formato: (valor) => ... }]
function TablaDatos({ columnas, filas, cargando, claveFila, alSeleccionar }) {
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

          {!cargando && filas.map((fila) => (
            <TableRow
              hover
              key={fila[claveFila]}
              tabIndex={0}
              onClick={() => alSeleccionar && alSeleccionar(fila)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' && alSeleccionar) alSeleccionar(fila);
              }}
              sx={{ cursor: alSeleccionar ? 'pointer' : 'default' }}
            >
              {columnas.map((columna) => (
                <TableCell key={columna.campo} align={columna.alinear || 'left'}>
                  {columna.formato ? columna.formato(fila[columna.campo]) : fila[columna.campo]}
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