import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Link, Paper, TextField, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { pedir, armarQuery } from '../api';
import { dinero, entero, fecha } from '../formato';
import EncabezadoPagina from '../components/EncabezadoPagina';
import TablaDatos from '../components/TablaDatos';
import Paginacion from '../components/Paginacion';
import Aviso from '../components/Aviso';
import ConfirmarDialogo from '../components/ConfirmarDialogo';
import CampoDetalle from '../components/CampoDetalle';
import FacturaFormulario from '../components/FacturaFormulario';

const filtrosVacios = {
  cliente: '', fechaInicio: '', fechaFin: '', montoMinimo: '', montoMaximo: ''
};

const patronMonto = /^\d+(\.\d{1,2})?$/;

const columnas = [
  { campo: 'InvoiceID', titulo: 'N.º de factura' },
  { campo: 'InvoiceDate', titulo: 'Fecha', formato: fecha },
  { campo: 'CustomerName', titulo: 'Cliente' },
  { campo: 'DeliveryMethodName', titulo: 'Método de entrega' },
  { campo: 'Price', titulo: 'Monto', alinear: 'right', formato: dinero }
];

// Columnas de las líneas de la factura. El producto es un enlace a su detalle
const columnasLineas = [
  {
    campo: 'StockItemName',
    titulo: 'Producto',
    formato: (valor, fila) => (
      <Link component={RouterLink} to={`/productos?id=${fila.StockItemID}`}>{valor}</Link>
    )
  },
  { campo: 'Quantity', titulo: 'Cantidad', alinear: 'right', formato: entero },
  { campo: 'UnitPrice', titulo: 'Precio unitario', alinear: 'right', formato: dinero },
  { campo: 'TaxRate', titulo: 'Impuesto aplicado', alinear: 'right', formato: (valor) => `${valor}%` },
  { campo: 'TaxAmount', titulo: 'Monto del impuesto', alinear: 'right', formato: dinero },
  { campo: 'ExtendedPrice', titulo: 'Total por línea', alinear: 'right', formato: dinero }
];

