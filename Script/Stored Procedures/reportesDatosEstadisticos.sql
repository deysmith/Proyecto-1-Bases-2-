/*
  Devuelve las montos más altos, bajos y compra promedio que se le hace a los proveedores, agrupando
  los resultados por nombre del proveedor y categoría, además, permite el filtrado mediante estos mismos
  parámetros
  Entradas: 
    - @Nombre_Proveedor nvarchar(100) - Nombre del proveedor. Es opcional 
    - @Categoria nvarchar(100) - Categoría del proveedor. Es opcional 
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
  Salidas:
    - Las montos más altos, bajos y compra promedio que se le hace a los proveedores agrupado por
      el nombre del proveedor y categoría
  Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerDatosCompraProveedores
  @Nombre_Proveedor nvarchar(100) = NULL,
  @Categoria nvarchar(100) = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
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
  ORDER BY 
  case
    when  GROUPING(p.SupplierName) = 1 then 1
    else 0
  end,
  p.SupplierName,
  case 
    when GROUPING(pc.SupplierCategoryName) = 1 then 1
    else 0
  end 

  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
  Devuelve los montos más altos, bajos y ventas promedio que hacen los clientes, agrupando los resultados
  por cliente y categoría. Además, permite filtrar el por nombre del cliente y categoría
  Entradas:
    - @Nombre_Cliente nvarchar(100) - Nombre del cliente. Es opcional
    - @Categoria nvarchar(100) - Categoría del cliente. Es opcional
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
  Salidas:
  - Los montos más altos, bajos y ventas promedio que hacen los clientes, agrupando los resultados
    por cliente y categoría
  Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerDatosVentasCompradores
  @Nombre_Cliente nvarchar(100) = NULL,
  @Categoria nvarchar(100) = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
AS
BEGIN
  SELECT
      case
        when GROUPING(c.CustomerName) = 1 and GROUPING(cc.CustomerCategoryName) = 1 then 'Montos Generales'
        else c.CustomerName
      end as CustomerName,
      
      case 
        when GROUPING(c.CustomerName) = 0 and GROUPING(cc.CustomerCategoryName) = 1 then CONCAT('Montos de ', c.CustomerName)
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
  ORDER BY 
  case 
    when GROUPING(c.CustomerName) = 1 then 1
    else 0
  end,
  c.CustomerName,
  case
    when GROUPING(cc.CustomerCategoryName) = 1 then 1
    else 0
  end ,
  cc.CustomerCategoryName

  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
  Devuelve el top 5 de los productos que generan más ganancia en las ventas por año, permitiendo
  filtrarlos por años
  Entradas:
    - @InicioRango int - Año inicial del rango. Es opcional
    - @FinalRango int - AÑo final del rango. Es opcional
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
  Salidas:
    - El top 5 de los productos que generan más ganancia en las ventas por año,
  Restricciones:
    - @InicioRango y @FinalRango deben existir en la base de datos, a exepción que se ingrese un rango,
      donde alguno de sus valores existan en la base de datos.
*/
CREATE PROCEDURE ObtenerTopCincoProductos
  @InicioRango int = NULL,
  @FinalRango int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
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

  IF @InicioRango is NULL AND @FinalRango is not NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) = @FinalRango
  )

  BEGIN
    THROW 50005, 'No existen registros con el año indicado', 1
  END

  IF @InicioRango is not NULL AND @FinalRango is not NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) >= @InicioRango
  )

  BEGIN
    THROW 50006, 'El año inicial no existe en la base de datos', 1
  END;

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
  ORDER BY vp.StockItemName, vp.Years, vp.[Rank]
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
  Devuelve el Top 5 de los clientes con la mayor cantidad de facturas emitadas a su nombre por año,
  mostrando el monto total facturado.
  Además, Permite filtrar por rango de años.
  Entradas:
    - @InicioRango int - Año inicial del rango. Es opcional
    - @FinalRango int - AÑo final del rango. Es opcional
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
  Salidas:
    - El top 5 de los clientes con la mayor cantidad de facturas emitadas a su nombre por año y
    el monto total facturado.
  Restricciones:
    - @InicioRango y @FinalRango deben existir en la base de datos, a exepción que se ingrese un rango,
      donde alguno de sus valores existan en la base de datos.
