import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, TextField, Typography
} from '@mui/material';
import { pedir } from '../api';
import SelectorCiudad from './SelectorCiudad';

const patronTelefono = /^[0-9+()\-\s]{7,20}$/;
const patronWeb = /^https?:\/\/.+\..+/i;

const valoresIniciales = {
  nombre: '', categoriaId: '', metodoEntregaId: '',
  ciudadEntrega: null, ciudadPostal: null,
  telefono: '', fax: '', web: '', diasPago: '',
  direccionEntrega1: '', direccionEntrega2: '', codigoPostalEntrega: '',
  direccionPostal1: '', direccionPostal2: '', codigoPostalPostal: '',
  latitud: '', longitud: '',
  contactoPrimario: '', contactoSecundario: ''
};

// Convierte el detalle que devuelve la API en los valores del formulario
function valoresDesde(cliente) {
  const punto = cliente.DeliveryLocation?.points?.[0];

  return {
    nombre: cliente.CustomerName,
    categoriaId: cliente.CustomerCategoryID,
    metodoEntregaId: cliente.DeliveryMethodID,
    ciudadEntrega: { CityID: cliente.DeliveryCityID, CityName: cliente.CityName },
    ciudadPostal: { CityID: cliente.PostalCityID, CityName: cliente.PostalCityName },
    telefono: cliente.PhoneNumber || '',
    fax: cliente.FaxNumber || '',
    web: cliente.WebsiteURL || '',
    diasPago: String(cliente.PaymentDays),
    direccionEntrega1: cliente.DeliveryAddressLine1 || '',
    direccionEntrega2: cliente.DeliveryAddressLine2 || '',
    codigoPostalEntrega: cliente.DeliveryPostalCode || '',
    direccionPostal1: cliente.PostalAddressLine1 || '',
    direccionPostal2: cliente.PostalAddressLine2 || '',
    codigoPostalPostal: cliente.PostalPostalCode || '',
    latitud: punto ? String(punto.lat) : '',
    longitud: punto ? String(punto.lng) : '',
    contactoPrimario: '',
    contactoSecundario: ''
  };
}

