import { pedir } from './api';
import { decimal, dinero, entero, fecha } from './formato';

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const opcionesMeses = meses.map((mes, indice) => ({ valor: indice + 1, texto: mes }));

// Años que existen en la base de datos
async function cargarAnios() {
  const respuesta = await pedir('/api/generales/anios-ventas');
  return respuesta.datos
    .map((fila) => Object.values(fila)[0])
    .sort((a, b) => a - b)
    .map((anio) => ({ valor: anio, texto: String(anio) }));
}

// Devuelve una función que carga las opciones de un selector desde la API
function cargarOpciones(ruta, campoId, campoNombre) {
  return async () => {
    const respuesta = await pedir(ruta);
    return respuesta.datos.map((fila) => ({ valor: fila[campoId], texto: fila[campoNombre] }));
  };
}

const cargarGrupos = cargarOpciones('/api/generales/grupos-productos', 'StockGroupID', 'StockGroupName');

// Filtros que se repiten en varios reportes
const filtroAnioInicio = { clave: 'anioInicio', etiqueta: 'Año inicial', tipo: 'select', opciones: cargarAnios, todos: 'Cualquiera' };
const filtroAnioFin = { clave: 'anioFin', etiqueta: 'Año final', tipo: 'select', opciones: cargarAnios, todos: 'Cualquiera' };
const filtroAnio = { clave: 'anio', etiqueta: 'Año', tipo: 'select', opciones: cargarAnios };
const filtroMes = { clave: 'mes', etiqueta: 'Mes', tipo: 'select', opciones: opcionesMeses };
const filtroCategoria = { clave: 'categoriaId', etiqueta: 'Categoría de producto', tipo: 'select', opciones: cargarGrupos, todos: 'Todas' };
const filtroSubcategoria = { clave: 'subcategoriaId', etiqueta: 'Subcategoría de producto', tipo: 'select', opciones: cargarGrupos, todos: 'Todas' };

const filtroProducto = {
  clave: 'productoId',
  etiqueta: 'Producto',
  tipo: 'busqueda',
  ruta: '/api/productos/buscar',
  parametro: 'nombre',
  campoId: 'StockItemID',
  campoNombre: 'StockItemName'
};

// Revisa que el año inicial no sea mayor que el final
function validarRangoAnios(filtros) {
  if (filtros.anioInicio && filtros.anioFin && Number(filtros.anioInicio) > Number(filtros.anioFin)) {
    return { anioFin: 'El año final debe ser igual o posterior al inicial.' };
  }
  return {};
}

// Resalta las filas de totales de los reportes con ROLLUP
function esFilaTotal(fila) {
  const nombre = String(fila.SupplierName || fila.CustomerName || '');
  const categoria = String(fila.SupplierCategoryName || fila.CustomerCategoryName || '');

  return (
    nombre === 'Total General' ||
    nombre === 'Montos Generales' ||
    categoria.startsWith('Total de ') ||
    categoria.startsWith('Montos de ')
  );
}

function estiloTotales(fila) {
  return esFilaTotal(fila) ? { bgcolor: 'action.hover', '& td': { fontWeight: 700 } } : {};
}

const columnasMontos = [
  { campo: 'Alto', titulo: 'Monto más alto', alinear: 'right', formato: dinero },
  { campo: 'Bajo', titulo: 'Monto más bajo', alinear: 'right', formato: dinero },
  { campo: 'Promedio', titulo: 'Promedio', alinear: 'right', formato: dinero }
];

