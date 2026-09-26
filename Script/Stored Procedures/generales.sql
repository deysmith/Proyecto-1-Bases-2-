/*
Este es para el combobox, devuelve todas las categorías, el otro es para el filtro
El otro es para los filtros, para solo mostrar los que proveedores asociados.
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

EXECUTE ObtenerTodasCategoriasProveedores
EXECUTE ObtenerTodasCategoriasClientes
EXECUTE ObtenerMetodosDeEntregaGeneral
EXECUTE ObtenerTodasGruposProductos