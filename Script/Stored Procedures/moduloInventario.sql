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

/*
Se encarga de agregar un nuevo producto a la base de datos y crear su registro inicial de inventario.
Entradas:
  - @Nombre_Producto: Nombre del producto.
  - @ProveedorID: Identificador del proveedor.
  - @ColorID: Identificador del color. Es opcional.
  - @UnitPackageID: Identificador del tipo de paquete unitario.
  - @OuterPackageID: Identificador del tipo de paquete exterior.
  - @Marca: Marca del producto. Es opcional.
  - @Size: Tamaño del producto. Es opcional.
  - @QuantityPerOuter: Cantidad de unidades por paquete exterior.
  - @TaxRate: Porcentaje de impuesto aplicado al producto.
  - @UnitPrice: Precio unitario del producto.
  - @RecommendedPrice: Precio de venta recomendado. Es opcional.
  - @TypicalWeight: Peso típico por unidad.
  - @MarketingComments: Comentarios de mercadeo del producto.
  - @BinLocation: Ubicación del producto dentro del inventario.
  - @QuantityOnHand: Cantidad inicial disponible en inventario.
Salidas:
  - Identificador del producto creado.
Valores por defecto:
  - LeadTimeDays: 7.
  - IsChillerStock: 0.
  - LastEditedBy: Identificador de la persona PagWeb.
  - LastStocktakeQuantity: Igual a QuantityOnHand.
  - LastCostPrice: Igual al UnitPrice.
  - ReorderLevel: 7.
  - TargetStockLevel: 20.
  - LastEditedWhen: Fecha y hora actual.
  - SearchDetails: Se genera automáticamente por ser una columna calculada.
  - Tags: Se genera automáticamente por ser una columna calculada.
  - StockItemID: Se genera mediante la secuencia correspondiente.
  - ValidFrom: Se genera automáticamente.
  - ValidTo: Se genera automáticamente.
Restricciones:
  - StockItemName no puede estar repetido.
  - Los identificadores utilizados como referencia deben existir
    en sus respectivas tablas.
  - Debe existir la persona PagWeb para registrar quién realizó
    la operación.
  - Si ocurre un error, la transacción se cancela.
*/
CREATE PROCEDURE AgregarNuevoProducto
  @Nombre_Producto nvarchar(100),
  @ProveedorID int,
  @ColorID int = NULL,
  @UnitPackageID int,
  @OuterPackageID int,
  @Marca nvarchar(50) = NULL,
  @Size nvarchar(20) = NULL,
  @QuantityPerOuter int,
  @TaxRate decimal(18, 3),
  @UnitPrice decimal(18, 2),
  @RecommendedPrice decimal (18, 2) = NULL,
  @TypicalWeight decimal(18, 3),
  @MarketingSearchDetails nvarchar(MAX),
  @BinLocation nvarchar(20),
  @QuantityOnHand int,
  @Grupos_Productos nvarchar(100)