export const reportes = [
  {
    id: 'compras-proveedores',
    titulo: 'Compras a proveedores',
    descripcion: 'Montos más alto, más bajo y compra promedio que se le hace a cada proveedor, agrupados por proveedor y categoría.',
    ruta: '/api/reportes/compras-proveedores',
    paginado: true,
    filtros: [
      { clave: 'proveedor', etiqueta: 'Nombre del proveedor', tipo: 'texto' },
      { clave: 'categoria', etiqueta: 'Categoría', tipo: 'texto' }
    ],
    columnas: [
      { campo: 'SupplierName', titulo: 'Proveedor' },
      { campo: 'SupplierCategoryName', titulo: 'Categoría' },
      ...columnasMontos
    ],
    estiloFila: estiloTotales
  },
  {
    id: 'ventas-clientes',
    titulo: 'Ventas por cliente',
    descripcion: 'Montos más alto, más bajo y venta promedio de cada cliente, agrupados por cliente y categoría.',
    ruta: '/api/reportes/ventas-clientes',
    paginado: true,
    filtros: [
      { clave: 'cliente', etiqueta: 'Nombre del cliente', tipo: 'texto' },
      { clave: 'categoria', etiqueta: 'Categoría', tipo: 'texto' }
    ],
    columnas: [
      { campo: 'CustomerName', titulo: 'Cliente' },
      { campo: 'CustomerCategoryName', titulo: 'Categoría' },
      ...columnasMontos
    ],
    estiloFila: estiloTotales
  },
  {
    id: 'top-productos',
    titulo: 'Top 5 productos',
    descripcion: 'Los 5 productos que generan más ganancia en las ventas de cada año.',
    ruta: '/api/reportes/top-productos',
    paginado: true,
    filtros: [filtroAnioInicio, filtroAnioFin],
    validar: validarRangoAnios,
    columnas: [
      { campo: 'Years', titulo: 'Año' },
      { campo: 'Rank', titulo: 'Posición', alinear: 'right' },
      { campo: 'StockItemName', titulo: 'Producto' },
      { campo: 'Earnings', titulo: 'Ganancia', alinear: 'right', formato: dinero }
    ]
  },
  {
    id: 'top-clientes',
    titulo: 'Top 5 clientes',
    descripcion: 'Los 5 clientes con más facturas emitidas a su nombre en cada año, con el monto total facturado.',
    ruta: '/api/reportes/top-clientes',
    paginado: true,
    filtros: [filtroAnioInicio, filtroAnioFin],
    validar: validarRangoAnios,
    columnas: [
      { campo: 'Years', titulo: 'Año' },
      { campo: 'Rank', titulo: 'Posición', alinear: 'right' },
      { campo: 'CustomerName', titulo: 'Cliente' },
      { campo: 'TotalFacturas', titulo: 'Facturas emitidas', alinear: 'right', formato: entero },
      { campo: 'Monto', titulo: 'Monto total facturado', alinear: 'right', formato: dinero }
    ]
  },
  {
    id: 'top-proveedores',
    titulo: 'Top 5 proveedores',
    descripcion: 'Los 5 proveedores con más órdenes de compra emitidas en cada año, con el monto total.',
    ruta: '/api/reportes/top-proveedores',
    paginado: true,
    filtros: [filtroAnioInicio, filtroAnioFin],
    validar: validarRangoAnios,
    columnas: [
      { campo: 'Years', titulo: 'Año' },
      { campo: 'Rank', titulo: 'Posición', alinear: 'right' },
      { campo: 'SupplierName', titulo: 'Proveedor' },
      { campo: 'TotalOrdenes', titulo: 'Órdenes de compra', alinear: 'right', formato: entero },
      { campo: 'Monto', titulo: 'Monto total', alinear: 'right', formato: dinero }
    ]
  },
  {
    id: 'resumen-categorias',
    titulo: 'Matriz por categoría',
    descripcion: 'Matriz resumen de las ventas de cada categoría de productos por año.',
    ruta: '/api/reportes/resumen-categorias',
    paginado: false,
    filtros: [],
    columnas: null
  },
  {
    id: 'seguimiento-clientes',
    titulo: 'Seguimiento de clientes',
    descripcion: 'Resumen mensual de las compras de cada cliente: monto total, primera y última factura del mes, y cantidad total, mínima y máxima.',
    ruta: '/api/reportes/seguimiento-clientes',
    paginado: true,
    filtros: [
      {
        clave: 'clienteId',
        etiqueta: 'Cliente',
        tipo: 'busqueda',
        ruta: '/api/clientes/buscar',
        parametro: 'criterio',
        campoId: 'CustomerID',
        campoNombre: 'CustomerName'
      },
      filtroAnio,
      filtroMes,
      filtroCategoria,
      filtroSubcategoria
    ],
    columnas: [
      { campo: 'CustomerName', titulo: 'Cliente' },
      { campo: 'Years', titulo: 'Año' },
      { campo: 'Months', titulo: 'Mes', formato: (valor) => meses[valor - 1] },
      { campo: 'Total', titulo: 'Monto total', alinear: 'right', formato: dinero },
      { campo: 'FirstInvoice', titulo: 'Primera factura', formato: fecha },
      { campo: 'LastInvoice', titulo: 'Última factura', formato: fecha },
      { campo: 'TotalProducts', titulo: 'Cantidad total', alinear: 'right', formato: entero },
      { campo: 'MinProducts', titulo: 'Cantidad mínima', alinear: 'right', formato: entero },
      { campo: 'MaxProducts', titulo: 'Cantidad máxima', alinear: 'right', formato: entero }
    ]
  },
  {
    id: 'seguimiento-proveedores',
    titulo: 'Seguimiento de proveedores',
    descripcion: 'Resumen mensual de las compras a cada proveedor: monto total, primera y última compra del mes, y cantidad total, mínima y máxima.',
    ruta: '/api/reportes/seguimiento-proveedores',
    paginado: true,
    filtros: [
      {
        clave: 'proveedorId',
        etiqueta: 'Proveedor',
        tipo: 'select',
        opciones: cargarOpciones('/api/proveedores?cantidad=100', 'SupplierID', 'SupplierName')
      },
      filtroAnio,
      filtroMes,
      filtroCategoria,
      filtroSubcategoria
    ],
    columnas: [
      { campo: 'SupplierName', titulo: 'Proveedor' },
      { campo: 'Years', titulo: 'Año' },
      { campo: 'Months', titulo: 'Mes', formato: (valor) => meses[valor - 1] },
      { campo: 'Total', titulo: 'Monto total', alinear: 'right', formato: dinero },
      { campo: 'FirstInvoice', titulo: 'Primera compra', formato: fecha },
      { campo: 'LastInvoice', titulo: 'Última compra', formato: fecha },
      { campo: 'TotalProducts', titulo: 'Cantidad total', alinear: 'right', formato: entero },
      { campo: 'MinProducts', titulo: 'Cantidad mínima', alinear: 'right', formato: entero },
      { campo: 'MaxProducts', titulo: 'Cantidad máxima', alinear: 'right', formato: entero }
    ]
  },
  {
    id: 'rotacion-inventario',
    titulo: 'Rotación de inventario',
    descripcion: 'Promedio de días de rotación del inventario de cada producto, a partir de las unidades vendidas y el inventario promedio.',
    ruta: '/api/reportes/rotacion-inventario',
    paginado: true,
    filtros: [
      filtroProducto,
      filtroAnio,
      {
        clave: 'proveedorId',
        etiqueta: 'Proveedor',
        tipo: 'select',
        opciones: cargarOpciones('/api/proveedores?cantidad=100', 'SupplierID', 'SupplierName')
      },
      filtroCategoria
    ],
    columnas: [
      { campo: 'StockItemName', titulo: 'Producto' },
      { campo: 'SupplierName', titulo: 'Proveedor' },
      { campo: 'Years', titulo: 'Año' },
      { campo: 'DiasRotacionPromedio', titulo: 'Días de rotación promedio', alinear: 'right', formato: decimal }
    ]
  },
  {
    id: 'metodo-envio-favorito',
    titulo: 'Envío favorito',
    descripcion: 'Método de envío favorito según la ciudad a donde se remitió la venta, ordenado por la cantidad de ventas realizadas.',
    ruta: '/api/reportes/metodo-envio-favorito',
    paginado: true,
    filtros: [
      filtroAnio,
      filtroMes,
      {
        clave: 'categoriaClienteId',
        etiqueta: 'Categoría de cliente',
        tipo: 'select',
        opciones: cargarOpciones('/api/generales/categorias-clientes', 'CustomerCategoryID', 'CustomerCategoryName'),
        todos: 'Todas'
      },
      { ...filtroCategoria, clave: 'categoriaProductoId' },
      filtroProducto
    ],
    columnas: [
      { campo: 'CityName', titulo: 'Ciudad' },
      { campo: 'DeliveryMethodName', titulo: 'Método de envío favorito' },
      { campo: 'TotalSales', titulo: 'Ventas realizadas', alinear: 'right', formato: entero }
    ]
  }
];