import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, TextField, Typography
} from '@mui/material';
import { pedir, armarQuery } from '../api';

const valoresIniciales = {
  nombre: '', proveedorId: '', colorId: '', unidadId: '', empaqueId: '',
  cantidadPorEmpaque: '', marca: '', tamano: '',
  impuesto: '', precioUnitario: '', precioVenta: '', peso: '',
  palabras: '', ubicacion: '', cantidadDisponible: '', gruposIds: []
};

// El detalle muestra textos como "No posee marca" cuando un dato está vacío; en el formulario eso debe verse en blanco
function limpiar(texto, textoVacio) {
  if (!texto || texto === textoVacio) return '';
  return texto;
}

// Convierte el detalle que devuelve la API en los valores del formulario
function valoresDesde(producto) {
  return {
    nombre: producto.StockItemName,
    proveedorId: producto.SupplierID,
    colorId: producto.ColorID ?? '',
    unidadId: producto.UnitPackageID,
    empaqueId: producto.OuterPackageID,
    cantidadPorEmpaque: String(producto.QuantityPerOuter),
    marca: limpiar(producto.Brand, 'No posee marca'),
    tamano: limpiar(producto.Size, 'No indica tamaño'),
    impuesto: String(producto.TaxRate),
    precioUnitario: String(producto.UnitPrice),
    precioVenta: limpiar(producto.RecommendedRetailPrice, 'No indica'),
    peso: String(producto.TypicalWeightPerUnit),
    palabras: producto.MarketingComments || '',
    ubicacion: producto.BinLocation || '',
    cantidadDisponible: String(producto.QuantityOnHand ?? ''),
    gruposIds: producto.GruposIDs ? producto.GruposIDs.split(',').map(Number) : []
  };
}

// Revisa que el texto sea un número positivo con un máximo de decimales
function esDecimal(texto, maxDecimales) {
  const patron = new RegExp('^\\d+(\\.\\d{1,' + maxDecimales + '})?$');
  return patron.test(texto);
}