AS
BEGIN
  SET XACT_ABORT ON
  DECLARE @PersonaEncargadaID int
  DECLARE @ID_Producto int

  BEGIN TRY

    BEGIN TRANSACTION
    IF EXISTS (
      SELECT 1
      FROM productos p
      WHERE p.StockItemName = @Nombre_Producto
    )
    BEGIN
      THROW 50002, 'Ya existe un producto con ese nombre', 1
    END

    SELECT @PersonaEncargadaID = p.PersonID
    FROM personas p 
    WHERE FullName = 'PagWeb'
    
    INSERT INTO productos (
      StockItemName,
      SupplierID,
      ColorID,
      UnitPackageID,
      OuterPackageID,
      Brand,
      Size,
      LeadTimeDays,
      QuantityPerOuter,
      IsChillerStock,
      TaxRate,
      UnitPrice,
      RecommendedRetailPrice,
      TypicalWeightPerUnit,
      MarketingComments,
      LastEditedBy
    )
    VALUES (
      @Nombre_Producto,
      @ProveedorID,
      @ColorID,
      @UnitPackageID,
      @OuterPackageID,
      @Marca,
      @Size,
      7,
      @QuantityPerOuter,
      0,
      @TaxRate,
      @UnitPrice,
      @RecommendedPrice,
      @TypicalWeight,
      @MarketingSearchDetails,
      @PersonaEncargadaID
    )

    SELECT @ID_Producto = p.StockItemID
    FROM productos p
    WHERE p.StockItemName = @Nombre_Producto

    INSERT INTO inventario_productos (
      StockItemID,
      QuantityOnHand,
      BinLocation,
      LastStocktakeQuantity,
      LastCostPrice,
      ReorderLevel,
      TargetStockLevel,
      LastEditedBy
    )
    VALUES (
      @ID_Producto,
      @QuantityOnHand,
      @BinLocation,
      @QuantityOnHand,
      @UnitPrice,
      5,
      20,
      @PersonaEncargadaID
    )

    INSERT INTO grupos_productos (
      StockItemID,
      StockGroupID,
      LastEditedBy
    )
    SELECT 
        @ID_Producto,
        CAST(value as int),
        @PersonaEncargadaID
    FROM STRING_SPLIT(@Grupos_Productos, ',')

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
  Edita los datos de un producto existente en la base de datos.
  Entradas:
    - @ID_Producto: Identificador del producto que se desea editar.
    - @Nombre_Producto: Nuevo nombre del producto. Es opcional.
    - @ColorID: Nuevo identificador del color del producto. Es opcional.
    - @UnitPackageID: Nuevo identificador del tipo de paquete unitario. Es opcional.
    - @OuterPackageID: Nuevo identificador del tipo de paquete exterior. Es opcional.
    - @Marca: Nueva marca del producto. Es opcional.
    - @Size: Nuevo tamaño del producto. Es opcional.
    - @QuantityPerOuter: Nueva cantidad de unidades por paquete exterior. Es opcional.
    - @TaxRate: Nueva tasa de impuesto del producto. Es opcional.
    - @UnitPrice: Nuevo precio unitario del producto. Es opcional.
    - @RecommendedPrice: Nuevo precio de venta recomendado. Es opcional.
    - @TypicalWeight: Nuevo peso típico por unidad. Es opcional.
    - @MarketingSearchDetails: Nuevos comentarios de mercadeo del producto. Es opcional.
    - @BinLocation: Nueva ubicación del producto en el inventario. Es opcional.
    - @QuantityOnHand: Nueva cantidad disponible del producto. Es opcional.
    - @Grupos_Productos: Identificadores de los grupos a los que pertenecerá
      el producto, separados por comas. Es opcional.
  Salidas:
    - Actualiza los datos del producto indicado.
    - Actualiza la información de inventario del producto.
    - Actualiza los grupos asociados al producto cuando se proporcionan.
  Restricciones:
    - @ID_Producto debe corresponder a un producto existente.
*/
CREATE PROCEDURE EditarDatosProducto
  @ID_Producto int = NULL,
  @Nombre_Producto nvarchar(100) = NULL,
  @ColorID int = NULL,
  @UnitPackageID int = NULL,
  @OuterPackageID int = NULL,
  @Marca nvarchar(50) = NULL,
  @Size nvarchar(20) = NULL,
  @QuantityPerOuter int = NULL,
  @TaxRate decimal(18, 3) = NULL,
  @UnitPrice decimal(18, 2) = NULL,
  @RecommendedPrice decimal (18, 2) = NULL,
  @TypicalWeight decimal(18, 3) = NULL,
  @MarketingSearchDetails nvarchar(MAX) = NULL,
  @BinLocation nvarchar(20) = NULL,
  @QuantityOnHand int = NULL,
  @Grupos_Productos nvarchar(100)