*/
CREATE PROCEDURE ObtenerTopCincoClientes
  @InicioRango int = NULL,
  @FinalRango int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
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

  IF @InicioRango is NULL AND @FinalRango is not NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) = @FinalRango
  )

  BEGIN
    THROW 50005, 'No existen registros con el año indicado', 1
  END

  IF @InicioRango is not NULL AND @FinalRango is not NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) >= @InicioRango
  )

  BEGIN
    THROW 50006, 'El año inicial no existe en la base de datos', 1
  END;

  WITH FacturasPorAnioCliente AS (
    SELECT
        c.CustomerName,
        YEAR(f.InvoiceDate) as Years,
        SUM(df.Quantity * df.UnitPrice) as Monto,
        DENSE_RANK() OVER (partition by YEAR(f.InvoiceDate) order by COUNT(DISTINCT f.InvoiceID) DESC) as Rank,
        COUNT(DISTINCT f.InvoiceID) as TotalFacturas
    FROM clientes c
    INNER JOIN facturas f on f.CustomerID = c.CustomerID
    INNER JOIN detalle_factura df on df.InvoiceID = f.InvoiceID
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
    GROUP BY c.CustomerName, YEAR(f.InvoiceDate)
  )
  SELECT 
      fa.CustomerName,
      fa.Years,
      fa.Monto,
      fa.[Rank],
      fa.TotalFacturas
  FROM FacturasPorAnioCliente fa
  WHERE fa.[Rank] <= 5
  ORDER BY fa.Years, fa.[Rank]
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO


/*
  Devuelve el top 5 de proveedores que tienen mmayor cantidad de órdenes de compras emitidas por año, 
  mostranto el monto total por año, permitiendo filtrar por rango de años.
  Entradas:
    - @InicioRango int - Año inicial del rango. Es opcional
    - @FinalRango int - AÑo final del rango. Es opcional
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
  Salidas:
    - El top 5 de proveedores que tienen mmayor cantidad de órdenes de compras emitidas por año y el
      total por año
  Restricciones:
    - @InicioRango y @FinalRango deben existir en la base de datos, a exepción que se ingrese un rango,
      donde alguno de sus valores existan en la base de datos.
*/
CREATE PROCEDURE ObtenerTopCincoProveedores
  @InicioRango int = NULL,
  @FinalRango int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
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

  IF @InicioRango is NULL AND @FinalRango is not NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) = @FinalRango
  )

  BEGIN
    THROW 50005, 'No existen registros con el año indicado', 1
  END

  IF @InicioRango is not NULL AND @FinalRango is not NULL 
  AND NOT EXISTS (
    SELECT 1
    FROM facturas f
    WHERE YEAR(InvoiceDate) >= @InicioRango
  )

  BEGIN
    THROW 50006, 'El año inicial no existe en la base de datos', 1
  END;

  WITH FacturasPorAnioProveedor AS (
    SELECT
        p.SupplierName,
        YEAR(o.OrderDate) as Years,
        SUM(do.OrderedOuters * do.ExpectedUnitPricePerOuter) as Monto,
        DENSE_RANK() OVER (partition by YEAR(o.OrderDate) order by COUNT(DISTINCT o.PurchaseOrderID) DESC) as Rank,
        COUNT (DISTINCT o.PurchaseOrderID) as TotalOrdenes
    FROM proveedores p
    INNER JOIN ordenes o on o.SupplierID = p.SupplierID
    INNER JOIN detalle_ordenes do on do.PurchaseOrderID = o.PurchaseOrderID
    WHERE (
      @InicioRango is NULL
      AND @FinalRango is NULL
    ) OR (
      @InicioRango is not NULL
      AND @FinalRango is not NULL
      AND YEAR(o.OrderDate) BETWEEN @InicioRango AND @FinalRango
    ) OR (
      @InicioRango is NULL
      AND @FinalRango is not NULL
      AND @FinalRango = YEAR(o.OrderDate)
    ) OR (
      @InicioRango is not NULL
      AND @FinalRango is NULL
      AND @InicioRango = YEAR(o.OrderDate)
    )
    GROUP BY p.SupplierName, YEAR(o.OrderDate)
  )
  SELECT 
      fp.SupplierName,
      fp.Years,
      fp.Monto,
      fp.[Rank],
      fp.TotalOrdenes
  FROM FacturasPorAnioProveedor fp
  WHERE fp.[Rank] <= 5
  ORDER BY fp.Years, fp.[Rank]
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO


/*
  Devuelve una matriz resumen de las ventas de categorías de productos por los años vendidos 
  Entradas:
    - No recibe entradas
  Salidas:
    - Matriz resumen de las ventas de categorías de productos por los años vendidos 
  Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ResumenDeVentaPorCategoria
AS
BEGIN

  DECLARE @columnas as nvarchar(MAX)
  DECLARE @consulta as nvarchar(MAX)

  SELECT @columnas = STRING_AGG(QUOTENAME(Anios.Anio), ',') 
  FROM (SELECT DISTINCT (YEAR(f.InvoiceDate)) as Anio  FROM facturas f) as Anios

  SET @consulta = '
  SELECT StockGroupName, ' + @columnas + '
  FROM (
    SELECT
        ngp.StockGroupName as StockGroupName,
        SUM(df.Quantity * df.UnitPrice) as Ventas,
        YEAR(f.InvoiceDate) as Years
    FROM nombre_grupo_producto ngp
    INNER JOIN grupos_productos gp on gp.StockGroupID = ngp.StockGroupID
    INNER JOIN productos p on p.StockItemID = gp.StockItemID
    INNER JOIN detalle_factura df on df.StockItemID = p.StockItemID
    INNER JOIN facturas f on f.InvoiceID = df.InvoiceID
    GROUP BY StockGroupName, YEAR(f.InvoiceDate)
  ) p 
  PIVOT
  (
    SUM(Ventas)
    FOR Years IN (' + @Columnas + ')
  ) as pivote
  ORDER BY StockGroupName'
  EXECUTE sp_executesql @consulta
END
GO

/*
  Obtiene el seguimiento de compras por cliente agrupadas por mes y año. Además permite filtrar por
  año, mes, categoría y subcategoría
  Entradas:
    Todas las entradas son opcionales
    - @ID_Cliente: Identificador del cliente.
    - @Anio: Año por el cual se desean consultar las compras.
    - @Mes: Mes por el cual se desean consultar las compras.
    - @ID_Categoria: Identificador de la categoría del producto.
    - @ID_Subcategoria: Identificador de la subcategoría del producto.
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
  Salidas:
    - Nombre del cliente, año y mes de las compras, fechas de la primera y última factura, cantidad
      mínima, máxima y total de productos comprados
  Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerSeguimientoComprasClientes
  @ID_Cliente int = NULL,
  @Anio int = NULL,
  @Mes int = NULL,
  @ID_Categoria int = NULL,
  @ID_Subcategoria int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
AS
BEGIN
  SELECT 
      c.CustomerName,
      YEAR(f.InvoiceDate) as Years,
      MONTH(f.InvoiceDate) as Months,
      SUM(df.Quantity * df.UnitPrice) as Total,
      MIN(f.InvoiceDate) as FirstInvoice,
      MAX(f.InvoiceDate) as LastInvoice,
      SUM(df.Quantity) as TotalProducts,
      MIN(df.Quantity) as MinProducts,
      MAX(df.Quantity) as MaxProducts

  FROM clientes c
  INNER JOIN facturas f on f.CustomerID = c.CustomerID
  INNER JOIN detalle_factura df on df.InvoiceID = f.InvoiceID
  INNER JOIN productos p on p.StockItemID = df.StockItemID
  WHERE 
  (
    @ID_Cliente is NULL
    OR c.CustomerID = @ID_Cliente 
  ) AND (
    @Anio is NULL
    OR YEAR(f.InvoiceDate) = @Anio
  ) AND (
    @Mes is NULL
    OR MONTH(f.InvoiceDate) = @Mes
  ) AND (
    @ID_Categoria is NULL
    OR EXISTS (
      SELECT 1
      FROM grupos_productos
      WHERE StockItemID = p.StockItemID AND StockGroupID = @ID_Categoria
    )
  ) AND (
    @ID_Subcategoria is NULL
    OR EXISTS ( 
      SELECT 1
      FROM grupos_productos
      WHERE StockItemID = p.StockItemID AND StockGroupID = @ID_Subcategoria
    )
  )

  GROUP BY c.CustomerName, YEAR(f.InvoiceDate), MONTH(f.InvoiceDate)
  ORDER BY c.CustomerName, YEAR(f.InvoiceDate), MONTH(f.InvoiceDate)
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
  Obtiene el seguimiento de compras por proveedor agrupadas por mes y año. Además permite filtrar por
  año, mes, categoría y subcategoría
  Entradas:
    Todas las entradas son opcionales
    - @ID_Proveedor: Identificador del proveedor.
    - @Anio: Año por el cual se desean consultar las compras.
    - @Mes: Mes por el cual se desean consultar las compras.
    - @ID_Categoria: Identificador de la categoría del producto.
    - @ID_Subcategoria: Identificador de la subcategoría del producto.
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
  Salidas:
    - Nombre del proveedor, año y mes de las compras, fechas de la primera y última factura, cantidad
      mínima, máxima y total de productos comprados
  Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerSeguimientoComprasProveedores
  @ID_Proveedor int = NULL,
  @Anio int = NULL,
  @Mes int = NULL,
  @ID_Categoria int = NULL,
  @ID_Subcategoria int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
AS
BEGIN
  SELECT
      p.SupplierName,
      YEAR(o.OrderDate) as Years,
      MONTH(o.OrderDate) as Months,
      SUM(do.OrderedOuters * do.ExpectedUnitPricePerOuter) as Total,
      MIN(o.OrderDate) as FirstInvoice,
      MAX(o.OrderDate) as LastInvoice,
      SUM(do.OrderedOuters) as TotalProducts,
      MIN(do.OrderedOuters) as MinProducts,
      MAX(do.OrderedOuters) as MaxProducts
  FROM proveedores p
  INNER JOIN ordenes o on o.SupplierID = p.SupplierID
  INNER JOIN detalle_ordenes do on do.PurchaseOrderID = o.PurchaseOrderID
  INNER JOIN productos pr on pr.StockItemID = do.StockItemID
  WHERE 
  (
    @ID_Proveedor is NULL
    OR p.SupplierID = @ID_Proveedor 
  ) AND (
    @Anio is NULL
    OR YEAR(o.OrderDate) = @Anio
  ) AND (
    @Mes is NULL
    OR MONTH(o.OrderDate) = @Mes
  ) AND (
    @ID_Categoria is NULL
    OR EXISTS (
      SELECT 1
      FROM grupos_productos
      WHERE StockItemID = pr.StockItemID AND StockGroupID = @ID_Categoria
    )
  ) AND (
    @ID_Subcategoria is NULL
    OR EXISTS ( 
      SELECT 1
      FROM grupos_productos
      WHERE StockItemID = pr.StockItemID AND StockGroupID = @ID_Subcategoria
    )
  )

  GROUP BY p.SupplierName, YEAR(o.OrderDate), MONTH(o.OrderDate)
  ORDER BY p.SupplierName, YEAR(o.OrderDate), MONTH(o.OrderDate)
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/* En proceso */
CREATE PROCEDURE PromedioDiasRotacionProducto
  @ID_Producto int = NULL,
  @Anio int = NULL,
  @ID_Proveedor int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
