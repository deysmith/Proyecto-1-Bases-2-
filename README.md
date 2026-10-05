# Proyecto #1 - Bases de Datos II

<p align="center">
  <img src="https://img.shields.io/badge/Curso-IC4302_Bases_de_Datos_II-orange" />
  <img src="https://img.shields.io/badge/-II_Semestre_2026-brown" />
</p>

---
## Información General

**Nombre y carné de los integrantes**: 
- Juan David Mora Acuña | 2024126028
- Deywenie Smith Gregory | 2024096722

**Estado del proyecto:** 
Muy bueno/Completado

**Objetivos alcanzados:**
- Gestión de clientes: Consulta, filtros acumulativos, restauración de filtros, ordenamiento, detalle de clientes y visualización de ubicación.
- Gestión de proveedores: Consulta, filtros por nombre y categoría, ordenamiento y detalle completo del proveedor.
- Gestión de inventarios: Consulta de productos, filtros por nombre, grupo y cantidad, detalle del producto, existencias y ubicación.
- Gestión de ventas: Consulta de facturas, filtros por cliente, fechas y montos, detalle del encabezado y líneas de factura.
- Reportes y estadísticas: Implementación de los 10 reportes solicitados, incluyendo ``ROLLUP``, ``DENSE_RANK``, particiones, matrices, seguimiento de compras, rotación de inventario y métodos de envío.
- Procedimientos almacenados: consultas, filtros, agrupaciones y transformaciones realizadas directamente en la base de datos.
- Sinónimos: Configuración de sinónimos para el acceso a las tablas desde los procedimientos almacenados.
- Transacciones: uso de ``TRANSACTION``, ``COMMIT``, ``ROLLBACK`` y manejo de errores para las operaciones de inserción, actualización y eliminación.
- Paginación: Implementación de consultas paginadas para facilitar el manejo de grandes cantidades de registros.
- Validaciones y manejo de errores: Validación de datos y presentación de mensajes informativos ante errores.
- Interfaz web: Desarrollo de una interfaz intuitiva y organizada, manteniendo la lógica de procesamiento y transformación de datos en la base de datos.

**Objetivos no alcanzados:**  
No se presentaron objetivos no alcanzados. Se desarrollaron todos los requerimientos solicitados en el proyecto.

