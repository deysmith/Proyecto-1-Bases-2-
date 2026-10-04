USE WideWorldImporters;
GO

/*
Este es para el combobox, devuelve todas las categorías.
El otro es para los filtros, para solo mostrar los que tienen proveedores asociados.
*/

CREATE OR ALTER PROCEDURE ObtenerTodasCategoriasProveedores
AS
BEGIN
  SELECT
    c.SupplierCategoryName,
    c.SupplierCategoryID
  FROM categorias_proveedores c
END
GO

CREATE OR ALTER PROCEDURE ObtenerTodasCategoriasClientes
AS
BEGIN
  SELECT 
      cc.CustomerCategoryName,
      cc.CustomerCategoryID
  FROM categorias_clientes cc
END
GO

CREATE OR ALTER PROCEDURE ObtenerMetodosDeEntregaGeneral
AS
BEGIN
  SELECT
      me.DeliveryMethodName,
      me.DeliveryMethodID
  FROM metodos_entrega me
END
GO

CREATE OR ALTER PROCEDURE ObtenerTodasGruposProductos
AS
BEGIN
  SELECT
      ng.StockGroupName,
      ng.StockGroupID
  FROM nombre_grupo_producto ng
END
GO

CREATE OR ALTER PROCEDURE ObtenerTiposDePaquete
AS
BEGIN
  SELECT
    tp.PackageTypeName,
    tp.PackageTypeID
  FROM tipos_paquetes_productos tp
END
GO

CREATE OR ALTER PROCEDURE ObtenerColoresProductos
AS
BEGIN
  SELECT
    c.ColorName,
    c.ColorID
  FROM colores_productos c
END
GO

CREATE OR ALTER PROCEDURE ObtenerFechasVentasAnioProveedor
AS
BEGIN
  SELECT DISTINCT(YEAR(f.InvoiceDate)) AS Anio
  FROM facturas f
END
GO

CREATE OR ALTER PROCEDURE BuscarPersonas
  @Criterio nvarchar(50) = NULL,
  @SoloVendedores bit = 0,
  @SoloEmpleados bit = 0,
  @CantidadRegistros int = 20
AS
BEGIN
  SELECT TOP (@CantidadRegistros)
      p.PersonID,
      p.FullName
  FROM personas p
  WHERE (
    @Criterio IS NULL
    OR @Criterio = ''
    OR p.FullName LIKE @Criterio + '%'
    OR p.FullName LIKE '% ' + @Criterio + '%'
  ) AND (
    @SoloVendedores = 0
    OR p.IsSalesperson = 1
  ) AND (
    @SoloEmpleados = 0
    OR p.IsEmployee = 1
  )
  ORDER BY p.FullName
END
GO

EXECUTE ObtenerTodasCategoriasProveedores
EXECUTE ObtenerTodasCategoriasClientes
EXECUTE ObtenerMetodosDeEntregaGeneral
EXECUTE ObtenerTodasGruposProductos

-- Para los campos de LastEditedBy cree una nueva 'persona'
INSERT INTO personas (
    FullName,
    PreferredName,
    IsPermittedToLogon,
    IsExternalLogonProvider,
    IsSystemUser,
    IsEmployee,
    IsSalesperson,
    LastEditedBy
)
VALUES (
    'PagWeb',
    'PagWeb',
    0,
    0,
    1,
    1,
    0,
    1
)

SELECT * FROM personas WHERE FullName = 'PagWeb'