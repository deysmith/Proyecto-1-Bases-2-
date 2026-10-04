import { useState } from 'react';
import { Paper, Tab, Tabs, Typography } from '@mui/material';
import EncabezadoPagina from '../components/EncabezadoPagina';
import ReporteGenerico from '../components/ReporteGenerico';
import { reportes } from '../reportes';

function Estadisticas() {
  const [indice, setIndice] = useState(0);
  const reporte = reportes[indice];

  return (
    <>
      <EncabezadoPagina
        titulo="Estadísticas"
        subtitulo="Reportes y datos estadísticos de compras, ventas e inventario."
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={indice}
          onChange={(evento, nuevoIndice) => setIndice(nuevoIndice)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Reportes"
        >
          {reportes.map((item, posicion) => (
            <Tab key={item.id} label={`${posicion + 1}. ${item.titulo}`} />
          ))}
        </Tabs>
      </Paper>

      <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
        {reporte.titulo}
      </Typography>

      {/* El key hace que cada reporte empiece con sus filtros limpios */}
      <ReporteGenerico key={reporte.id} reporte={reporte} />
    </>
  );
}

export default Estadisticas;