AS
BEGIN
  SET XACT_ABORT ON
  DECLARE @PersonaEncargadaID int
  
  BEGIN TRY
    BEGIN TRANSACTION
    
    IF NOT EXISTS (
      SELECT 1
      FROM productos p
      WHERE p.StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50017, 'El producto indicado no existe', 1
    END

    IF @Nombre_Producto is NOT NULL AND EXISTS (
      SELECT 1
      FROM productos p
      WHERE p.StockItemName = @Nombre_Producto AND p.StockItemID <> @ID_Producto
    )
    BEGIN
      THROW 50018, 'Ya existe un producto con ese nombre', 1
    END

    UPDATE productos
    SET 
      StockItemName = ISNULL(@Nombre_Producto, StockItemName),
      ColorID = ISNULL(@ColorID, ColorID),
      UnitPackageID = ISNULL(@UnitPackageID, UnitPackageID),
      OuterPackageID = ISNULL(@OuterPackageID, OuterPackageID),
      UnitPrice = ISNULL(@UnitPrice, UnitPrice),
      Brand = ISNULL(@Marca, Brand),
      QuantityPerOuter = ISNULL(@QuantityPerOuter, QuantityPerOuter),
      TaxRate = ISNULL(@TaxRate, TaxRate),
      RecommendedRetailPrice = ISNULL(@RecommendedPrice, RecommendedRetailPrice),
      TypicalWeightPerUnit = ISNULL(@TypicalWeight, TypicalWeightPerUnit),
      MarketingComments = ISNULL(@MarketingSearchDetails, MarketingComments)
    WHERE StockItemID = @ID_Producto

    UPDATE inventario_productos
    SET
      BinLocation = ISNULL(@BinLocation, BinLocation),
      QuantityOnHand = ISNULL(@QuantityOnHand, QuantityOnHand)
    WHERE StockItemID = @ID_Producto

    IF @Grupos_Productos IS NOT NULL 
    BEGIN
      SELECT @PersonaEncargadaID = p.PersonID
      FROM personas p 
      WHERE FullName = 'PagWeb'

      DELETE FROM grupos_productos
      WHERE StockItemID = @ID_Producto

    INSERT INTO grupos_productos (
      StockItemID,
      StockGroupID,
      LastEditedBy
    )
    SELECT 
        @ID_Producto,
        CAST(value as int),
        @PersonaEncargadaID
    FROM STRING_SPLIT(@Grupos_Productos, ',')
    END

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
  Elimina un producto de la base de datos.
  Entradas:
    - @ID_Producto: Identificador del producto que se desea eliminar.
  Salidas:
    - Elimina el producto indicado de la base de datos.
  Restricciones:
    - @ID_Producto debe corresponder a un producto existente.
    - El producto no puede estar asociado a:
      - Una orden de compra
      - Una factura
      - Orden de cliente
      - Una oferta especial
      - Transacciones asociadas
*/
CREATE PROCEDURE EliminarProducto
  @ID_Producto int
AS
BEGIN
  SET XACT_ABORT ON
  BEGIN TRY
    BEGIN TRANSACTION

    IF NOT EXISTS (
      SELECT 1
      FROM productos p
      WHERE p.StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50017, 'El producto indicado no existe', 1
    END

    IF EXISTS (
      SELECT 1
      FROM detalle_ordenes do
      WHERE do.StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50019, 'El producto indicado se encuentra asociado a una orden', 1
    END

    IF EXISTS (
      SELECT 1
      FROM detalle_factura df
      WHERE df.StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50020, 'El producto indicado se encuentra asociado a una compra', 1
    END

    IF EXISTS (
      SELECT 1
      FROM detalles_ordenes_clientes dc
      WHERE dc.StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50019, 'El producto indicado se encuentra asociado a una orden', 1
    END

    IF EXISTS (
      SELECT 1
      FROM ofertas o
      WHERE o.StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50021, 'El producto indicado se ecuentra asociado a una oferta especial', 1
    END

    IF EXISTS (
      SELECT 1
      FROM transacciones_productos tp
      WHERE tp.StockItemID = @ID_Producto
    )
    BEGIN
      THROW 50022, 'El producto indicado se encuentra asociado a una transacción', 1
    END

    DELETE 
    FROM grupos_productos
    WHERE StockItemID = @ID_Producto

    DELETE 
    FROM inventario_productos
    WHERE StockItemID = @ID_Producto

    DELETE 
    FROM productos
    WHERE StockItemID = @ID_Producto

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

---------- Pruebas de los Stored Procedures ----------
EXECUTE GetProductos
EXECUTE BuscarProductos 'The Gu'
EXECUTE ObtenerGruposProductos
EXECUTE ObtenerDatosProducto '"The Gu" red shirt XML tag t-shirt (Black) 3XL'
EXECUTE AgregarNuevoProducto 
  @Nombre_Producto = 'Camiseta TEC', 
  @ProveedorID = 1,
  @ColorID = NULL,
  @Grupos_Productos = '1,2,3',
  @UnitPackageID = 7,
  @OuterPackageID = 7,
  @Marca = 'Trying',
  @Size = 'Mediano',
  @QuantityPerOuter = 10,
  @TaxRate = 2,
  @UnitPrice = 5,
  @RecommendedPrice = 6,
  @TypicalWeight = 1,
  @MarketingSearchDetails = 'Producto creado para probar el procedimiento.', 
  @BinLocation = 'A-01',
  @QuantityOnHand = 20
-- Ver los resultados de agregar
EXECUTE ObtenerDatosProducto 'Camiseta TEC'
EXECUTE EliminarProducto 278
SELECT StockItemID from productos p where StockItemName = 'Camiseta Tec'

-- Consultas
select * from productos
select * from nombre_grupo_producto
select * from grupos_productos where StockItemID = 328
select * from tipos_paquetes_productos
select * from inventario_productos