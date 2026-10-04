import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, MenuItem, Paper, TextField, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { pedir, armarQuery } from '../api';
import { dinero, entero } from '../formato';
import EncabezadoPagina from '../components/EncabezadoPagina';
import TablaDatos from '../components/TablaDatos';
import Paginacion from '../components/Paginacion';
import Aviso from '../components/Aviso';
import ConfirmarDialogo from '../components/ConfirmarDialogo';
import CampoDetalle from '../components/CampoDetalle';
import ProductoFormulario from '../components/ProductoFormulario';

const filtrosVacios = { nombre: '', grupoId: '', cantidadMinima: '', cantidadMaxima: '' };

const columnas = [
  { campo: 'StockItemName', titulo: 'Producto' },
  { campo: 'Group', titulo: 'Grupo', formato: (valor) => valor || 'Sin grupo' },
  { campo: 'QuantityOnHand', titulo: 'Cantidad en inventario', alinear: 'right', formato: entero }
];

function Inventario() {
  const [parametros, setParametros] = useSearchParams();

  // Filtros: "filtros" es lo que el usuario escribe, "filtrosAplicados" es lo que se consultó
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosVacios);
  const [errorCantidad, setErrorCantidad] = useState('');
  const [grupos, setGrupos] = useState([]);

  // Tabla
  const [filas, setFilas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [cantidad, setCantidad] = useState(20);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  // Ventana de detalle, formulario y borrado
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const [aviso, setAviso] = useState(null);

  // Si se llega desde un enlace (/productos?id=10) se abre directamente el detalle de ese producto
  useEffect(() => {
    const id = parametros.get('id');
    if (id) {
      abrirDetalle({ StockItemID: id });
      setParametros({}, { replace: true });
    }
  }, []);

  // Grupos para el filtro (solo los que tienen productos)
  useEffect(() => {
    async function cargarGrupos() {
      try {
        const respuesta = await pedir('/api/productos/grupos');
        setGrupos(respuesta.datos);
      } catch (e) {
        setAviso({ tipo: 'error', texto: 'No se pudieron cargar los grupos. ' + e.message });
      }
    }
    cargarGrupos();
  }, []);

  // Lista de productos: se vuelve a consultar cuando cambian los filtros o la página
  useEffect(() => {
    async function cargarProductos() {
      setCargando(true);
      setError('');

      try {
        const query = armarQuery({
          nombre: filtrosAplicados.nombre.trim(),
          grupoId: filtrosAplicados.grupoId,
          cantidadMinima: filtrosAplicados.cantidadMinima,
          cantidadMaxima: filtrosAplicados.cantidadMaxima,
          pagina,
          cantidad
        });
        const respuesta = await pedir('/api/productos/buscar' + query);
        setFilas(respuesta.datos);
      } catch (e) {
        setError(e.message);
        setFilas([]);
      } finally {
        setCargando(false);
      }
    }
    cargarProductos();
  }, [filtrosAplicados, pagina, cantidad, recarga]);

  function aplicarFiltros() {
    const minimo = filtros.cantidadMinima === '' ? null : Number(filtros.cantidadMinima);
    const maximo = filtros.cantidadMaxima === '' ? null : Number(filtros.cantidadMaxima);

    if (minimo !== null && maximo !== null && minimo > maximo) {
      setErrorCantidad('La cantidad máxima debe ser mayor o igual que la mínima.');
      return;
    }

    setErrorCantidad('');
    setFiltrosAplicados(filtros);
    setPagina(1);
  }

  function restaurarFiltros() {
    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
    setErrorCantidad('');
    setPagina(1);
  }

  function cambiarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  // Las cantidades solo aceptan dígitos
  function cambiarCantidad(campo, valor) {
    cambiarFiltro(campo, valor.replace(/\D/g, ''));
  }

  async function abrirDetalle(fila) {
    setDetalle(null);
    setDetalleAbierto(true);

    try {
      const respuesta = await pedir('/api/productos/' + fila.StockItemID);
      setDetalle(respuesta.datos);
    } catch (e) {
      setDetalleAbierto(false);
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  function abrirNuevo() {
    setProductoEnEdicion(null);
    setFormularioAbierto(true);
  }

  function abrirEdicion() {
    setProductoEnEdicion(detalle);
    setFormularioAbierto(true);
  }

  function alGuardarProducto(mensaje) {
    setFormularioAbierto(false);
    setDetalleAbierto(false);
    setAviso({ tipo: 'success', texto: mensaje });
    setRecarga((valor) => valor + 1);
  }

  async function borrarProducto() {
    setBorrando(true);

    try {
      await pedir('/api/productos/' + detalle.StockItemID, { method: 'DELETE' });
      setAviso({ tipo: 'success', texto: 'El producto se eliminó correctamente.' });
      setDetalleAbierto(false);
      setRecarga((valor) => valor + 1);
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setConfirmarBorrado(false);
      setBorrando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Inventario"
        subtitulo="Consulte los productos y su cantidad disponible, filtre los resultados y administre el inventario."
        accion={
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={abrirNuevo}>
            Nuevo producto
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          component="form"
          onSubmit={(evento) => {
            evento.preventDefault();
            aplicarFiltros();
          }}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1.4fr 1fr 1fr' },
            gap: 2,
            alignItems: 'start'
          }}
        >
          <TextField
            label="Nombre del producto"
            placeholder="Escriba parte del nombre"
            size="small"
            value={filtros.nombre}
            onChange={(evento) => cambiarFiltro('nombre', evento.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />

          <TextField
            select
            label="Grupo"
            size="small"
            value={filtros.grupoId}
            onChange={(evento) => cambiarFiltro('grupoId', evento.target.value)}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {grupos.map((grupo) => (
              <MenuItem key={grupo.StockGroupID} value={grupo.StockGroupID}>
                {grupo.StockGroupName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Cantidad mínima"
            size="small"
            value={filtros.cantidadMinima}
            onChange={(evento) => cambiarCantidad('cantidadMinima', evento.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 9 } }}
          />

          <TextField
            label="Cantidad máxima"
            size="small"
            value={filtros.cantidadMaxima}
            onChange={(evento) => cambiarCantidad('cantidadMaxima', evento.target.value)}
            error={Boolean(errorCantidad)}
            helperText={errorCantidad}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 9 } }}
          />

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
              Buscar
            </Button>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={restaurarFiltros}>
              Restaurar filtros
            </Button>
          </Box>
        </Box>
      </Paper>

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
        claveFila="StockItemID"
        alSeleccionar={abrirDetalle}
      />

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

      {/* Ventana con el detalle del producto */}
      <Dialog
        open={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{detalle ? detalle.StockItemName : 'Detalle del producto'}</DialogTitle>

        <DialogContent dividers>
          {!detalle ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  mb: 2
                }}
              >
                <CampoDetalle titulo="Nombre del producto" valor={detalle.StockItemName} />
                <CampoDetalle
                  titulo="Proveedor"
                  valor={detalle.SupplierName}
                  ruta={`/proveedores?id=${detalle.SupplierID}`}
                />
                <CampoDetalle titulo="Color" valor={detalle.Color} />
                <CampoDetalle titulo="Marca" valor={detalle.Brand} />
                <CampoDetalle titulo="Unidad de empaquetamiento" valor={detalle.UnitPackage} />
                <CampoDetalle titulo="Empaquetamiento" valor={detalle.OuterPackage} />
                <CampoDetalle titulo="Cantidad de empaquetamiento" valor={detalle.QuantityPerOuter} />
                <CampoDetalle titulo="Tamaño" valor={detalle.Size} />
                <CampoDetalle titulo="Impuesto" valor={`${detalle.TaxRate}%`} />
                <CampoDetalle titulo="Precio unitario" valor={dinero(detalle.UnitPrice)} />
                <CampoDetalle titulo="Precio de venta recomendado" valor={dinero(detalle.RecommendedRetailPrice)} />
                <CampoDetalle titulo="Peso" valor={`${detalle.TypicalWeightPerUnit} kg`} />
                <CampoDetalle titulo="Cantidad disponible" valor={entero(detalle.QuantityOnHand)} />
                <CampoDetalle titulo="Ubicación" valor={detalle.BinLocation} />
              </Box>

              <CampoDetalle titulo="Palabras clave" valor={detalle.SearchDetails} />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button startIcon={<EditIcon />} disabled={!detalle} onClick={abrirEdicion}>
            Editar
          </Button>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            disabled={!detalle}
            onClick={() => setConfirmarBorrado(true)}
          >
            Eliminar
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" onClick={() => setDetalleAbierto(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <ProductoFormulario
        abierto={formularioAbierto}
        producto={productoEnEdicion}
        alCerrar={() => setFormularioAbierto(false)}
        alGuardar={alGuardarProducto}
      />

      <ConfirmarDialogo
        abierto={confirmarBorrado}
        titulo="Eliminar producto"
        texto={`¿Seguro que desea eliminar "${detalle ? detalle.StockItemName : ''}"? Esta acción no se puede deshacer.`}
        textoBoton="Eliminar"
        cargando={borrando}
        alConfirmar={borrarProducto}
        alCancelar={() => setConfirmarBorrado(false)}
      />

      <Aviso aviso={aviso} alCerrar={() => setAviso(null)} />
    </>
  );
}

export default Inventario;