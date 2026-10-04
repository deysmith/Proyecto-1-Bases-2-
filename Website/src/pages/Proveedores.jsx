import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import EncabezadoPagina from '../components/EncabezadoPagina';
import TablaDatos from '../components/TablaDatos';
import Paginacion from '../components/Paginacion';
import Aviso from '../components/Aviso';
import ConfirmarDialogo from '../components/ConfirmarDialogo';
import CampoDetalle from '../components/CampoDetalle';
import Mapa from '../components/Mapa';
import ProveedorFormulario from '../components/ProveedorFormulario';

const filtrosVacios = { nombre: '', categoriaId: '', metodoEntregaId: '' };

const columnas = [
  { campo: 'SupplierName', titulo: 'Proveedor' },
  { campo: 'SupplierCategoryName', titulo: 'Categoría' },
  { campo: 'DeliveryMethodName', titulo: 'Método de entrega' }
];

function Proveedores() {
  // Filtros: "filtros" es lo que el usuario escribe, "filtrosAplicados" es lo que se consultó
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosVacios);
  const [categorias, setCategorias] = useState([]);
  const [metodos, setMetodos] = useState([]);

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
  const [proveedorEnEdicion, setProveedorEnEdicion] = useState(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const [aviso, setAviso] = useState(null);

  const [parametros, setParametros] = useSearchParams();

  // Si se llega desde un enlace (/proveedores?id=3) se abre directamente el detalle de ese proveedor
  useEffect(() => {
    const id = parametros.get('id');
    if (id) {
      abrirDetalle({ SupplierID: id });
      setParametros({}, { replace: true });
    }
  }, []);

  // Opciones de los filtros (se cargan una sola vez)
  useEffect(() => {
    async function cargarOpciones() {
      try {
        const [resCategorias, resMetodos] = await Promise.all([
          pedir('/api/proveedores/categorias'),
          pedir('/api/proveedores/metodos-entrega')
        ]);
        setCategorias(resCategorias.datos);
        setMetodos(resMetodos.datos);
      } catch (e) {
        setAviso({ tipo: 'error', texto: 'No se pudieron cargar los filtros. ' + e.message });
      }
    }
    cargarOpciones();
  }, []);

  // Lista de proveedores: se vuelve a consultar cuando cambian los filtros o la página
  useEffect(() => {
    async function cargarProveedores() {
      setCargando(true);
      setError('');

      try {
        const query = armarQuery({
          nombre: filtrosAplicados.nombre.trim(),
          categoriaId: filtrosAplicados.categoriaId,
          metodoEntregaId: filtrosAplicados.metodoEntregaId,
          pagina,
          cantidad
        });
        const respuesta = await pedir('/api/proveedores/buscar' + query);
        setFilas(respuesta.datos);
      } catch (e) {
        setError(e.message);
        setFilas([]);
      } finally {
        setCargando(false);
      }
    }
    cargarProveedores();
  }, [filtrosAplicados, pagina, cantidad, recarga]);

  function aplicarFiltros() {
    setFiltrosAplicados(filtros);
    setPagina(1);
  }

  function restaurarFiltros() {
    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
    setPagina(1);
  }

  function cambiarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  async function abrirDetalle(fila) {
    setDetalle(null);
    setDetalleAbierto(true);

    try {
      const respuesta = await pedir('/api/proveedores/' + fila.SupplierID);
      setDetalle(respuesta.datos);
    } catch (e) {
      setDetalleAbierto(false);
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  function abrirNuevo() {
    setProveedorEnEdicion(null);
    setFormularioAbierto(true);
  }

  function abrirEdicion() {
    setProveedorEnEdicion(detalle);
    setFormularioAbierto(true);
  }

  function alGuardarProveedor(mensaje) {
    setFormularioAbierto(false);
    setDetalleAbierto(false);
    setAviso({ tipo: 'success', texto: mensaje });
    setRecarga((valor) => valor + 1);
  }

  async function borrarProveedor() {
    setBorrando(true);

    try {
      await pedir('/api/proveedores/' + detalle.SupplierID, { method: 'DELETE' });
      setAviso({ tipo: 'success', texto: 'El proveedor se eliminó correctamente.' });
      setDetalleAbierto(false);
      setRecarga((valor) => valor + 1);
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setConfirmarBorrado(false);
      setBorrando(false);
    }
  }

  const punto = detalle?.DeliveryLocation?.points?.[0];

  return (
    <>
      <EncabezadoPagina
        titulo="Proveedores"
        subtitulo="Consulte los proveedores registrados, filtre los resultados y administre su información."
        accion={
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={abrirNuevo}>
            Nuevo proveedor
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
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
            gap: 2
          }}
        >
          <TextField
            label="Nombre del proveedor"
            placeholder="Escriba parte del nombre"
            size="small"
            value={filtros.nombre}
            onChange={(evento) => cambiarFiltro('nombre', evento.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />

          <TextField
            select
            label="Categoría"
            size="small"
            value={filtros.categoriaId}
            onChange={(evento) => cambiarFiltro('categoriaId', evento.target.value)}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">Todas</MenuItem>
            {categorias.map((categoria) => (
              <MenuItem key={categoria.SupplierCategoryID} value={categoria.SupplierCategoryID}>
                {categoria.SupplierCategoryName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Método de entrega"
            size="small"
            value={filtros.metodoEntregaId}
            onChange={(evento) => cambiarFiltro('metodoEntregaId', evento.target.value)}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {metodos.map((metodo) => (
              <MenuItem key={metodo.DeliveryMethodID} value={metodo.DeliveryMethodID}>
                {metodo.DeliveryMethodName}
              </MenuItem>
            ))}
          </TextField>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              gridColumn: { md: '1 / -1' },
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
        claveFila="SupplierID"
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

      {/* Ventana con el detalle del proveedor */}
      <Dialog
        open={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{detalle ? detalle.SupplierName : 'Detalle del proveedor'}</DialogTitle>

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
                <CampoDetalle titulo="Código del proveedor" valor={detalle.SupplierReference} />
                <CampoDetalle titulo="Nombre del proveedor" valor={detalle.SupplierName} />
                <CampoDetalle titulo="Categoría" valor={detalle.SupplierCategoryName} />
                <CampoDetalle titulo="Método de entrega" valor={detalle.DeliveryMethodName} />
                <CampoDetalle titulo="Contacto primario" valor={detalle.PrimaryContact} />
                <CampoDetalle titulo="Contacto alternativo" valor={detalle.AlternativeContact} />
                <CampoDetalle titulo="Ciudad de entrega" valor={detalle.CityName} />
                <CampoDetalle titulo="Código postal de entrega" valor={detalle.DeliveryPostalCode} />
                <CampoDetalle titulo="Teléfono" valor={detalle.PhoneNumber} />
                <CampoDetalle titulo="Fax" valor={detalle.FaxNumber} />
                <CampoDetalle titulo="Sitio web" valor={detalle.WebsiteURL} enlace />
                <CampoDetalle titulo="Días de gracia para pagar" valor={detalle.PaymentDays} />
                <CampoDetalle titulo="Nombre del banco" valor={detalle.BankAccountBranch} />
                <CampoDetalle titulo="Número de cuenta corriente" valor={detalle.BankAccountNumber} />
              </Box>

              <CampoDetalle titulo="Dirección" valor={detalle.Address} />

              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Ubicación de entrega
              </Typography>
              <Mapa latitud={punto?.lat} longitud={punto?.lng} texto={detalle.SupplierName} />
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

      <ProveedorFormulario
        abierto={formularioAbierto}
        proveedor={proveedorEnEdicion}
        alCerrar={() => setFormularioAbierto(false)}
        alGuardar={alGuardarProveedor}
      />

      <ConfirmarDialogo
        abierto={confirmarBorrado}
        titulo="Eliminar proveedor"
        texto={`¿Seguro que desea eliminar a "${detalle ? detalle.SupplierName : ''}"? Esta acción no se puede deshacer.`}
        textoBoton="Eliminar"
        cargando={borrando}
        alConfirmar={borrarProveedor}
        alCancelar={() => setConfirmarBorrado(false)}
      />

      <Aviso aviso={aviso} alCerrar={() => setAviso(null)} />
    </>
  );
}

export default Proveedores;