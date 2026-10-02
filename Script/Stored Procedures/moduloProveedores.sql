USE WideWorldImporters;
GO

/*
Devuelve el nombre, categoría y método de entrega de todos los proveedores
Entradas:
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
    - Nombre, categoría y método de entrega de todos los proveedores
Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE GetProveedores
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
AS
BEGIN
SELECT
    p.SupplierID,
    p.SupplierName,
    c.SupplierCategoryName,
    ISNULL(me.DeliveryMethodName, 'No posee un metodo de entrega estándar') as DeliveryMethodName
  FROM proveedores p
  INNER JOIN categorias_proveedores c on c.SupplierCategoryID = p.SupplierCategoryID
  LEFT JOIN metodos_entrega me on me.DeliveryMethodID = p.DeliveryMethodID
  ORDER BY p.SupplierName ASC
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
Devuelve los proveedores donde su nombre o categoría coincida con el criterio
Entradas:
    - @Nombre_Proveedor - nvarchar(100): Nombre del proveedor 
    - @CategoriaID - int: ID de la categoría
    - @MetodoEntegaID - int: ID de la metodo de entrega
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
    - Nombre, categoría y método de envío de los proveedores que coincidan con
      el criterio de búsqueda
Restricciones:
    - EL criterio debe tener entre 0 y 50 caracteres
*/
CREATE PROCEDURE BuscarProveedores
  @Nombre_Proveedor nvarchar(100) = NULL,
  @CategoriaID int = NULL,
  @MetodoEntegaID int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20
AS
BEGIN
SELECT
    p.SupplierID,
    p.SupplierName,
    c.SupplierCategoryName,
    ISNULL(me.DeliveryMethodName, 'No posee un metodo de entrega estándar') as DeliveryMethodName
  FROM proveedores p
  INNER JOIN categorias_proveedores c on c.SupplierCategoryID = p.SupplierCategoryID
  LEFT JOIN metodos_entrega me on me.DeliveryMethodID = p.DeliveryMethodID
  WHERE (
    @Nombre_Proveedor IS NULL
    OR @Nombre_Proveedor = ''
    OR p.SupplierName LIKE '%' + @Nombre_Proveedor + '%' 
  ) AND (
    @CategoriaID IS NULL
    OR p.SupplierCategoryID = @CategoriaID
  ) AND (
    @MetodoEntegaID IS NULL
    OR p.DeliveryMethodID = @MetodoEntegaID
  )
  ORDER BY p.SupplierName ASC
  OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
  FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
Devuelve las categorías de los proveedores
Entradas:
    - No recibe entradas
Salidas:
    - Un 'lista' con las categorías de los proveedores
Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerCategoriasProveedores
AS
BEGIN
  SELECT
      DISTINCT c.SupplierCategoryName, c.SupplierCategoryID
  FROM categorias_proveedores c
  INNER JOIN proveedores p on p.SupplierCategoryID = c.SupplierCategoryID
END
GO

/*
Devuelve todos los métodos de entrega utilizados por lo proveedores
Entradas:
    - No recibe parámetros
Salidas:
    - Los métodos de entrga que están vinvulo a algun proveedpr
Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerMetodosDeEntregaProveedores
AS
BEGIN
  SELECT DISTINCT me.DeliveryMethodName, me.DeliveryMethodID
  FROM metodos_entrega me
  INNER JOIN proveedores p on p.DeliveryMethodID = me.DeliveryMethodID
END
GO

/*
Se encarga de devolver los detalles de un proveedor en especifico
Entradas:
    - @Nombre_Proveedor narchar(100): Nombre del proveedor al que se le desean
      ver los detalles
Salidas:
    - Los siguientes datos del proveedor: código, nombre, categpría, contactos,
      método de entrega, cuidad de entrega, código postal, teléfono, fax, sitio 
      web, dirección, nombre del banco, número de cuenta corriente, payment days,
      y localización geografía
Restricciones:
    -
*/
CREATE PROCEDURE ObtenerDatosProveedor
  @Nombre_Proveedor nvarchar(100) = NULL,
  @ID_Proveedor int = NULL
