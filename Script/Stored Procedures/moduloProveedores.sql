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
      DISTINCT (c.SupplierCategoryName)
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
  SELECT DISTINCT (DeliveryMethodName)
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
  @Nombre_Proveedor nvarchar(100)
AS
BEGIN
  SELECT 
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
  WHERE p.SupplierName = @Nombre_Proveedor
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
  @Nombre_ContactoPrimario nvarchar(50),
  @Nombre_ContactoSecundario nvarchar(50),
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
  @DeliveryLocation nvarchar(MAX) = NULL,
  @PostalAddress1 nvarchar(60),
  @PostalPostalCode nvarchar(10),
  @DeliveryAddress2 nvarchar(60) = NULL,
  @PostalAddress2 nvarchar(60) = NULL
AS
BEGIN
  SET XACT_ABORT ON
  DECLARE @ID_Proveedor int
  DECLARE @PersonaEncargadaID int
  DECLARE @ID_ContactoPrimario int
  DECLARE @ID_ContactoSecundario int

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
    SELECT @ID_Proveedor as Proveedor_ID

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
  @Nombre_Proveedor = 'Gollos',
  @CategoriaID = 2,
  @Nombre_ContactoPrimario = 'Ana',
  @Nombre_ContactoSecundario = 'Luis',
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
EXECUTE ObtenerDatosProveedor 'Gollos'