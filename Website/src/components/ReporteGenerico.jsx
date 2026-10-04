import { useEffect, useState } from 'react';
import { Alert, Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { pedir, armarQuery } from '../api';
import { dinero } from '../formato';
import TablaDatos from './TablaDatos';
import Paginacion from './Paginacion';
import SelectorBusqueda from './SelectorBusqueda';

// Crea el objeto de filtros vacío según los filtros que tenga el reporte
function filtrosVacios(reporte) {
  const vacios = {};
  reporte.filtros.forEach((filtro) => {
    vacios[filtro.clave] = filtro.tipo === 'busqueda' ? null : '';
  });
  return vacios;
}

// La matriz por categoría tiene una columna por año, así que sus columnas se arman con los datos
function columnasDinamicas(filas) {
  if (filas.length === 0) return [{ campo: 'vacio', titulo: 'Resultados' }];

  return Object.keys(filas[0]).map((clave, indice) => ({
    campo: clave,
    titulo: indice === 0 ? 'Categoría de productos' : clave,
    alinear: indice === 0 ? 'left' : 'right',
    formato: indice === 0 ? undefined : dinero
  }));
}

function ReporteGenerico({ reporte }) {
  const [filtros, setFiltros] = useState(filtrosVacios(reporte));
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosVacios(reporte));
  const [errores, setErrores] = useState({});
  const [opciones, setOpciones] = useState({});

  const [filas, setFilas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [cantidad, setCantidad] = useState(20);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  // Opciones de los filtros de selección (años, proveedores, categorías...)
  useEffect(() => {
    async function cargarOpciones() {
      try {
        const selectores = reporte.filtros.filter((filtro) => filtro.tipo === 'select');
        const listas = await Promise.all(
          selectores.map((filtro) =>
            typeof filtro.opciones === 'function' ? filtro.opciones() : filtro.opciones
          )
        );

        const resultado = {};
        selectores.forEach((filtro, indice) => {
          resultado[filtro.clave] = listas[indice];
        });
        setOpciones(resultado);
      } catch (e) {
        setError('No se pudieron cargar los filtros. ' + e.message);
      }
    }
    cargarOpciones();
  }, []);

  // Datos del reporte: se vuelven a consultar cuando cambian los filtros o la página
  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setError('');

      try {
        const parametros = {};

        reporte.filtros.forEach((filtro) => {
          const valor = filtrosAplicados[filtro.clave];

          if (filtro.tipo === 'busqueda') {
            parametros[filtro.clave] = valor ? valor[filtro.campoId] : '';
          } else {
            parametros[filtro.clave] = typeof valor === 'string' ? valor.trim() : valor;
          }
        });

        if (reporte.paginado) {
          parametros.pagina = pagina;
          parametros.cantidad = cantidad;
        }

        const respuesta = await pedir(reporte.ruta + armarQuery(parametros));
        setFilas(respuesta.datos);
      } catch (e) {
        setError(e.message);
        setFilas([]);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, [filtrosAplicados, pagina, cantidad, recarga]);

  function aplicarFiltros() {
    const nuevosErrores = reporte.validar ? reporte.validar(filtros) : {};
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setFiltrosAplicados(filtros);
    setPagina(1);
  }

  function restaurarFiltros() {
    setFiltros(filtrosVacios(reporte));
    setFiltrosAplicados(filtrosVacios(reporte));
    setErrores({});
    setPagina(1);
  }

  function cambiarFiltro(clave, valor) {
    setFiltros({ ...filtros, [clave]: valor });
  }

  // Dibuja cada filtro según su tipo: texto libre, selección o búsqueda
  function dibujarFiltro(filtro) {
    if (filtro.tipo === 'texto') {
      return (
        <TextField
          key={filtro.clave}
          label={filtro.etiqueta}
          placeholder="Escriba parte del texto"
          size="small"
          value={filtros[filtro.clave]}
          onChange={(evento) => cambiarFiltro(filtro.clave, evento.target.value)}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
      );
    }

    if (filtro.tipo === 'select') {
      return (
        <TextField
          select
          key={filtro.clave}
          label={filtro.etiqueta}
          size="small"
          value={filtros[filtro.clave]}
          onChange={(evento) => cambiarFiltro(filtro.clave, evento.target.value)}
          error={Boolean(errores[filtro.clave])}
          helperText={errores[filtro.clave]}
          slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
        >
          <MenuItem value="">{filtro.todos || 'Todos'}</MenuItem>
          {(opciones[filtro.clave] || []).map((opcion) => (
            <MenuItem key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <SelectorBusqueda
        key={filtro.clave}
        etiqueta={filtro.etiqueta}
        valor={filtros[filtro.clave]}
        alCambiar={(seleccion) => cambiarFiltro(filtro.clave, seleccion)}
        ruta={filtro.ruta}
        parametro={filtro.parametro}
        campoId={filtro.campoId}
        campoNombre={filtro.campoNombre}
        obligatorio={false}
      />
    );
  }

  const columnas = reporte.columnas || columnasDinamicas(filas);

  return (
    <>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {reporte.descripcion}
      </Typography>

      {reporte.filtros.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            component="form"
            onSubmit={(evento) => {
              evento.preventDefault();
              aplicarFiltros();
            }}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
              alignItems: 'start'
            }}
          >
            {reporte.filtros.map(dibujarFiltro)}

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                gridColumn: { sm: '1 / -1' },
                justifyContent: { md: 'flex-end' }
              }}
            >
              <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
                Consultar
              </Button>
              <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={restaurarFiltros}>
                Restaurar filtros
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setRecarga((valor) => valor + 1)}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <TablaDatos
        columnas={columnas}
        filas={filas}
        cargando={cargando}
        estiloFila={reporte.estiloFila}
      />

      {reporte.paginado && (
        <Paginacion
          pagina={pagina}
          cantidad={cantidad}
          cantidadFilas={filas.length}
          alCambiarPagina={setPagina}
          alCambiarCantidad={(nuevaCantidad) => {
            setCantidad(nuevaCantidad);
            setPagina(1);
          }}
        />
      )}
    </>
  );
}

export default ReporteGenerico;