AS
BEGIN
  SELECT 
      p.SupplierID,
      ISNULL(p.SupplierReference, 'No indica') as SupplierReference,
      p.SupplierName,
      c.SupplierCategoryName,
      pe.FullName as PrimaryContact,
      pe1.FullName as AlternativeContact,
      ISNULL(me.DeliveryMethodName, 'No posee un metodo de entrega estándar') as DeliveryMethodName,
      ci.CityName,
      p.DeliveryPostalCode,
      p.PhoneNumber,
      p.FaxNumber,
      p.WebsiteURL,
      CONCAT(
          'Entrega (Delivery): ',
          p.DeliveryAddressLine1, 
          ISNULL( ', ' +  p.DeliveryAddressLine2, ''), 
          ' - Postal',
          p.PostalAddressLine1, 
          ISNULL(', ' + p.PostalAddressLine2, '')) as Address,
      p.DeliveryLocation,
      ISNULL(p.BankAccountBranch, 'No indica') as BankAccountBranch,
      ISNULL(p.BankAccountNumber, 'No indica') as BankAccountNumber,
      p.PaymentDays

  FROM proveedores p
  INNER JOIN categorias_proveedores c on c.SupplierCategoryID = p.SupplierCategoryID
  INNER JOIN personas pe on pe.PersonID = p.PrimaryContactPersonID
  INNER JOIN ciudades ci on ci.CityID = p.DeliveryCityID
  LEFT JOIN personas pe1 on pe1.PersonID = p.AlternateContactPersonID
  LEFT JOIN metodos_entrega me on me.DeliveryMethodID = p.DeliveryMethodID
  WHERE (@ID_Proveedor IS NULL AND p.SupplierName = @Nombre_Proveedor)
     OR (@ID_Proveedor IS NOT NULL AND p.SupplierID = @ID_Proveedor)
END
GO

/*
Se encarga de agregar un nuevo proveedor a la base de datos y crear sus personas de contacto.
Entradas:
  - @Nombre_Proveedor: Nombre del proveedor.
  - @CategoriaID: Categoría del proveedor.
  - @Nombre_ContactoPrimario: Nombre de la persona de contacto principal.
  - @Nombre_ContactoSecundario: Nombre de la persona de contacto secundaria.
  - @MetodoEntegaID: Método de entrega utilizado por el proveedor.
  - @DeliveryCityID: Identificador de la ciudad de entrega.
  - @PostalCityID: Identificador de la ciudad postal.
  - @SupplierReference: Referencia del proveedor.
  - @BanckAccountBranch: Sucursal de la cuenta bancaria.
  - @BankAccountNumber: Número de cuenta bancaria.
  - @PaymentDays: Cantidad de días para realizar el pago.
  - @Telefono: Número de teléfono del proveedor.
  - @Fax: Número de fax del proveedor.
  - @WebsiteURL: Sitio web del proveedor.
  - @DeliveryAddress1: Primera línea de la dirección de entrega.
  - @DeliveryPostalCode: Código postal de entrega.
  - @DeliveryLocation: Ubicación geográfica de entrega. Es opcional.
  - @PostalAddress1: Primera línea de la dirección postal.
  - @PostalPostalCode: Código postal de la dirección postal.
  - @DeliveryAddress2: Segunda línea de la dirección de entrega. Es opcional.
  - @PostalAddress2: Segunda línea de la dirección postal. Es opcional.
Salidas:
  - Identificador del proveedor creado.
  - Identificador del contacto primario creado.
  - Identificador del contacto secundario creado.
Valores por defecto:
  - IsPermittedToLogon: 0.
  - IsExternalLogonProvider: 0.
  - HashedPassword: NULL.
  - IsSystemUser: 1.
  - IsEmployee: 1.
  - IsSalesperson: 0.
  - UserPreferences: NULL.
  - PhoneNumber: NULL para las personas creadas.
  - FaxNumber: NULL para las personas creadas.
  - EmailAddress: NULL para las personas creadas.
  - Photo: NULL.
  - CustomFields: NULL.
  - LastEditedBy: Persona PagWeb.
Restricciones:
  - SupplierName no puede estar repetido.
  - Los identificadores utilizados como referencia deben existir
    en sus respectivas tablas.
  - Los contactos primario y secundario deben crearse correctamente
    antes de crear el proveedor.
  - Si ocurre un error, la transacción se cancela.
*/
CREATE PROCEDURE AgregarNuevoProveedor 
  @Nombre_Proveedor nvarchar(100),
  @CategoriaID int,
  @Nombre_ContactoPrimario nvarchar(50) = NULL,
  @Nombre_ContactoSecundario nvarchar(50) = NULL,
  @ID_ContactoPrimario int = NULL,
  @ID_ContactoSecundario int = NULL,
  @MetodoEntegaID int,
  @DeliveryCityID int,
  @PostalCityID int,
  @SupplierReference nvarchar(20),
  @BanckAccountBranch nvarchar(50),
  @BankAccountNumber nvarchar(20),
  @PaymentDays int,
  @Telefono nvarchar(20),
  @Fax nvarchar(20),
  @WebsiteURL nvarchar(265),
  @DeliveryAddress1 nvarchar(60),
  @DeliveryPostalCode nvarchar(10),
  @DeliveryLocation nvarchar(256) = NULL,
  @PostalAddress1 nvarchar(60),
  @PostalPostalCode nvarchar(10),
  @DeliveryAddress2 nvarchar(60) = NULL,
  @PostalAddress2 nvarchar(60) = NULL
