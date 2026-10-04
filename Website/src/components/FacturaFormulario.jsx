import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, TextField, Typography
} from '@mui/material';
import { pedir } from '../api';
import SelectorBusqueda from './SelectorBusqueda';

const valoresIniciales = {
  cliente: null, clienteFacturar: null, metodoEntregaId: '',
  contacto: null, cuenta: null, vendedor: null, empacador: null,
  instrucciones: '', producto: null, cantidad: ''
};

// Convierte el encabezado que devuelve la API en los valores del formulario
function valoresDesde(factura) {
  return {
    cliente: { CustomerID: factura.CustomerID, CustomerName: factura.CustomerName },
    clienteFacturar: { CustomerID: factura.BillToCustomerID, CustomerName: factura.BillToCustomerName },
    metodoEntregaId: factura.DeliveryMethodID,
    contacto: { PersonID: factura.ContactPersonID, FullName: factura.ContactPerson },
    cuenta: { PersonID: factura.AccountsPersonID, FullName: factura.AccountsPerson },
    vendedor: { PersonID: factura.SalespersonPersonID, FullName: factura.SalesPerson },
    empacador: { PersonID: factura.PackedByPersonID, FullName: factura.PackedByPerson },
    instrucciones:
      factura.DeliveryInstructions === 'No posee instrucciones de entrega'
        ? ''
        : factura.DeliveryInstructions || '',
    producto: null,
    cantidad: ''
  };
}

// Revisa los datos antes de enviarlos. Devuelve un objeto con un mensaje por cada campo con error
function validar(valores, esEdicion) {
  const errores = {};

  if (!valores.cliente) errores.cliente = 'Seleccione el cliente.';
  if (!valores.clienteFacturar) errores.clienteFacturar = 'Seleccione el cliente a facturar.';
  if (!valores.metodoEntregaId) errores.metodoEntregaId = 'Seleccione un método de entrega.';
  if (!valores.contacto) errores.contacto = 'Seleccione la persona de contacto.';
  if (!valores.cuenta) errores.cuenta = 'Seleccione la persona de cuenta.';
  if (!valores.vendedor) errores.vendedor = 'Seleccione el vendedor.';
  if (!valores.empacador) errores.empacador = 'Seleccione la persona que empaca.';

  if (!esEdicion) {
    if (!valores.producto) errores.producto = 'Seleccione el producto.';

    if (!/^\d+$/.test(valores.cantidad) || Number(valores.cantidad) < 1 || Number(valores.cantidad) > 100000) {
      errores.cantidad = 'Ingrese un número entero entre 1 y 100000.';
    }
  }

  return errores;
}

function Seccion({ titulo, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5 }}>
        {titulo}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        {children}
      </Box>
    </Box>
  );
}

