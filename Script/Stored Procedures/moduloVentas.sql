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
  - @Numero_Factura debe estar registrado
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

/*
Devuelve los datos correspondientes al detalle de una factura
Entradas:
  - @Factura_ID - int: Número de la factura a consultar
Salidas:
  - Los siguientes datos: Nombre del producto, cantidad, precio unitario, impuesto
  aplicado, monto del impuesto total por linea
Restricciones:
  - @Numero_Factura debe estar registrado
*/
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

/*
Crea una factura con su respectivo detalle de factura.
Entradas:
  - @ID_Cliente: Identificador del cliente al que se le genera la factura.
  - @ID_BillToCustomer: Identificador del cliente al que se factura.
  - @ID_MetodoEntrega: Identificador del método de entrega.
  - @ID_PersonaContacto: Identificador de la persona de contacto.
  - @ID_PersonaCuenta: Identificador de la persona encargada de la cuenta.
  - @ID_Vendedor: Identificador de la persona encargada de la venta.
  - @ID_Empacador: Identificador de la persona encargada del empaque.
  - @ID_Producto: Identificador del producto que se desea facturar.
  - @Cantidad: Cantidad del producto que se desea incluir en la factura.
Salidas:
  - Crea una nueva factura.
  - Crea una línea de detalle asociada a la factura.
Restricciones:
  - @ID_Cliente debe corresponder a un cliente existente.
  - @ID_Producto debe corresponder a un producto existente.
*/
CREATE PROCEDURE CrearFactura
  @ID_Cliente int,
  @ID_BillToCustomer int,
  @ID_MetodoEntrega int,
  @ID_PersonaContacto int,
  @ID_PersonaCuenta int,
  @ID_Vendedor int,
  @ID_Empacador int,
  @ID_Producto int,
  @Cantidad int
