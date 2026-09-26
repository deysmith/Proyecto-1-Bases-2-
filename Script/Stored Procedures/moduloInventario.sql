/*
Se encarga de obtener el nombre, grupos y cantidad en inventario de los productos
Entradas:
    - No recibe entradas
Salidas:
    - Nombre, grupos y cantidad en inventario de los productos registrados
Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE GetProductos
AS
BEGIN
  SELECT
      p.StockItemName,
      STRING_AGG(np.StockGroupName, ', ') as [Group],
      ip.QuantityOnHand

  FROM productos p
  LEFT JOIN inventario_productos ip on ip.StockItemID = p.StockItemID
  LEFT JOIN grupos_productos gp on gp.StockItemID = p.StockItemID
  LEFT JOIN nombre_grupo_producto np on np.StockGroupID = gp.StockGroupID
  GROUP BY p.StockItemName, ip.QuantityOnHand
  ORDER BY p.StockItemName ASC
END
GO


/*
Se encarga de obtener el nombre, grupos y cantidad en inventario de los productos
que su nombre o grupo coincide con el criterio de búsqueda
Entradas:
    - @Criterio - nvarchar(100)
Salidas:
    - Nombre, grupos y cantidad en inventario de los productos registrados
Restricciones:
    - @Criterio debe tener un largo de 0 a 100 caracteres
*/
CREATE PROCEDURE BuscarProductos
  @Criterio nvarchar(100)
AS
BEGIN
  SELECT
      p.StockItemName,
      STRING_AGG(np.StockGroupName, ', ') as [Group],
      ip.QuantityOnHand

  FROM productos p
  LEFT JOIN inventario_productos ip on ip.StockItemID = p.StockItemID
  LEFT JOIN grupos_productos gp on gp.StockItemID = p.StockItemID
  LEFT JOIN nombre_grupo_producto np on np.StockGroupID = gp.StockGroupID
  GROUP BY p.StockItemName, ip.QuantityOnHand
  HAVING  p.StockItemName LIKE '%' + @Criterio + '%' OR STRING_AGG(np.StockGroupName, ', ') LIKE '%' + @Criterio + '%'
  ORDER BY p.StockItemName ASC
END
GO

/*
Devuelve los grupos de productos que tienen al menos un producto asociado
Entradas:
    - No recibe entradas
Salidas:
    - Grupo de productos que tienen al menos un producto asociadp
Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerGruposProductos
AS
BEGIN
  SELECT
      DISTINCT (ng.StockGroupName)
  FROM nombre_grupo_producto ng
  INNER JOIN grupos_productos gp on gp.StockGroupID = ng.StockGroupID
END
GO

/*

Entradas:
    -
Salidas:
    -
Restricciones:
    -
*/
CREATE PROCEDURE ObtenerDatosProducto
  @Nombre_Producto nvarchar(100)
AS
BEGIN
  SELECT
    p.StockItemName,
    pr.SupplierName,
    ISNULL(c.ColorName, 'No posee color registrado') as Color,
    tp.PackageTypeName as UnitPackage,
    tp1.PackageTypeName as OuterPackage,
    p.QuantityPerOuter,
    ISNULL(p.Brand, 'No posee marca') as Brand,
    ISNULL(p.Size, 'No indica tamaño') as Size,
    p.TaxRate,
    p.UnitPrice,
    p.RecommendedRetailPrice,
    p.TypicalWeightPerUnit,
    ip.QuantityOnHand,
    ip.BinLocation,
    p.SearchDetails

  FROM productos p
  INNER JOIN proveedores pr on pr.SupplierID = p.SupplierID
  INNER JOIN tipos_paquetes_productos tp on tp.PackageTypeID = p.UnitPackageID
  INNER JOIN tipos_paquetes_productos tp1 on tp1.PackageTypeID = p.OuterPackageID
  LEFT JOIN inventario_productos ip on ip.StockItemID = p.StockItemID
  LEFT JOIN colores_productos c on c.ColorID = p.ColorID
  WHERE p.StockItemName = @Nombre_Producto
END
GO

---------- Pruebas de los Stored Procedures ----------
EXECUTE GetProductos
EXECUTE BuscarProductos 'The Gu'
EXECUTE ObtenerGruposProductos
EXECUTE ObtenerDatosProducto '"The Gu" red shirt XML tag t-shirt (Black) 3XL'

-- Consultas
select * from productos
select * from nombre_grupo_producto
select * from grupos_productos
select * from tipos_paquetes_productos