// Revisa los datos antes de enviarlos. Devuelve un objeto con un mensaje por cada campo con error
function validar(valores, esEdicion) {
  const errores = {};

  if (!valores.nombre.trim()) errores.nombre = 'El nombre del producto es obligatorio.';
  if (!esEdicion && !valores.proveedorId) errores.proveedorId = 'Seleccione un proveedor.';
  if (!valores.unidadId) errores.unidadId = 'Seleccione la unidad de empaquetamiento.';
  if (!valores.empaqueId) errores.empaqueId = 'Seleccione el empaquetamiento.';

  if (!/^\d+$/.test(valores.cantidadPorEmpaque) || Number(valores.cantidadPorEmpaque) < 1) {
    errores.cantidadPorEmpaque = 'Ingrese un número entero mayor o igual a 1.';
  }

  if (!esDecimal(valores.impuesto, 3) || Number(valores.impuesto) > 100) {
    errores.impuesto = 'Ingrese un porcentaje entre 0 y 100 (use punto para los decimales).';
  }

  if (!esDecimal(valores.precioUnitario, 2) || Number(valores.precioUnitario) <= 0) {
    errores.precioUnitario = 'Ingrese un precio mayor a 0 con hasta 2 decimales.';
  }

  if (valores.precioVenta.trim() && !esDecimal(valores.precioVenta, 2)) {
    errores.precioVenta = 'Ingrese un precio válido con hasta 2 decimales.';
  }

  if (!esDecimal(valores.peso, 3) || Number(valores.peso) <= 0) {
    errores.peso = 'Ingrese un peso mayor a 0 con hasta 3 decimales.';
  }

  if (!valores.palabras.trim()) errores.palabras = 'Las palabras clave son obligatorias.';
  if (!valores.ubicacion.trim()) errores.ubicacion = 'La ubicación es obligatoria.';

  if (!/^\d+$/.test(valores.cantidadDisponible)) {
    errores.cantidadDisponible = 'Ingrese un número entero mayor o igual a 0.';
  }

  if (valores.gruposIds.length === 0) errores.gruposIds = 'Seleccione al menos un grupo.';

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

function ProductoFormulario({ abierto, producto, alCerrar, alGuardar }) {
  const esEdicion = Boolean(producto);

  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [proveedores, setProveedores] = useState([]);
  const [colores, setColores] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [grupos, setGrupos] = useState([]);

  // Opciones de los selectores (se cargan una sola vez)
  useEffect(() => {
    async function cargarOpciones() {
      try {
        const [resProveedores, resColores, resPaquetes, resGrupos] = await Promise.all([
          pedir('/api/proveedores' + armarQuery({ pagina: 1, cantidad: 100 })),
          pedir('/api/generales/colores-productos'),
          pedir('/api/generales/tipos-paquete'),
          pedir('/api/generales/grupos-productos')
        ]);
        setProveedores(resProveedores.datos);
        setColores(resColores.datos);
        setPaquetes(resPaquetes.datos);
        setGrupos(resGrupos.datos);
      } catch (e) {
        setErrorApi('No se pudieron cargar las opciones del formulario. ' + e.message);
      }
    }
    cargarOpciones();
  }, []);

  // Cada vez que se abre, se llenan los campos (con el producto al editar, vacíos al crear)
  useEffect(() => {
    if (abierto) {
      setValores(producto ? valoresDesde(producto) : valoresIniciales);
      setErrores({});
      setErrorApi('');
    }
  }, [abierto, producto]);

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
        multiline={extra.multilinea}
        minRows={extra.multilinea ? 2 : undefined}
        value={valores[clave]}
        onChange={(evento) => cambiar(clave, evento.target.value)}
        error={Boolean(errores[clave])}
        helperText={errores[clave] || extra.ayuda || ' '}
        slotProps={{ htmlInput: { maxLength: extra.maximo, inputMode: extra.numerico ? 'decimal' : undefined } }}
      />
    );
  }

  // Devuelve un selector de una sola opción
  function selector(clave, etiqueta, opciones, campoId, campoNombre, extra = {}) {
    return (
      <TextField
        select
        size="small"
        label={etiqueta}
        required={extra.obligatorio}
        disabled={extra.bloqueado}
        value={valores[clave]}
        onChange={(evento) => cambiar(clave, evento.target.value)}
        error={Boolean(errores[clave])}
        helperText={errores[clave] || extra.ayuda || ' '}
      >
        {extra.opcional && <MenuItem value="">{extra.opcional}</MenuItem>}
        {opciones.map((opcion) => (
          <MenuItem key={opcion[campoId]} value={opcion[campoId]}>
            {opcion[campoNombre]}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  async function enviar(evento) {
    evento.preventDefault();

    const nuevosErrores = validar(valores, esEdicion);
    setErrores(nuevosErrores);
    setErrorApi('');
    if (Object.keys(nuevosErrores).length > 0) return;

    // Los valores undefined no se envían (JSON.stringify los ignora)
    const cuerpo = {
      Nombre_Producto: valores.nombre.trim(),
      ColorID: valores.colorId ? Number(valores.colorId) : undefined,
      UnitPackageID: Number(valores.unidadId),
      OuterPackageID: Number(valores.empaqueId),
      Marca: valores.marca.trim() || undefined,
      Size: valores.tamano.trim() || undefined,
      QuantityPerOuter: Number(valores.cantidadPorEmpaque),
      TaxRate: Number(valores.impuesto),
      UnitPrice: Number(valores.precioUnitario),
      RecommendedPrice: valores.precioVenta.trim() ? Number(valores.precioVenta) : undefined,
      TypicalWeight: Number(valores.peso),
      MarketingSearchDetails: valores.palabras.trim(),
      BinLocation: valores.ubicacion.trim(),
      QuantityOnHand: Number(valores.cantidadDisponible),
      Grupos_Productos: valores.gruposIds
    };

    if (!esEdicion) cuerpo.ProveedorID = Number(valores.proveedorId);

    setGuardando(true);
    try {
      if (esEdicion) {
        await pedir('/api/productos/' + producto.StockItemID, {
          method: 'PUT',
          body: JSON.stringify(cuerpo)
        });
        alGuardar('El producto se actualizó correctamente.');
      } else {
        await pedir('/api/productos', { method: 'POST', body: JSON.stringify(cuerpo) });
        alGuardar('El producto se creó correctamente.');
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
      <DialogTitle>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>

      <DialogContent dividers>
        {errorApi && <Alert severity="error" sx={{ mb: 2 }}>{errorApi}</Alert>}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Los campos marcados con * son obligatorios.
        </Typography>

        <Seccion titulo="Datos del producto">
          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            {campo('nombre', 'Nombre del producto', { obligatorio: true, maximo: 100 })}
          </Box>
          {selector('proveedorId', 'Proveedor', proveedores, 'SupplierID', 'SupplierName', {
            obligatorio: !esEdicion,
            bloqueado: esEdicion,
            ayuda: esEdicion ? 'El proveedor no se puede modificar' : ' '
          })}
          {selector('colorId', 'Color', colores, 'ColorID', 'ColorName', { opcional: 'Sin color' })}
          {campo('marca', 'Marca', { maximo: 50 })}
          {campo('tamano', 'Tamaño', { maximo: 20 })}
        </Seccion>

        <Seccion titulo="Empaquetamiento">
          {selector('unidadId', 'Unidad de empaquetamiento', paquetes, 'PackageTypeID', 'PackageTypeName', { obligatorio: true })}
          {selector('empaqueId', 'Empaquetamiento externo', paquetes, 'PackageTypeID', 'PackageTypeName', { obligatorio: true })}
          {campo('cantidadPorEmpaque', 'Cantidad de empaquetamiento', {
            obligatorio: true, maximo: 9, ayuda: 'Unidades por empaque externo'
          })}
          {campo('peso', 'Peso (kg)', { obligatorio: true, maximo: 12, numerico: true, ayuda: 'Hasta 3 decimales' })}
        </Seccion>

        <Seccion titulo="Precios e impuesto">
          {campo('precioUnitario', 'Precio unitario ($)', { obligatorio: true, maximo: 12, numerico: true, ayuda: 'Hasta 2 decimales' })}
          {campo('precioVenta', 'Precio de venta recomendado ($)', { maximo: 12, numerico: true, ayuda: 'Opcional' })}
          {campo('impuesto', 'Impuesto (%)', { obligatorio: true, maximo: 7, numerico: true, ayuda: 'Entre 0 y 100' })}
        </Seccion>

        <Seccion titulo="Inventario">
          {campo('cantidadDisponible', 'Cantidad disponible', { obligatorio: true, maximo: 9 })}
          {campo('ubicacion', 'Ubicación', { obligatorio: true, maximo: 20, ayuda: 'Ejemplo: A-01' })}
        </Seccion>

        <Seccion titulo="Clasificación">
          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={grupos}
              value={grupos.filter((grupo) => valores.gruposIds.includes(grupo.StockGroupID))}
              getOptionLabel={(grupo) => grupo.StockGroupName}
              isOptionEqualToValue={(opcion, seleccionado) => opcion.StockGroupID === seleccionado.StockGroupID}
              onChange={(evento, seleccionados) =>
                cambiar('gruposIds', seleccionados.map((grupo) => grupo.StockGroupID))
              }
              noOptionsText="No hay grupos"
              renderInput={(parametros) => (
                <TextField
                  {...parametros}
                  label="Grupos"
                  size="small"
                  required
                  error={Boolean(errores.gruposIds)}
                  helperText={errores.gruposIds || 'Puede seleccionar más de un grupo'}
                />
              )}
            />
          </Box>
          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            {campo('palabras', 'Palabras clave', {
              obligatorio: true, multilinea: true, maximo: 500,
              ayuda: 'Texto de mercadeo que se usa para buscar el producto'
            })}
          </Box>
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

export default ProductoFormulario;