// Revisa los datos antes de enviarlos. Devuelve un objeto con un mensaje por cada campo con error
function validar(valores, esEdicion) {
  const errores = {};

  if (!valores.nombre.trim()) errores.nombre = 'El nombre del cliente es obligatorio.';
  if (!valores.categoriaId) errores.categoriaId = 'Seleccione una categoría.';
  if (!valores.metodoEntregaId) errores.metodoEntregaId = 'Seleccione un método de entrega.';
  if (!valores.ciudadEntrega) errores.ciudadEntrega = 'Seleccione la ciudad de entrega.';
  if (!valores.ciudadPostal) errores.ciudadPostal = 'Seleccione la ciudad postal.';

  if (!valores.telefono.trim()) {
    errores.telefono = 'El teléfono es obligatorio.';
  } else if (!patronTelefono.test(valores.telefono.trim())) {
    errores.telefono = 'Use solo números, espacios, + - y paréntesis (7 a 20 caracteres).';
  }

  if (valores.fax.trim() && !patronTelefono.test(valores.fax.trim())) {
    errores.fax = 'Use solo números, espacios, + - y paréntesis (7 a 20 caracteres).';
  }

  if (valores.web.trim() && !patronWeb.test(valores.web.trim())) {
    errores.web = 'Debe iniciar con http:// o https:// (por ejemplo https://www.ejemplo.com).';
  }

  if (valores.diasPago === '') {
    errores.diasPago = 'Los días de gracia son obligatorios.';
  } else if (!/^\d+$/.test(valores.diasPago) || Number(valores.diasPago) > 365) {
    errores.diasPago = 'Ingrese un número entero entre 0 y 365.';
  }

  if (!valores.direccionEntrega1.trim()) errores.direccionEntrega1 = 'La dirección de entrega es obligatoria.';
  if (!valores.codigoPostalEntrega.trim()) errores.codigoPostalEntrega = 'El código postal de entrega es obligatorio.';
  if (!valores.direccionPostal1.trim()) errores.direccionPostal1 = 'La dirección postal es obligatoria.';
  if (!valores.codigoPostalPostal.trim()) errores.codigoPostalPostal = 'El código postal es obligatorio.';

  // La ubicación es opcional, pero si se llena una coordenada hay que llenar la otra
  const hayLatitud = valores.latitud.trim() !== '';
  const hayLongitud = valores.longitud.trim() !== '';

  if (hayLatitud || hayLongitud) {
    const latitud = Number(valores.latitud);
    const longitud = Number(valores.longitud);

    if (!hayLatitud || isNaN(latitud) || latitud < -90 || latitud > 90) {
      errores.latitud = 'Ingrese una latitud entre -90 y 90.';
    }
    if (!hayLongitud || isNaN(longitud) || longitud < -180 || longitud > 180) {
      errores.longitud = 'Ingrese una longitud entre -180 y 180.';
    }
  }

  if (!esEdicion && !valores.contactoPrimario.trim()) {
    errores.contactoPrimario = 'El contacto primario es obligatorio.';
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

function ClienteFormulario({ abierto, cliente, alCerrar, alGuardar }) {
  const esEdicion = Boolean(cliente);

  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [metodos, setMetodos] = useState([]);

  // Opciones de los selectores (todas las categorías y métodos, no solo las usadas)
  useEffect(() => {
    async function cargarOpciones() {
      try {
        const [resCategorias, resMetodos] = await Promise.all([
          pedir('/api/generales/categorias-clientes'),
          pedir('/api/generales/metodos-entrega')
        ]);
        setCategorias(resCategorias.datos);
        setMetodos(resMetodos.datos);
      } catch (e) {
        setErrorApi('No se pudieron cargar las opciones del formulario. ' + e.message);
      }
    }
    cargarOpciones();
  }, []);

  // Cada vez que se abre, se llenan los campos (con el cliente al editar, vacíos al crear)
  useEffect(() => {
    if (abierto) {
      setValores(cliente ? valoresDesde(cliente) : valoresIniciales);
      setErrores({});
      setErrorApi('');
    }
  }, [abierto, cliente]);

  function cambiar(clave, valor) {
    setValores({ ...valores, [clave]: valor });
    if (errores[clave]) setErrores({ ...errores, [clave]: undefined });
  }

  // Devuelve un campo de texto ya configurado con su error y límite de caracteres
  function campo(clave, etiqueta, extra = {}) {
    return (
      <TextField
        label={etiqueta}
        size="small"
        fullWidth
        required={extra.obligatorio}
        value={valores[clave]}
        onChange={(evento) => cambiar(clave, evento.target.value)}
        error={Boolean(errores[clave])}
        helperText={errores[clave] || extra.ayuda || ' '}
        slotProps={{ htmlInput: { maxLength: extra.maximo } }}
      />
    );
  }

  async function enviar(evento) {
    evento.preventDefault();

    const nuevosErrores = validar(valores, esEdicion);
    setErrores(nuevosErrores);
    setErrorApi('');
    if (Object.keys(nuevosErrores).length > 0) return;

    const hayUbicacion = valores.latitud.trim() !== '' && valores.longitud.trim() !== '';

    // Los valores undefined no se envían (JSON.stringify los ignora)
    const cuerpo = {
      Nombre_Cliente: valores.nombre.trim(),
      CategoriaID: Number(valores.categoriaId),
      MetodoEntregaID: Number(valores.metodoEntregaId),
      DeliveryCityID: valores.ciudadEntrega.CityID,
      PostalCityID: valores.ciudadPostal.CityID,
      Telefono: valores.telefono.trim(),
      Fax: valores.fax.trim(),
      WebsiteURL: valores.web.trim(),
      PaymentDays: Number(valores.diasPago),
      DeliveryAddress1: valores.direccionEntrega1.trim(),
      DeliveryAddress2: valores.direccionEntrega2.trim() || undefined,
      DeliveryPostalCode: valores.codigoPostalEntrega.trim(),
      PostalAddress1: valores.direccionPostal1.trim(),
      PostalAddress2: valores.direccionPostal2.trim() || undefined,
      PostalPostalCode: valores.codigoPostalPostal.trim(),
      DeliveryLocation: hayUbicacion
        ? `POINT(${Number(valores.longitud)} ${Number(valores.latitud)})`
        : undefined
    };

    if (!esEdicion) {
      cuerpo.Nombre_ContactoPrimario = valores.contactoPrimario.trim();
      cuerpo.Nombre_ContactoSecundario = valores.contactoSecundario.trim() || undefined;
    }

    setGuardando(true);
    try {
      if (esEdicion) {
        await pedir('/api/clientes/' + cliente.CustomerID, {
          method: 'PUT',
          body: JSON.stringify(cuerpo)
        });
        alGuardar('El cliente se actualizó correctamente.');
      } else {
        await pedir('/api/clientes', { method: 'POST', body: JSON.stringify(cuerpo) });
        alGuardar('El cliente se creó correctamente.');
      }
    } catch (e) {
      if (e.estado === 409) {
        setErrores({ nombre: e.message });
      } else {
        setErrorApi(e.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog
      open={abierto}
      onClose={guardando ? undefined : alCerrar}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { component: 'form', noValidate: true, onSubmit: enviar } }}
    >
      <DialogTitle>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>

      <DialogContent dividers>
        {errorApi && <Alert severity="error" sx={{ mb: 2 }}>{errorApi}</Alert>}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Los campos marcados con * son obligatorios.
        </Typography>

        <Seccion titulo="Datos generales">
          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            {campo('nombre', 'Nombre del cliente', { obligatorio: true, maximo: 100 })}
          </Box>
          <TextField
            select
            required
            size="small"
            label="Categoría"
            value={valores.categoriaId}
            onChange={(evento) => cambiar('categoriaId', evento.target.value)}
            error={Boolean(errores.categoriaId)}
            helperText={errores.categoriaId || ' '}
          >
            {categorias.map((categoria) => (
              <MenuItem key={categoria.CustomerCategoryID} value={categoria.CustomerCategoryID}>
                {categoria.CustomerCategoryName}
              </MenuItem>
            ))}
          </TextField>
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
          {campo('telefono', 'Teléfono', { obligatorio: true, maximo: 20 })}
          {campo('fax', 'Fax', { maximo: 20 })}
          {campo('web', 'Sitio web', { maximo: 256, ayuda: 'Ejemplo: https://www.ejemplo.com' })}
          {campo('diasPago', 'Días de gracia para pagar', { obligatorio: true, maximo: 3 })}
        </Seccion>

        {esEdicion ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Los contactos del cliente no se pueden modificar desde este formulario.
          </Alert>
        ) : (
          <Seccion titulo="Contactos">
            {campo('contactoPrimario', 'Contacto primario', { obligatorio: true, maximo: 50 })}
            {campo('contactoSecundario', 'Contacto alternativo', { maximo: 50 })}
          </Seccion>
        )}

        <Seccion titulo="Dirección de entrega">
          <SelectorCiudad
            etiqueta="Ciudad de entrega"
            valor={valores.ciudadEntrega}
            alCambiar={(ciudad) => cambiar('ciudadEntrega', ciudad)}
            textoError={errores.ciudadEntrega}
          />
          {campo('codigoPostalEntrega', 'Código postal de entrega', { obligatorio: true, maximo: 10 })}
          {campo('direccionEntrega1', 'Dirección (línea 1)', { obligatorio: true, maximo: 60 })}
          {campo('direccionEntrega2', 'Dirección (línea 2)', { maximo: 60 })}
        </Seccion>

        <Seccion titulo="Dirección postal">
          <SelectorCiudad
            etiqueta="Ciudad postal"
            valor={valores.ciudadPostal}
            alCambiar={(ciudad) => cambiar('ciudadPostal', ciudad)}
            textoError={errores.ciudadPostal}
          />
          {campo('codigoPostalPostal', 'Código postal', { obligatorio: true, maximo: 10 })}
          {campo('direccionPostal1', 'Dirección (línea 1)', { obligatorio: true, maximo: 60 })}
          {campo('direccionPostal2', 'Dirección (línea 2)', { maximo: 60 })}
        </Seccion>

        <Seccion titulo="Ubicación en el mapa (opcional)">
          {campo('latitud', 'Latitud', { maximo: 20, ayuda: 'Ejemplo: 9.9281' })}
          {campo('longitud', 'Longitud', { maximo: 20, ayuda: 'Ejemplo: -83.0334' })}
        </Seccion>
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

export default ClienteFormulario;