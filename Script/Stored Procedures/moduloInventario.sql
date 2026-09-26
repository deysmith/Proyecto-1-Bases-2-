/*
Se encarga de obtener el nombre, grupos y cantidad en inventario de los productos
Entradas:
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
    - Nombre, grupos y cantidad en inventario de los productos registrados
Restricciones:
    - @NumeroPagina debe ser un número entero positivo
    - @CantidadRegistros deber ser mayor a 0 (entero positivo)
*/
CREATE PROCEDURE GetProductos
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
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
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO


/*
Se encarga de obtener el nombre, grupos y cantidad en inventario de los productos
que su nombre o grupo coincide con el criterio de búsqueda
Entradas:
    - @Nombre - nvarchar(100): Coincidencia de nombre
    - @GrupoID - int: Identificador del grupo de productos
    - @CantidadMinima - int: Cantidad minimo de productos
    - @CantidadMaxima - int: Cantidad maxima de productos
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
    - Nombre, grupos y cantidad en inventario de los productos registrados
Restricciones:
    - @NumeroPagina debe ser un número entero positivo
    - @CantidadRegistros deber ser mayor a 0 (entero positivo)
*/
CREATE PROCEDURE BuscarProductos
  @Nombre nvarchar(100) = NULL,
  @GrupoID int = NULL,
  @CantidadMinima int = NULL,
  @CantidadMaxima int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
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
  WHERE (
    @Nombre IS NULL
    OR @Nombre = ''
    OR p.StockItemName LIKE '%' + @Nombre + '%'
  ) AND (
    @GrupoID IS NULL
    OR gp.StockGroupID = @GrupoID
  ) AND (
    @CantidadMinima IS NULL
    OR ip.QuantityOnHand >= @CantidadMinima
  ) AND (
    @CantidadMaxima IS NULL
    OR ip.QuantityOnHand <= @CantidadMaxima 
  )

  GROUP BY p.StockItemName, ip.QuantityOnHand
  ORDER BY p.StockItemName ASC
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
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
      DISTINCT (ng.StockGroupName),
      ng.StockGroupID
  FROM nombre_grupo_producto ng
  INNER JOIN grupos_productos gp on gp.StockGroupID = ng.StockGroupID
END
GO

/*
Devuelve los datos correspondientes a un producto específico.
Entradas:
  - @Nombre_Producto - nvarchar(100): Nombre del producto que se desea consultar
Salidas:
  - Los datos del producto
Restricciones:
  - @Nombre_Producto debe tener un largo máximo de 100 caracteres.
  - El nombre del producto debe coincidir exactamente con un producto registrado.
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
    ISNULL(CAST(p.RecommendedRetailPrice as nvarchar(25)), 'No indica'),
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