AS
BEGIN
  SET XACT_ABORT ON
  DECLARE @ID_Proveedor int
  DECLARE @PersonaEncargadaID int

  BEGIN TRY
    BEGIN TRANSACTION

    IF EXISTS (
      SELECT 1
      FROM proveedores p
      WHERE p.SupplierName = @Nombre_Proveedor
    )

    BEGIN
      THROW 50003, 'Ya existe un proveedor con ese nombre', 1
    END

    SELECT @ID_Proveedor = NEXT VALUE FOR Sequences.SupplierID

    SELECT @PersonaEncargadaID = p.PersonID
    FROM personas p 
    WHERE FullName = 'PagWeb'

    IF @ID_ContactoPrimario is NOT NULL
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM personas p
        WHERE p.PersonID = @ID_ContactoPrimario
      )
      BEGIN
        THROW 50023, 'La persona indicada como contacto primario no existe', 1 
      END
    END

    ELSE IF @Nombre_ContactoPrimario is NOT NULL
    BEGIN
      SELECT @ID_ContactoPrimario = NEXT VALUE FOR Sequences.PersonID

      INSERT INTO personas (
          PersonID,
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
          @ID_ContactoPrimario,
          @Nombre_ContactoPrimario,
          @Nombre_ContactoPrimario,
          0,
          0,
          0,
          1,
          0,
          @PersonaEncargadaID
      )
      END

    IF @ID_ContactoSecundario is NOT NULL
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM personas p
          WHERE p.PersonID = @ID_ContactoSecundario
        )
        BEGIN
          THROW 50024, 'La persona indicada como contacto secundario no existe', 1 
        END
    END

    ELSE IF @Nombre_ContactoSecundario IS NOT NULL
      BEGIN

      SELECT @ID_ContactoSecundario = NEXT VALUE FOR Sequences.PersonID

      INSERT INTO personas (
          PersonID,
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
          @ID_ContactoSecundario,
          @Nombre_ContactoSecundario,
          @Nombre_ContactoSecundario,
          0,
          0,
          0,
          1,
          0,
          @PersonaEncargadaID
      )
    END

    INSERT INTO proveedores (
      SupplierID,
      SupplierName,
      SupplierCategoryID,
      PrimaryContactPersonID,
      AlternateContactPersonID,
      DeliveryMethodID,
      DeliveryCityID,
      PostalCityID,
      SupplierReference,
      BankAccountBranch,
      BankAccountNumber,
      PaymentDays,
      PhoneNumber,
      FaxNumber,
      WebsiteURL,
      DeliveryAddressLine1,
      DeliveryAddressLine2,
      DeliveryPostalCode,
      DeliveryLocation,
      PostalAddressLine1,
      PostalAddressLine2,
      PostalPostalCode,
      LastEditedBy
    )
    VALUES (
      @ID_Proveedor,
      @Nombre_Proveedor,
      @CategoriaID,
      @ID_ContactoPrimario,
      @ID_ContactoSecundario,
      @MetodoEntegaID,
      @DeliveryCityID,
      @PostalCityID,
      @SupplierReference,
      @BanckAccountBranch,
      @BankAccountNumber,
      @PaymentDays,
      @Telefono,
      @Fax,
      @WebsiteURL,
      @DeliveryAddress1,
      @DeliveryAddress2,
      @DeliveryPostalCode,
      @DeliveryLocation,
      @PostalAddress1,
      @PostalAddress2,
      @PostalPostalCode,
      @PersonaEncargadaID
    )

    COMMIT TRANSACTION

  SELECT
    @ID_Proveedor AS SupplierID,
    @ID_ContactoPrimario AS ID_ContactoPrimario,
    @ID_ContactoSecundario AS ID_ContactoSecundario,

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
  Edita los datos de un proveedor existente en la base de datos.
  Entradas:
    - @ID_Proveedor: Identificador del proveedor que se desea editar.
    Los siguientes parámetros son opcionales
    - @Nombre_Proveedor: Nuevo nombre del proveedor.
    - @CategoriaID: Nueva categoría del proveedor.
    - @MetodoEntegaID: Nuevo método de entrega.
    - @DeliveryCityID: Nueva ciudad de entrega.
    - @PostalCityID: Nueva ciudad postal.
    - @SupplierReference: Nueva referencia del proveedor.
    - @BanckAccountBranch: Nueva sucursal de la cuenta bancaria.
    - @BankAccountNumber: Nuevo número de cuenta bancaria.
    - @PaymentDays: Nueva cantidad de días establecidos para el pago.
    - @Telefono: Nuevo número de teléfono.
    - @Fax: Nuevo número de fax.
    - @WebsiteURL: Nuevo sitio web del proveedor.
    - @DeliveryAddress1: Primera línea de la nueva dirección de entrega.
    - @DeliveryPostalCode: Nuevo código postal de entrega.
    - @DeliveryLocation: Nueva ubicación de entrega.
    - @PostalAddress1: Primera línea de la nueva dirección postal.
    - @PostalPostalCode: Nuevo código postal de la dirección postal.
    - @DeliveryAddress2: Segunda línea de la nueva dirección de entrega. 
    - @PostalAddress2: Segunda línea de la nueva dirección postal.
  Salidas:
    - Actualiza los datos del proveedor indicado.
    Restricciones:
    - @ID_Proveedor debe corresponder a un proveedor existente.
    - @Nombre_Proveedor no puede coincidir con el nombre de otro proveedor.
    - Si un parámetro es null, se conserva el valor actual del proveedor.