AS
BEGIN

  WITH VentasPorProducto AS (
      SELECT 
          p.StockItemID, 
          p.StockItemName, 
          p.SupplierID,
          pr.SupplierName, 
          YEAR(f.InvoiceDate) as Years,
          SUM(df.Quantity) as Quantity,
          AVG(p.QuantityPerOuter) as QuantityPerOuter
      FROM productos p 
      INNER JOIN proveedores pr ON pr.SupplierID = p.SupplierID 
      INNER JOIN detalle_factura df ON df.StockItemID = p.StockItemID 
      INNER JOIN facturas f ON f.InvoiceID = df.InvoiceID 
      GROUP BY p.StockItemID, p.StockItemName, p.SupplierID, pr.SupplierName, YEAR(f.InvoiceDate) 
  ) 
  SELECT * 
  FROM ( 
      SELECT 
          ROW_NUMBER() over (order by vp.StockItemName) AS RowNum, 
          vp.StockItemName, 
          vp.SupplierName, 
          vp.Quantity, 
          vp.QuantityPerOuter, 
          case  
          when vp.Quantity = 0 then 0 
          ELSE CAST((vp.QuantityPerOuter * 365.0) / vp.Quantity as decimal(10,2)) 
          end AS DiasRotacionPromedio 
      FROM VentasPorProducto vp 
      WHERE 
      (
        @ID_Producto IS NULL OR vp.StockItemID = @ID_Producto
      ) AND (
        @Anio IS NULL 
        OR vp.Years = @Anio
      ) AND (
        @ID_Proveedor IS NULL 
        OR vp.SupplierID = @ID_Proveedor
      ) 
  ) AS Resultado 

  ORDER BY RowNum
  -- OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  -- FETCH NEXT @CantidadRegistros ROWS ONLY 
