USE WideWorldImporters;
GO

/*
Este es para el combobox, devuelve todas las categorías.
El otro es para los filtros, para solo mostrar los que tienen proveedores asociados.
*/

CREATE PROCEDURE ObtenerTodasCategoriasProveedores
AS
BEGIN
  SELECT
    c.SupplierCategoryName,
    c.SupplierCategoryID
  FROM categorias_proveedores c
END
GO

CREATE PROCEDURE ObtenerTodasCategoriasClientes
AS
BEGIN
  SELECT 
      cc.CustomerCategoryName,
      cc.CustomerCategoryID
  FROM categorias_clientes cc
END
GO

CREATE PROCEDURE ObtenerMetodosDeEntregaGeneral
AS
BEGIN
  SELECT
      me.DeliveryMethodName,
      me.DeliveryMethodID
  FROM metodos_entrega me
END
GO

CREATE PROCEDURE ObtenerTodasGruposProductos
AS
BEGIN
  SELECT
      ng.StockGroupName,
      ng.StockGroupID
  FROM nombre_grupo_producto ng
END
GO

CREATE PROCEDURE ObtenerTiposDePaquete
AS
BEGIN
  SELECT
    tp.PackageTypeName,
    tp.PackageTypeID
  FROM tipos_paquetes_productos tp
END
GO

CREATE PROCEDURE ObtenerColoresProductos
AS
BEGIN
  SELECT
    c.ColorName,
    c.ColorID
  FROM colores_productos c
END
GO

CREATE PROCEDURE ObtenerFechasVentasAnioProveedor
AS
BEGIN
  SELECT DISTINCT(YEAR(f.InvoiceDate))
  FROM facturas f
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