*/
CREATE PROCEDURE EditarDatosProveedor
  @ID_Proveedor int,
  @Nombre_Proveedor nvarchar(100) = NULL,
  @CategoriaID int = NULL,
  @MetodoEntegaID int = NULL,
  @DeliveryCityID int = NULL,
  @PostalCityID int = NULL,
  @SupplierReference nvarchar(20) = NULL,
  @BanckAccountBranch nvarchar(50) = NULL,
  @BankAccountNumber nvarchar(20) = NULL,
  @PaymentDays int = NULL,
  @Telefono nvarchar(20) = NULL,
  @Fax nvarchar(20) = NULL,
  @WebsiteURL nvarchar(265) = NULL,
  @DeliveryAddress1 nvarchar(60) = NULL,
  @DeliveryPostalCode nvarchar(10) = NULL,
  @DeliveryLocation nvarchar(MAX) = NULL,
  @PostalAddress1 nvarchar(60) = NULL,
  @PostalPostalCode nvarchar(10) = NULL,
  @DeliveryAddress2 nvarchar(60) = NULL,
  @PostalAddress2 nvarchar(60) = NULL
AS
BEGIN
  SET XACT_ABORT ON

  BEGIN TRY
    BEGIN TRANSACTION

    IF NOT EXISTS (
      SELECT 1
      FROM proveedores p
      WHERE p.SupplierID = @ID_Proveedor
    )
    BEGIN
      THROW 50011, 'El proveedor indicado no existe', 1
    END

    IF @Nombre_Proveedor is NOT NULL AND EXISTS (
      SELECT 1
      FROM proveedores p
      WHERE p.SupplierName = @Nombre_Proveedor AND p.SupplierID <> @ID_Proveedor
    )
    BEGIN
      THROW 50003, 'Ya existe un proveedor con ese nombre', 1
    END

    UPDATE proveedores
    SET
      SupplierName = ISNULL(@Nombre_Proveedor, SupplierName),
      SupplierCategoryID = ISNULL(@CategoriaID, SupplierCategoryID),
      DeliveryMethodID = ISNULL(@MetodoEntegaID, DeliveryMethodID),
      DeliveryCityID = ISNULL(@DeliveryCityID, DeliveryCityID),
      PostalCityID = ISNULL(@PostalCityID, PostalCityID),
      SupplierReference = ISNULL(@SupplierReference, SupplierReference),
      BankAccountBranch = ISNULL(@BanckAccountBranch, BankAccountBranch),
      BankAccountNumber = ISNULL(@BankAccountNumber, BankAccountNumber),
      PaymentDays = ISNULL(@PaymentDays, PaymentDays),
      PhoneNumber = ISNULL(@Telefono, PhoneNumber),
      FaxNumber = ISNULL(@Fax, FaxNumber),
      WebsiteURL = ISNULL(@WebsiteURL, WebsiteURL),
      DeliveryAddressLine1 = ISNULL(@DeliveryAddress1, DeliveryAddressLine1),
      DeliveryAddressLine2 = ISNULL(@DeliveryAddress2, DeliveryAddressLine2),
      DeliveryPostalCode = ISNULL(@DeliveryPostalCode, DeliveryPostalCode),
      DeliveryLocation = ISNULL(geography::Parse(@DeliveryLocation), DeliveryLocation),
      PostalAddressLine1 = ISNULL(@PostalAddress1, PostalAddressLine1),
      PostalAddressLine2 = ISNULL(@PostalAddress2, PostalAddressLine2),
      PostalPostalCode = ISNULL(@PostalPostalCode, PostalPostalCode)
    WHERE SupplierID = @ID_Proveedor

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
  Elimina un proveedor de la base de datos.
  Entradas:
    - @ID_Proveedor: Identificador del proveedor que se desea eliminar.
  Salidas:
    - Elimina el proveedor indicado de la base de datos.
  Restricciones:
    - @ID_Proveedor debe corresponder a un proveedor existente.
    - El proveedor no puede tener:
      - Órdenes de compra asociadas.
      - Transacciones asociadas.
      - Productos asociados.
      - Transacciones relacionadas con productos.