function FacturaFormulario({ abierto, factura, alCerrar, alGuardar }) {
  const esEdicion = Boolean(factura);

  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [metodos, setMetodos] = useState([]);

  // Métodos de entrega (se cargan una sola vez)
  useEffect(() => {
    async function cargarMetodos() {
      try {
        const respuesta = await pedir('/api/generales/metodos-entrega');
        setMetodos(respuesta.datos);
      } catch (e) {
        setErrorApi('No se pudieron cargar los métodos de entrega. ' + e.message);
      }
    }
    cargarMetodos();
  }, []);

  // Cada vez que se abre, se llenan los campos (con la factura al editar, vacíos al crear)
  useEffect(() => {
    if (abierto) {
      setValores(factura ? valoresDesde(factura) : valoresIniciales);
      setErrores({});
      setErrorApi('');
    }
  }, [abierto, factura]);

  function cambiar(clave, valor) {
    setValores({ ...valores, [clave]: valor });
    if (errores[clave]) setErrores({ ...errores, [clave]: undefined });
  }

  // Al elegir el cliente, el cliente a facturar lo sigue mientras no se haya cambiado a mano
  function cambiarCliente(cliente) {
    const siguiendo =
      !valores.clienteFacturar ||
      (valores.cliente && valores.clienteFacturar.CustomerID === valores.cliente.CustomerID);

    setValores({
      ...valores,
      cliente,
      clienteFacturar: siguiendo ? cliente : valores.clienteFacturar
    });
    setErrores({ ...errores, cliente: undefined, clienteFacturar: undefined });
  }

  async function enviar(evento) {
    evento.preventDefault();

    const nuevosErrores = validar(valores, esEdicion);
    setErrores(nuevosErrores);
    setErrorApi('');
    if (Object.keys(nuevosErrores).length > 0) return;

    // Los valores undefined no se envían (JSON.stringify los ignora)
    const cuerpo = {
      ID_Cliente: valores.cliente.CustomerID,
      ID_BillToCustomer: valores.clienteFacturar.CustomerID,
      ID_MetodoEntrega: Number(valores.metodoEntregaId),
      ID_PersonaContacto: valores.contacto.PersonID,
      ID_PersonaCuenta: valores.cuenta.PersonID,
      ID_Vendedor: valores.vendedor.PersonID,
      ID_Empacador: valores.empacador.PersonID,
      DeliveryInstructions: valores.instrucciones.trim() || undefined
    };

    if (!esEdicion) {
      cuerpo.ID_Producto = valores.producto.StockItemID;
      cuerpo.Cantidad = Number(valores.cantidad);
    }

    setGuardando(true);
    try {
      if (esEdicion) {
        await pedir('/api/facturas/' + factura.InvoiceID, {
          method: 'PUT',
          body: JSON.stringify(cuerpo)
        });
        alGuardar('La factura se actualizó correctamente.');
      } else {
        const respuesta = await pedir('/api/facturas', { method: 'POST', body: JSON.stringify(cuerpo) });
        const numero = respuesta.datos ? ` (número ${respuesta.datos.InvoiceID})` : '';
        alGuardar('La factura se creó correctamente' + numero + '.');
      }
    } catch (e) {
      setErrorApi(e.message);
    } finally {
      setGuardando(false);
    }
  }

  // Selector de personas: "extra" permite limitar a vendedores o empleados
  function selectorPersona(clave, etiqueta, extra) {
    return (
      <SelectorBusqueda
        etiqueta={etiqueta}
        valor={valores[clave]}
        alCambiar={(persona) => cambiar(clave, persona)}
        textoError={errores[clave]}
        ruta="/api/generales/personas"
        parametro="criterio"
        campoId="PersonID"
        campoNombre="FullName"
        extra={extra}
      />
    );
  }

  return (
    <Dialog
      open={abierto}
      onClose={guardando ? undefined : alCerrar}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { component: 'form', noValidate: true, onSubmit: enviar } }}
    >
      <DialogTitle>
        {esEdicion ? `Editar factura N.º ${factura.InvoiceID}` : 'Nueva factura'}
      </DialogTitle>

      <DialogContent dividers>
        {errorApi && <Alert severity="error" sx={{ mb: 2 }}>{errorApi}</Alert>}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Los campos marcados con * son obligatorios.
        </Typography>

        <Seccion titulo="Cliente">
          <SelectorBusqueda
            etiqueta="Cliente"
            valor={valores.cliente}
            alCambiar={cambiarCliente}
            textoError={errores.cliente}
            ruta="/api/clientes/buscar"
            parametro="criterio"
            campoId="CustomerID"
            campoNombre="CustomerName"
          />
          <SelectorBusqueda
            etiqueta="Cliente a facturar"
            valor={valores.clienteFacturar}
            alCambiar={(cliente) => cambiar('clienteFacturar', cliente)}
            textoError={errores.clienteFacturar}
            ruta="/api/clientes/buscar"
            parametro="criterio"
            campoId="CustomerID"
            campoNombre="CustomerName"
            ayuda="Por defecto es el mismo cliente"
          />
        </Seccion>

        <Seccion titulo="Entrega">
          <TextField
            select
            required
            size="small"
            label="Método de entrega"
            value={valores.metodoEntregaId}
            onChange={(evento) => cambiar('metodoEntregaId', evento.target.value)}
            error={Boolean(errores.metodoEntregaId)}
            helperText={errores.metodoEntregaId || ' '}
          >
            {metodos.map((metodo) => (
              <MenuItem key={metodo.DeliveryMethodID} value={metodo.DeliveryMethodID}>
                {metodo.DeliveryMethodName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Instrucciones de entrega"
            size="small"
            multiline
            minRows={2}
            value={valores.instrucciones}
            onChange={(evento) => cambiar('instrucciones', evento.target.value)}
            helperText="Opcional"
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </Seccion>

        <Seccion titulo="Personas">
          {selectorPersona('contacto', 'Persona de contacto')}
          {selectorPersona('cuenta', 'Persona de cuenta')}
          {selectorPersona('vendedor', 'Vendedor', { soloVendedores: 1 })}
          {selectorPersona('empacador', 'Persona que empaca', { soloEmpleados: 1 })}
        </Seccion>

        {esEdicion ? (
          <Alert severity="info">
            Los productos de la factura no se pueden modificar desde este formulario.
          </Alert>
        ) : (
          <Seccion titulo="Producto facturado">
            <SelectorBusqueda
              etiqueta="Producto"
              valor={valores.producto}
              alCambiar={(producto) => cambiar('producto', producto)}
              textoError={errores.producto}
              ruta="/api/productos/buscar"
              parametro="nombre"
              campoId="StockItemID"
              campoNombre="StockItemName"
            />
            <TextField
              label="Cantidad"
              size="small"
              required
              value={valores.cantidad}
              onChange={(evento) => cambiar('cantidad', evento.target.value.replace(/\D/g, ''))}
              error={Boolean(errores.cantidad)}
              helperText={errores.cantidad || 'El precio y el impuesto se toman del producto'}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
            />
          </Seccion>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={alCerrar} disabled={guardando}>Cancelar</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={guardando}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FacturaFormulario;