**Enlace del video:** 
[Proyecto #1 - Bases de Datos ll](https://youtu.be/m15RTKX9xMc?si=zMhnqMXU-Cp5HG1-)

--- 

## Descripción del trabajo
El proyecto consiste en el desarrollo de una aplicación web para la gestión, consulta y análisis de información de la base de datos `WideWorldImporters`. La solución permite gestionar clientes, proveedores, inventarios y ventas, además de consultar diferentes reportes y datos estadísticos.

La lógica de consulta, filtrado, agrupación y transformación de los datos se encuentra implementada mediante procedimientos almacenados en SQL Server, mientras que la aplicación web se encarga de enviar los parámetros y presentar la información al usuario.

## Características del producto
- La solución está implementada en una distribución de Linux (`Ubuntu 22.04.5`), mediante una máquina virtual.
- El motor de bases de datos utilizado es SQL Server.
- La base de datos utilizada es `WideWorldImporters`.
- La API fue desarrollada utilizando `Node.js` y `Express`.
- La página web fue desarrollada con ``React + Vite``.

## Instrucciones de instalación

### Instalación de Base de datos
La base de datos utilizada en el proyecto es `WideWorldImporters`.

Para instalarla, se debe restaurar la base de datos proporcionada por Microsoft en el siguiente enlace: [Instalación de BD de Wide World Importers](https://learn.microsoft.com/en-us/sql/samples/wide-world-importers-oltp-install-configure?view=sql-server-ver17). Luego, se deben ejecutar los scripts SQL incluidos en la carpeta [Script](https://github.com/deysmith/Proyecto-1-Bases-2-/tree/ceeb988e7b8f45faaae959aafba2142c8b4533ab/Script) para crear los sinónimos y procedimientos almacenados necesarios.

### Instalación y ejecución del programa
El proyecto puede instalarse mediante la clonación o descarga del repositorio

Antes de ejecutar el proyecto, es necesario tener instalado **Node.js**, ya que se utiliza para ejecutar la API y administrar las dependencias del proyecto.

- **Opción 1**: Clonación del repositorio
Para clonar el repositorio se deben ejecutar el siguiente comando en una terminal:

    ```bash
    git clone https://github.com/deysmith/Proyecto-1-Bases-2-.git
    cd Proyecto-1-Bases-2-
    ```

- **Opción 2**: Descargar el repositorio
Desde GitHub, seleccionar Code, luego Download ZIP y descomprimir el archivo en la ubicación deseada.

Una vez obtenido el proyecto, se debe navegar a la carpeta [Api](https://github.com/deysmith/Proyecto-1-Bases-2-/tree/ceeb988e7b8f45faaae959aafba2142c8b4533ab/Api). Una vez en esta carpeta, se debe crear un archivo ``.env `` en donde se crearán las variables de entorno necesarias para la conexión con la base de datos.

Las variables de entorno deben configurarse de la siguiente manera:
```env
PORT=3000
DB_SERVER=servidor
DB_PORT=1433
DB_NAME=WideWorldImporters
DB_USER=usuario
DB_PASSWORD=contraseña
```

Una vez configuradas las variables de entorno, es necesario abrir dos terminales. En una será ejecutada la API y en la otra, la página web
#### Terminal de la API
Al ingresar por primera vez a la carpeta de la [Api](https://github.com/deysmith/Proyecto-1-Bases-2-/tree/ceeb988e7b8f45faaae959aafba2142c8b4533ab/Api), se deben instalar las dependencias mediante el siguiente comando:

```bash
npm install 
```
Y luego, para ejecutar la API se utiliza el siguiente comando:
```bash
npm start 
```

#### Terminal de la Página Web
En la segunda terminal, se debe navegar a la carpeta [Website](https://github.com/deysmith/Proyecto-1-Bases-2-/tree/ceeb988e7b8f45faaae959aafba2142c8b4533ab/Website) e instalar sus dependencias con el siguiente comando:
```bash
npm install 
```
Para ejecutar la página web se utiliza el siguiente comando:
```bash
npm run dev 
```

Al ejecutar este comando, se mostrará en la terminal la dirección local donde se encuentra disponible la aplicación. Se debe acceder a la dirección indicada para utilizar la página web.

## Estructura del programa
El proyecto se encuentra dividido en tres componentes principales: la base de datos, la API y la página web.

### Scripts
Los scripts relacionados con la base de datos se encuentran dentro de la carpeta `Script`:

```text
Script/
├── creacionSinonimos.sql
└── Stored Procedures/
    ├── generales.sql
    ├── moduloClientes.sql
    ├── moduloInventario.sql
    ├── moduloProveedores.sql
    ├── moduloVentas.sql
    └── reportesDatosEstadisticos.sql
```

- ``creacionSinonimos.sql``: Contiene la creación de los sinónimos utilizados para acceder a las tablas de WideWorldImporters.
- ``generales.sql``: Contiene los procedimientos almacenados utilizados como combobox y campos de búsqueda en la página.
- ``moduloClientes.sql``: Contiene los procedimientos almacenados relacionados con la gestión de clientes.
- ``moduloInventario.sql``: Contiene los procedimientos almacenados relacionados con la gestión de inventarios y productos.
- ``moduloProveedores.sql``: Contiene los procedimientos almacenados relacionados con la gestión de proveedores.
- ``moduloVentas.sql``: Contiene los procedimientos almacenados relacionados con la gestión de ventas y facturas.
- ``reportesDatosEstadisticos.sql``: Contiene los procedimientos almacenados correspondientes a los reportes y datos estadísticos solicitados.

### API
La API fue desarrollada utilizando `Node.js` y `Express`. Se encarga de recibir las solicitudes de la aplicación web, enviar los parámetros correspondientes a los procedimientos almacenados y devolver los resultados.

Al igual que los scripts de la base de datos, la API se encuentra organizada por módulos para facilitar su mantenimiento y comprensión.

La estructura principal de la API es la siguiente:

```text
Api/
└── src/
    ├── db.js
    ├── helpers.js
    ├── server.js
    └── routes/
        ├── clientes.js
        ├── facturas.js
        ├── generales.js
        ├── productos.js
        ├── proveedores.js
        └── reportes.js
```

### Aplicación web
La interfaz fue desarrollada utilizando `React + Vite`, aprovechando el uso de componentes reutilizables para organizar y facilitar el desarrollo de las diferentes funcionalidades del sistema.

La aplicación se encarga de presentar la información al usuario y permitir la interacción con los diferentes módulos, filtros, consultas y reportes, no realiza la agrupación ni transformación de los datos, sino que recibe la información procesada directamente desde la base de datos.

### Diseño de los Procedimientos Almacenados
Los procedimientos almacenados concentran la lógica de consulta, filtrado, agrupación y transformación de los datos. Se encuentran separados por módulos para facilitar su organización y mantenimiento.

## Funcionalidades del sistema

### Clientes
- Consulta de clientes.
- Búsqueda y filtrado por diferentes criterios.
- Visualización del detalle del cliente.
- Eliminación de cliente.*
- Edición de datos del cliente

### Proveedores
- Consulta de proveedores.
- Filtrado por nombre y categoría.
- Visualización del detalle del proveedor.
- Eliminación de proveedor.*
- Edición de datos del proveedor

### Inventario
- Consulta de productos.
- Filtrado por nombre, grupo y cantidad.
- Visualización del detalle del producto.
- Eliminación de producto.*
- Edición de datos del producto

### Ventas
- Consulta de facturas.
- Filtrado por cliente, fechas y montos.
- Visualización del encabezado y las líneas de la factura.
- Eliminación de factura.*
- Edición de una factura.

### Reportes y datos estadísticos
- Reporte de compras a proveedores.
- Reporte de ventas por cliente.
- Top 5 de productos con más ganancia por año.
- Top 5 de clientes con más facturas emitidas a su nombre.
- Top 5 de proveedores con más órdenes de compra.
- Matriz de resumen de ventas
- Seguimiento de cliente
- Seguimiento de proveedores
- Rotación de inventario
- Método de envío favorito por cuidad donde se remitió la venta

Nota: * No se pueden eliminar objetos que posean relaciones con otras tablas