*/
CREATE PROCEDURE BorrarProveedor
  @ID_Proveedor int
AS
BEGIN
  SET XACT_ABORT ON

  BEGIN TRY
    BEGIN TRANSACTION

    IF NOT EXISTS (
      SELECT 1
      FROM proveedores p
      WHERE p.SupplierID = @ID_Proveedor
    )
    BEGIN
      THROW 50011, 'El proveedor indicado no existe', 1
    END

    IF EXISTS (
      SELECT 1
      FROM ordenes o
      WHERE o.SupplierID = @ID_Proveedor
    )
    BEGIN
      THROW 50013, 'El proveedor indicado posee ordenes asociadas', 1
    END

    IF EXISTS (
      SELECT 1
      FROM transacciones_proveedores tp
      WHERE tp.SupplierID = @ID_Proveedor
    )
    BEGIN
      THROW 50014, 'El proveedor indicado posee transacciones asociadas', 1
    END

    IF EXISTS (
      SELECT 1
      FROM productos p
      WHERE p.SupplierID = @ID_Proveedor
    )
    BEGIN
      THROW 50015, 'El proveedor indicado posee productos asociadas', 1
    END

    IF EXISTS (
      SELECT 1
      FROM transacciones_productos tp
      WHERE tp.SupplierID = @ID_Proveedor
    )
    BEGIN
      THROW 50016, 'El proveedor indicado posee transacciones relacionadas con productos asociadas', 1
    END

    DELETE
    FROM proveedores
    WHERE SupplierID = @ID_Proveedor

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

select * from proveedores
select * from personas

---------- Pruebas de los Stored Procedures ----------
EXECUTE GetProveedores
EXECUTE BuscarProveedores No
EXECUTE ObtenerCategoriasProveedores
EXECUTE ObtenerDatosProveedor 'A Datum Corporation'
EXEC AgregarNuevoProveedor 
  @Nombre_Proveedor = 'Monge',
  @CategoriaID = 2,
  @Nombre_ContactoPrimario = NULL,
  @Nombre_ContactoSecundario = 'Luis',
  @ID_ContactoPrimario = 5,
  @MetodoEntegaID = 1,
  @DeliveryCityID = 1,
  @PostalCityID = 1,
  @SupplierReference = 'Gollo',
  @BanckAccountBranch = 'Banco Popular',
  @BankAccountNumber = '123456789',
  @PaymentDays = 30,
  @Telefono = '8888-8080',
  @Fax = '2020-2222',
  @WebsiteURL = 'https://www.gollo.com',
  @DeliveryAddress1 = 'Limón centro',
  @DeliveryPostalCode = '70101', 
  @DeliveryLocation = NULL,
  @PostalAddress1 = 'Limón centro',
  @PostalPostalCode = '70101',
  @DeliveryAddress2 = NULL,
  @PostalAddress2 = NULL
EXECUTE ObtenerDatosProveedor 'Monge'
EXECUTE EditarDatosProveedor @ID_Proveedor = 18, @Nombre_Proveedor = 'Monge'
EXECUTE BorrarProveedor 64

select p.SupplierID from proveedores p where p.SupplierName = 'Monge'
delete from personas where FullName = 'Luis'