function Ventas() {
  // Filtros: "filtros" es lo que el usuario escribe, "filtrosAplicados" es lo que se consultó
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosVacios);
  const [erroresFiltros, setErroresFiltros] = useState({});

  // Tabla
  const [filas, setFilas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [cantidad, setCantidad] = useState(20);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  // Ventana de detalle, formulario y borrado
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [encabezado, setEncabezado] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [facturaEnEdicion, setFacturaEnEdicion] = useState(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const [aviso, setAviso] = useState(null);

  // Lista de facturas: se vuelve a consultar cuando cambian los filtros o la página
  useEffect(() => {
    async function cargarFacturas() {
      setCargando(true);
      setError('');

      try {
        const query = armarQuery({
          cliente: filtrosAplicados.cliente.trim(),
          fechaInicio: filtrosAplicados.fechaInicio,
          fechaFin: filtrosAplicados.fechaFin,
          montoMinimo: filtrosAplicados.montoMinimo,
          montoMaximo: filtrosAplicados.montoMaximo,
          pagina,
          cantidad
        });
        const respuesta = await pedir('/api/facturas/buscar' + query);
        setFilas(respuesta.datos);
      } catch (e) {
        setError(e.message);
        setFilas([]);
      } finally {
        setCargando(false);
      }
    }
    cargarFacturas();
  }, [filtrosAplicados, pagina, cantidad, recarga]);

  // Revisa los rangos antes de buscar
  function validarFiltros() {
    const errores = {};

    if (filtros.fechaInicio && filtros.fechaFin && filtros.fechaInicio > filtros.fechaFin) {
      errores.fechaFin = 'La fecha final debe ser igual o posterior a la inicial.';
    }

    if (filtros.montoMinimo && !patronMonto.test(filtros.montoMinimo)) {
      errores.montoMinimo = 'Ingrese un monto válido (hasta 2 decimales).';
    }
    if (filtros.montoMaximo && !patronMonto.test(filtros.montoMaximo)) {
      errores.montoMaximo = 'Ingrese un monto válido (hasta 2 decimales).';
    }

    if (
      !errores.montoMinimo && !errores.montoMaximo &&
      filtros.montoMinimo && filtros.montoMaximo &&
      Number(filtros.montoMinimo) > Number(filtros.montoMaximo)
    ) {
      errores.montoMaximo = 'El monto máximo debe ser mayor o igual que el mínimo.';
    }

    return errores;
  }

  function aplicarFiltros() {
    const errores = validarFiltros();
    setErroresFiltros(errores);
    if (Object.keys(errores).length > 0) return;

    setFiltrosAplicados(filtros);
    setPagina(1);
  }

  function restaurarFiltros() {
    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
    setErroresFiltros({});
    setPagina(1);
  }

  function cambiarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  // Los montos solo aceptan dígitos y un punto
  function cambiarMonto(campo, valor) {
    cambiarFiltro(campo, valor.replace(/[^\d.]/g, ''));
  }

  async function abrirDetalle(fila) {
    setEncabezado(null);
    setLineas([]);
    setDetalleAbierto(true);

    try {
      const [resEncabezado, resLineas] = await Promise.all([
        pedir('/api/facturas/' + fila.InvoiceID),
        pedir('/api/facturas/' + fila.InvoiceID + '/detalle')
      ]);
      setEncabezado(resEncabezado.datos);
      setLineas(resLineas.datos);
    } catch (e) {
      setDetalleAbierto(false);
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  function abrirNueva() {
    setFacturaEnEdicion(null);
    setFormularioAbierto(true);
  }

  function abrirEdicion() {
    setFacturaEnEdicion(encabezado);
    setFormularioAbierto(true);
  }

  function alGuardarFactura(mensaje) {
    setFormularioAbierto(false);
    setDetalleAbierto(false);
    setAviso({ tipo: 'success', texto: mensaje });
    setRecarga((valor) => valor + 1);
  }

  async function borrarFactura() {
    setBorrando(true);

    try {
      await pedir('/api/facturas/' + encabezado.InvoiceID, { method: 'DELETE' });
      setAviso({ tipo: 'success', texto: 'La factura se eliminó correctamente.' });
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
        titulo="Ventas"
        subtitulo="Consulte las facturas emitidas, filtre los resultados y administre las ventas."
        accion={
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={abrirNueva}>
            Nueva factura
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
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr 1fr' },
            gap: 2,
            alignItems: 'start'
          }}
        >
          <TextField
            label="Nombre del cliente"
            placeholder="Escriba parte del nombre"
            size="small"
            value={filtros.cliente}
            onChange={(evento) => cambiarFiltro('cliente', evento.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />

          <TextField
            label="Fecha desde"
            type="date"
            size="small"
            value={filtros.fechaInicio}
            onChange={(evento) => cambiarFiltro('fechaInicio', evento.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Fecha hasta"
            type="date"
            size="small"
            value={filtros.fechaFin}
            onChange={(evento) => cambiarFiltro('fechaFin', evento.target.value)}
            error={Boolean(erroresFiltros.fechaFin)}
            helperText={erroresFiltros.fechaFin}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Monto mínimo ($)"
            size="small"
            value={filtros.montoMinimo}
            onChange={(evento) => cambiarMonto('montoMinimo', evento.target.value)}
            error={Boolean(erroresFiltros.montoMinimo)}
            helperText={erroresFiltros.montoMinimo}
            slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 12 } }}
          />

          <TextField
            label="Monto máximo ($)"
            size="small"
            value={filtros.montoMaximo}
            onChange={(evento) => cambiarMonto('montoMaximo', evento.target.value)}
            error={Boolean(erroresFiltros.montoMaximo)}
            helperText={erroresFiltros.montoMaximo}
            slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 12 } }}
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
        claveFila="InvoiceID"
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

      {/* Ventana con el detalle de la factura */}
      <Dialog
        open={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          {encabezado ? `Factura N.º ${encabezado.InvoiceID}` : 'Detalle de la factura'}
        </DialogTitle>

        <DialogContent dividers>
          {!encabezado ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                Encabezado de la factura
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                  gap: 2,
                  mb: 2
                }}
              >
                <CampoDetalle titulo="Número de factura" valor={encabezado.InvoiceID} />
                <CampoDetalle
                  titulo="Cliente"
                  valor={encabezado.CustomerName}
                  ruta={`/clientes?id=${encabezado.CustomerID}`}
                />
                <CampoDetalle titulo="Método de entrega" valor={encabezado.DeliveryMethodName} />
                <CampoDetalle titulo="Número de orden" valor={encabezado.CustomerPurchaseOrderNumber} />
                <CampoDetalle titulo="Persona de contacto" valor={encabezado.ContactPerson} />
                <CampoDetalle titulo="Vendedor" valor={encabezado.SalesPerson} />
                <CampoDetalle titulo="Fecha de la factura" valor={fecha(encabezado.InvoiceDate)} />
              </Box>
              <CampoDetalle titulo="Instrucciones de entrega" valor={encabezado.DeliveryInstructions} />

              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>
                Detalle de la factura
              </Typography>
              <TablaDatos
                columnas={columnasLineas}
                filas={lineas}
                cargando={false}
                claveFila="InvoiceLineID"
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button startIcon={<EditIcon />} disabled={!encabezado} onClick={abrirEdicion}>
            Editar
          </Button>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            disabled={!encabezado}
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

      <FacturaFormulario
        abierto={formularioAbierto}
        factura={facturaEnEdicion}
        alCerrar={() => setFormularioAbierto(false)}
        alGuardar={alGuardarFactura}
      />

      <ConfirmarDialogo
        abierto={confirmarBorrado}
        titulo="Eliminar factura"
        texto={`¿Seguro que desea eliminar la factura N.º ${encabezado ? encabezado.InvoiceID : ''}? Esta acción no se puede deshacer.`}
        textoBoton="Eliminar"
        cargando={borrando}
        alConfirmar={borrarFactura}
        alCancelar={() => setConfirmarBorrado(false)}
      />

      <Aviso aviso={aviso} alCerrar={() => setAviso(null)} />
    </>
  );
}

export default Ventas;