END
GO

/*
  Obtiene el método de envío favorito según la ciudad a la que fue remitida
  la venta, ordenando los resultados por la cantidad de ventas realizadas.
  Entradas:
    - @Anio: Año por el cual se desean filtrar las ventas.
    - @Mes: Mes por el cual se desean filtrar las ventas.
    - @ID_CategoriaCliente: Identificador de la categoría del cliente.
    - @ID_CategoriaProducto: Identificador de la categoría del producto.
    - @ID_Producto: Identificador del producto.
    - @NumeroPagina: Número de página que se desea consultar.
    - @CantidadRegistros: Cantidad de registros que se mostrarán por página.
  Salidas:
    - CityName: Nombre de la ciudad a la que fue remitida la venta.
    - DeliveryMethodName: Nombre del método de envío utilizado.
    - TotalSales: Cantidad de ventas realizadas mediante el método de envío en la ciudad correspondiente.
  Restricciones:.
    - No posee restricciones
*/
CREATE PROCEDURE MetodoEnvioFavoritoPorCuidad
    @Anio int = NULL,
    @Mes int = NULL,
    @ID_CategoriaCliente int = NULL,
    @ID_CategoriaProducto int = NULL,
    @ID_Producto int = NULL,
    @NumeroPagina int = 1,
    @CantidadRegistros int = 20
AS
BEGIN

  WITH VentasPorMetodo AS(
      SELECT
          md.DeliveryMethodName,
          ci.CityName,
          COUNT(DISTINCT f.InvoiceID) as TotalSales
      FROM facturas f

      INNER JOIN metodos_entrega md on md.DeliveryMethodID = f.DeliveryMethodID
      INNER JOIN clientes c on c.CustomerID = f.CustomerID
      INNER JOIN detalle_factura df on df.InvoiceID = f.InvoiceID
      INNER JOIN productos p on p.StockItemID = df.StockItemID
      INNER JOIN ciudades ci on ci.CityID = c.DeliveryCityID
      WHERE 
      (
        @Anio IS NULL
        OR YEAR(f.InvoiceDate) = @Anio
      ) AND (
        @Mes IS NULL
        OR MONTH(f.InvoiceDate) = @Mes
      ) AND (
        @ID_CategoriaCliente IS NULL
        OR c.CustomerCategoryID = @ID_CategoriaCliente
      ) AND (
        @ID_Producto IS NULL
        OR p.StockItemID = @ID_Producto
      ) AND (
        @ID_CategoriaProducto IS NULL OR EXISTS (
          SELECT 1
          FROM grupos_productos gp
          WHERE gp.StockItemID = p.StockItemID AND gp.StockGroupID = @ID_CategoriaProducto
        )
      )
      GROUP BY md.DeliveryMethodName, ci.CityName
    )
  SELECT *
  FROM
  (
    SELECT
        ROW_NUMBER() over (order by TotalSales DESC) AS RowNum,
        CityName,
        DeliveryMethodName,
        TotalSales
    FROM VentasPorMetodo
  ) AS Result

  ORDER BY RowNum
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY

END
GO


EXECUTE ObtenerDatosCompraProveedores @Categoria = 'Novelty'
EXECUTE ObtenerDatosVentasCompradores @Nombre_Cliente = 'Toys', @CantidadRegistros = 2000
EXECUTE ObtenerTopCincoProductos 200
EXECUTE ObtenerTopCincoClientes  @FinalRango = 2015
EXECUTE ObtenerTopCincoProveedores
EXECUTE ResumenDeVentaPorCategoria
EXECUTE ObtenerSeguimientoComprasClientes @Mes=2
EXECUTE ObtenerSeguimientoComprasProveedores 
EXECUTE PromedioDiasRotacionProducto @Anio = 2013
EXECUTE MetodoEnvioFavoritoPorCuidad @Anio = 2013

select * from transacciones_productos where TransactionTypeID = 1
select distinct(tt.TransactionTypeName)
from transacciones_productos tp
inner join tipos_transacciones tt on tt.TransactionTypeID = tp.TransactionTypeID

