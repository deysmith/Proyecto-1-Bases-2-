/*
  Devuelve las montos más altos, bajos y compra promedio que se le hace a los proveedores, agrupando
  los resultados por nombre del proveedor y categoría, además, permite el filtrado mediante estos mismos
  parámetros
  Entradas: 
    - @Nombre_Proveedor nvarchar(100) - Nombre del proveedor. Es opcional 
    - @Categoria nvarchar(100) - Categoría del proveedor. Es opcional 
  Salidas:
    - Las montos más altos, bajos y compra promedio que se le hace a los proveedores agrupado por
      el nombre del proveedor y categoría
  Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerDatosCompraProveedores
  @Nombre_Proveedor nvarchar(100) = NULL,
  @Categoria nvarchar(100) = NULL
AS
BEGIN
  SELECT
      case
        when GROUPING(p.SupplierName) = 1 and GROUPING(pc.SupplierCategoryName) = 1 then 'Total General'
        else p.SupplierName
      end as SupplierName,
      
      case 
        when GROUPING(p.SupplierName) = 0 and GROUPING(pc.SupplierCategoryName) = 1 then CONCAT('Total de ', p.SupplierName)
        when GROUPING(p.SupplierName) = 1 and GROUPING(pc.SupplierCategoryName) = 1 then ' '
        else pc.SupplierCategoryName
      end as SupplierCategoryName,

      MAX(do.OrderedOuters * do.ExpectedUnitPricePerOuter) as Alto,
      MIN(do.OrderedOuters * do.ExpectedUnitPricePerOuter) as Bajo,
      CAST(AVG(do.OrderedOuters * do.ExpectedUnitPricePerOuter) as decimal(10, 2))  as Promedio
  FROM proveedores p
  INNER JOIN ordenes o on o.SupplierID = p.SupplierID
  INNER JOIN detalle_ordenes do on do.PurchaseOrderID = o.PurchaseOrderID
  INNER JOIN categorias_proveedores pc on pc.SupplierCategoryID = p.SupplierCategoryID
  WHERE (
    @Nombre_Proveedor is NULL
    OR @Nombre_Proveedor = ''
    OR p.SupplierName LIKE '%' + @Nombre_Proveedor + '%'
  ) AND (
    @Categoria IS NULL
    OR @Categoria = ''
    OR pc.SupplierCategoryName LIKE '%' + @Categoria + '%'
  )
  GROUP BY ROLLUP (p.SupplierName, pc.SupplierCategoryName)
END
GO

/*
  Devuelve los montos más altos, bajos y ventas promedio que hacen los clientes, agrupando los resultados
  por cliente y categoría. Además, permite filtrar el por nombre del cliente y categoría
  Entradas:
    - @Nombre_Cliente nvarchar(100) - Nombre del cliente. Es opcional
    - @Categoria nvarchar(100) - Categoría del cliente. Es opcional
  Salidas:
  - Los montos más altos, bajos y ventas promedio que hacen los clientes, agrupando los resultados
  por cliente y categoría
  Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerDatosVentasCompradores
  @Nombre_Cliente nvarchar(100) = NULL,
  @Categoria nvarchar(100) = NULL
AS
BEGIN
  SELECT
      case
        when GROUPING(c.CustomerName) = 1 and GROUPING(cc.CustomerCategoryName) = 1 then 'Total General'
        else c.CustomerName
      end as CustomerName,
      
      case 
        when GROUPING(c.CustomerName) = 0 and GROUPING(cc.CustomerCategoryName) = 1 then CONCAT('Total de ', c.CustomerName)
        when GROUPING(c.CustomerName) = 1 and GROUPING(cc.CustomerCategoryName) = 1 then ' '
        else cc.CustomerCategoryName
      end as CustomerCategoryName,

      MAX(df.Quantity * df.UnitPrice) as Alto,
      MIN(df.Quantity * df.UnitPrice) as Bajo,
      CAST(AVG(df.Quantity * df.UnitPrice) as decimal(10, 2))  as Promedio
  FROM clientes c
  INNER JOIN facturas f on f.CustomerID = c.CustomerID
  INNER JOIN detalle_factura df on df.InvoiceID = f.InvoiceID
  INNER JOIN categorias_clientes cc on cc.CustomerCategoryID = c.CustomerCategoryID
  WHERE (
    @Nombre_Cliente is NULL
    OR @Nombre_Cliente = ''
    OR c.CustomerName LIKE '%' + @Nombre_Cliente + '%'
  ) AND (
    @Categoria IS NULL
    OR @Categoria = ''
    OR cc.CustomerCategoryName LIKE '%' + @Categoria + '%'
  )
  GROUP BY ROLLUP (c.CustomerName, cc.CustomerCategoryName)
END
GO

/*
Devuelve el top 5 de los productos que generan más ganancia en las ventas por año, permitiendo
filtrarlos por años
Entradas:
  - @InicioRango int - Año inicial del rango. Es opcional
  - @FinalRango int - AÑo final del rango. Es opcional
Salidas:
  - El top 5 de los productos que generan más ganancia en las ventas por año,
Restricciones:
  - No posee restricciones
*/
CREATE PROCEDURE ObtenerTopCincoProductos
  @InicioRango int = NULL,
  @FinalRango int = NULL
AS
BEGIN

  IF @InicioRango is not NULL AND @FinalRango is NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) = @InicioRango
  )

  BEGIN
    THROW 50004, 'No existen registros con el año indicado', 1
  END

  IF @InicioRango is not NULL AND @FinalRango is not NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) >= @InicioRango
  )

  BEGIN
    THROW 50005, 'El año inicial no existe en la base de datos', 1
  END;

  WITH VentasPorAnioProducto AS (
    SELECT 
      p.StockItemName,
      SUM(df.Quantity * df.UnitPrice) as Earnings,
      YEAR(f.InvoiceDate) as Years,
      DENSE_RANK() OVER (partition by YEAR(f.InvoiceDate) order by SUM(df.Quantity * df.UnitPrice) desc) as Rank
    FROM productos p
    INNER JOIN detalle_factura df on df.StockItemID = p.StockItemID
    INNER JOIN facturas f on f.InvoiceID = df.InvoiceID
    WHERE (
      @InicioRango is NULL
      AND @FinalRango is NULL
    ) OR (
      @InicioRango is not NULL
      AND @FinalRango is not NULL
      AND YEAR(f.InvoiceDate) BETWEEN @InicioRango AND @FinalRango
    ) OR (
      @InicioRango is NULL
      AND @FinalRango is not NULL
      AND @FinalRango = YEAR(f.InvoiceDate)
    ) OR (
      @InicioRango is not NULL
      AND @FinalRango is NULL
      AND @InicioRango = YEAR(f.InvoiceDate)
    )

    GROUP BY p.StockItemName, YEAR(f.InvoiceDate)
  ) 
  SELECT 
    vp.StockItemName,
    vp.Years,
    vp.[Rank]
  FROM VentasPorAnioProducto vp
  WHERE vp.RANK <= 5
END
GO

/*

Entradas:
Salidas:
Restricciones:
*/
CREATE PROCEDURE ObtenerTopCincoClientes
AS
BEGIN
END
GO


EXECUTE ObtenerDatosCompraProveedores @Categoria = 'Novelty'
EXECUTE ObtenerDatosVentasCompradores @Nombre_Cliente = 'Toys'
EXECUTE ObtenerTopCincoProductos 2003, 2015