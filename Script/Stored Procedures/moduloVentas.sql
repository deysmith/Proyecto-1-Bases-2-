/*
Se encarga de devolver el número, fecha y monto de una factura, además del
nombre del cliente
Entradas:
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
    - Cliente, número, fecha de emisión y monto de una factura
Restricciones:
    - @NumeroPagina debe ser un número entero positivo
    - @CantidadRegistros deber ser mayor a 0 (entero positivo)
*/
CREATE PROCEDURE GetFacturas
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
AS
BEGIN
  SELECT
    f.InvoiceID,
    c.CustomerName,
    f.InvoiceDate,
    SUM(df.ExtendedPrice) as Price

  FROM facturas f
  INNER JOIN clientes c on c.CustomerID = f.CustomerID
  INNER JOIN metodos_entrega me on me.DeliveryMethodID = f.DeliveryMethodID
  INNER JOIN detalle_factura df on df.InvoiceID = f.InvoiceID
  GROUP BY f.InvoiceID, c.CustomerName, f.InvoiceDate 
  ORDER BY c.CustomerName ASC
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
Devuelve el número de factura, monto, fecha y cliente de las facturas que coinciden con el
criterio de búsqueda
Entradas:
  - @Nombre_Cliente - nvarchar(100): Nombre del cliente al que fue emitido la factura
  - @FechaInicio - date: Fecha inicial del rango de búsqueda.
  - @FechaFin - date: Fecha final del rango de búsqueda.
  - @MontoMinimo - decimal(18,2): Monto mínimo de las facturas.
  - @MontoMaximo - decimal(18,2): Monto máximo de las facturas.
  - @NumeroPagina - Número de página que se desea consultar. 
  - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
  - Número de factura, monto, fecha y cliente de las facturas que coinciden con el
    criterio de búsqueda
Restricciones:
  - @NumeroPagina debe ser un número entero positivo
  - @CantidadRegistros deber ser mayor a 0 (entero positivo)
*/
CREATE PROCEDURE BuscarFacturas
  @Nombre_Cliente NVARCHAR(100) = NULL,
  @FechaInicio DATE = NULL,
  @FechaFin DATE = NULL,
  @MontoMinimo DECIMAL(18,2) = NULL,
  @MontoMaximo DECIMAL(18,2) = NULL,
  @NumeroPagina INT = 1,
  @CantidadRegistros INT = 20

AS
BEGIN
  SELECT
    f.InvoiceID,
    c.CustomerName,
    f.InvoiceDate,
    SUM(df.ExtendedPrice) as Price

  FROM facturas f
  INNER JOIN clientes c on c.CustomerID = f.CustomerID
  INNER JOIN metodos_entrega me on me.DeliveryMethodID = f.DeliveryMethodID
  INNER JOIN detalle_factura df on df.InvoiceID = f.InvoiceID
  WHERE (
    @Nombre_Cliente IS NULL
    OR @Nombre_Cliente = ''
    OR c.CustomerName LIKE '%' + @Nombre_Cliente + '%'
  ) AND (
    @FechaInicio IS NULL
    OR f.InvoiceDate >= @FechaInicio
  ) AND (
    @FechaFin IS NULL
    OR f.InvoiceDate <= @FechaFin
  )

  GROUP BY f.InvoiceID, c.CustomerName, f.InvoiceDate
  
  HAVING (
    @MontoMinimo IS NULL
    OR SUM(df.ExtendedPrice) >= @MontoMinimo
    ) AND (
    @MontoMaximo IS NULL
    OR SUM(df.ExtendedPrice) <= @MontoMaximo
    )
  ORDER BY c.CustomerName ASC
END
GO

/*
Devuelve los datos correspondientes al encabezado de una factura
Entradas:
  - @Factura_ID - int: Número de la factura a consultar
Salidas:
  - Los siguientes datos: número de factura, nombre del cliente, método de entrega,
    número de orden asociada, persona de contacto, vendedor, fecha de la factura e
    instrucciones de entrega
Restricciones:
  -
*/
CREATE PROCEDURE ObtenerEncabezadoFactura
  @Numero_Factura int
AS
BEGIN
  SELECT
    f.InvoiceID,
    c.CustomerName,
    me.DeliveryMethodName,
    ISNULL(CAST(f.OrderID as nvarchar(20)), 'No se encuentra asociado a una orden') as OrderID,
    p.FullName as ContactPerson,
    p1.FullName as SalesPerson,
    f.InvoiceDate,
    ISNULL(f.DeliveryInstructions, 'No posee instrucciones de entrega') as DeliveryInstructions

  FROM facturas f
  INNER JOIN clientes c on c.CustomerID = f.CustomerID
  INNER JOIN metodos_entrega me on me.DeliveryMethodID = f.DeliveryMethodID
  INNER JOIN personas p on p.PersonID = f.ContactPersonID
  INNER JOIN personas p1 on p1.PersonID = f.SalespersonPersonID
  INNER JOIN detalle_factura df on df.InvoiceID = f.InvoiceID
  WHERE f.InvoiceID = @Numero_Factura
END
GO

CREATE PROCEDURE ObtenerDetalleFactura
  @Numero_Factura int
AS
BEGIN
  SELECT
    p.StockItemName,
    df.Quantity,
    p.UnitPrice,
    df.TaxRate,
    df.TaxAmount,
    df.ExtendedPrice
  FROM detalle_factura df
  INNER JOIN productos p on p.StockItemID = df.StockItemID
  WHERE df.InvoiceID = @Numero_Factura
  ORDER BY df.InvoiceLineID ASC
END
GO

---------- Pruebas de los Stored Procedures ----------
EXECUTE GetFacturas
EXECUTE BuscarFacturas 'Tailspin Toys (Absecon, NJ)'
EXECUTE ObtenerEncabezadoFactura 1
EXECUTE ObtenerDetalleFactura 2

-- Consultas
select TOP 10 * from facturas
select count(*) from facturas
select TOP 10 * from detalle_factura