AS
BEGIN
  SET XACT_ABORT ON

  DECLARE @ID_Factura int
  DECLARE @PersonaEncargadaID int
  DECLARE @UnitPrice decimal(18, 2)
  DECLARE @TaxRate decimal(18, 3)
  DECLARE @Tax decimal(18, 2)
  DECLARE @ExtendedPrice decimal(18, 2)

  BEGIN TRY
    BEGIN TRANSACTION

    IF NOT EXISTS (
      SELECT 1
      FROM clientes
      WHERE CustomerID = @ID_Cliente
    )
    BEGIN
      THROW 50007, 'El cliente indicado no existe', 1
    END

    IF NOT EXISTS (
      SELECT 1
      FROM productos
      WHERE StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50017, 'El producto indicado no existe', 1
    END

    IF @Cantidad <= 0
    BEGIN
      THROW 50025, 'La cantidad debe ser mayor que cero', 1
    END

    SELECT @PersonaEncargadaID = PersonID
    FROM personas
    WHERE FullName = 'PagWeb'

    SELECT
      @UnitPrice = UnitPrice,
      @TaxRate = TaxRate
    FROM productos
    WHERE StockItemID = @ID_Producto

    SET @ExtendedPrice = @Cantidad * @UnitPrice
    SET @Tax = @ExtendedPrice * (@TaxRate / 100)

    SELECT @ID_Factura = NEXT VALUE FOR Sequences.InvoiceID

    INSERT INTO facturas (
      InvoiceID,
      CustomerID,
      BillToCustomerID,
      OrderID,
      DeliveryMethodID,
      ContactPersonID,
      AccountsPersonID,
      SalespersonPersonID,
      PackedByPersonID,
      InvoiceDate,
      IsCreditNote,
      TotalDryItems,
      TotalChillerItems,
      LastEditedBy
    )
    VALUES (
      @ID_Factura,
      @ID_Cliente,
      @ID_BillToCustomer,
      NULL,
      @ID_MetodoEntrega,
      @ID_PersonaContacto,
      @ID_PersonaCuenta,
      @ID_Vendedor,
      @ID_Empacador,
      CAST(GETDATE() AS DATE),
      0,
      @Cantidad,
      0,
      @PersonaEncargadaID
    )

    INSERT INTO detalle_factura (
      InvoiceLineID,
      InvoiceID,
      StockItemID,
      Description,
      PackageTypeID,
      Quantity,
      UnitPrice,
      TaxRate,
      TaxAmount,
      LineProfit,
      ExtendedPrice,
      LastEditedBy
    )
    SELECT
      NEXT VALUE FOR Sequences.InvoiceLineID,
      @ID_Factura,
      p.StockItemID,
      p.StockItemName,
      p.UnitPackageID,
      @Cantidad,
      @UnitPrice,
      @TaxRate,
      @Tax,
      0,
      @ExtendedPrice,
      @PersonaEncargadaID
    FROM productos p
    WHERE p.StockItemID = @ID_Producto

    COMMIT TRANSACTION

  END TRY

  BEGIN CATCH
    IF XACT_STATE() <> 0
      ROLLBACK TRANSACTION
    SELECT
      ERROR_NUMBER() AS NumeroError,
      ERROR_MESSAGE() AS MensajeError,
      ERROR_LINE() AS LineaError
  END CATCH

END
GO

/*
    Actualiza algunos  datos de una factura existente.
  Entradas:
    - @ID_Factura: Identificador de la factura que se desea actualizar.
    - @DeliveryMethodID: Identificador del método de entrega de la factura.
    - @DeliveryInstructions: Instrucciones de entrega.
  Salidas:
    - Actualiza los datos indicados de la factura.
  Restricciones:
    - La factura indicada debe existir.
*/
CREATE PROCEDURE EditarDatosFactura
  @ID_Factura int,
  @DeliveryMethodID int = NULL,
  @DeliveryInstructions nvarchar(MAX) = NULL
AS
BEGIN
    SET XACT_ABORT ON

    BEGIN TRY
      BEGIN TRANSACTION
      IF NOT EXISTS (
        SELECT 1
        FROM facturas
        WHERE InvoiceID = @ID_Factura
      )
      BEGIN
        THROW 50026, 'La factura indicada no existe', 1
      END

      UPDATE facturas
      SET
          DeliveryMethodID = ISNULL(@DeliveryMethodID, DeliveryMethodID),
          DeliveryInstructions = ISNULL(@DeliveryInstructions, DeliveryInstructions)
      WHERE InvoiceID = @ID_Factura

      COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        SELECT
            ERROR_NUMBER() AS NumeroError,
            ERROR_MESSAGE() AS MensajeError,
            ERROR_LINE() AS LineaError
    END CATCH
END
GO

/*
  Elimina una factura que no tenga registros relacionados con otras tablas.
  Entradas:
    - @ID_Factura: Identificador de la factura que se desea eliminar.
  Salidas:
    - Elimina la factura indicada cuando no existen registros relacionados.
  Restricciones:
    - La factura indicada debe existir.
    - No se puede eliminar una factura que tenga:
      - Transacciones de clientes
      - Detalles de factura relacionadas.
      - Transacciones de inventario
*/
CREATE PROCEDURE EliminarFactura
  @ID_Factura int
AS
BEGIN
    SET XACT_ABORT ON

    BEGIN TRY
        BEGIN TRANSACTION

        IF NOT EXISTS (
          SELECT 1
          FROM facturas
          WHERE InvoiceID = @ID_Factura
        )
        BEGIN
          THROW 50008, 'La factura indicada no existe.', 1
        END

        IF EXISTS (
          SELECT 1
          FROM transacciones_clientes
          WHERE InvoiceID = @ID_Factura
        )
        BEGIN
          THROW 50027, 'La factura no puede eliminarse porque está relacionada con una transacción de cliente.', 1
        END

        IF EXISTS (
          SELECT 1
          FROM detalle_factura
          WHERE InvoiceID = @ID_Factura
        )
        BEGIN
          THROW 50027, 'La factura no puede eliminarse porque tiene detalles de factura relacionadas.', 1
        END

        IF EXISTS (
            SELECT 1
            FROM transacciones_productos
            WHERE InvoiceID = @ID_Factura
        )
        BEGIN
            THROW 50028, 'La factura no puede eliminarse porque está relacionada con transacciones de inventario.', 1
        END

        DELETE FROM facturas
        WHERE InvoiceID = @ID_Factura

        COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        SELECT
            ERROR_NUMBER() AS NumeroError,
            ERROR_MESSAGE() AS MensajeError,
            ERROR_LINE() AS LineaError;
    END CATCH
END
GO

---------- Pruebas de los Stored Procedures ----------
EXECUTE GetFacturas
EXECUTE BuscarFacturas 'Tailspin Toys (Absecon, NJ)'
EXECUTE ObtenerEncabezadoFactura 70512
EXECUTE ObtenerDetalleFactura 70512
EXECUTE CrearFactura
  @ID_Cliente = 1213,
  @ID_BillToCustomer = 1213,
  @ID_MetodoEntrega = 3,
  @ID_PersonaContacto = 3414,
  @ID_PersonaCuenta = 3414,
  @ID_Vendedor = 4,
  @ID_Empacador = 5,
  @ID_Producto = 10,
  @Cantidad = 5
EXECUTE EditarDatosFactura 70512, @DeliveryInstructions = '200 mts norte'
EXECUTE EliminarFactura 70512

-- Consultas
select TOP 10 * from facturas where CustomerID = 1213
select count(*) from facturas
select TOP 10 * from detalle_factura
