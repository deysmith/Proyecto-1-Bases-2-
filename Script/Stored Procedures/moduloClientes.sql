/*
Devuelve el nombre, categoría y método de entrega de los clientes registrados
Entradas:
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
    - Nombre, categoría, método de entraga y entrega de los clientes registrados
Restricciones:
    - @NumeroPagina debe ser un número entero positivo
    - @CantidadRegistros deber ser mayor a 0 (entero positivo)
*/
CREATE PROCEDURE GetClientes 
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20

AS
BEGIN
  
  SELECT
      c.CustomerName,
      cc.CustomerCategoryName,
      me.DeliveryMethodName,
      ci.CityName
    FROM clientes c
    INNER JOIN categorias_clientes cc on cc.CustomerCategoryID = c.CustomerCategoryID
    INNER JOIN  metodos_entrega me on me.DeliveryMethodID = c.DeliveryMethodID
    INNER JOIN ciudades ci on ci.CityID = c.DeliveryCityID
    ORDER BY c.CustomerName ASC

    OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
    FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
Devuelve el nombre, categoría y método de entraga de los clientes qque su nombre
coincide con el criterio de búsqueda
Entradas:
    - @Criterio - nvarchar(100): Texto utilizado para buscar coincidencias con nombre
    - @CategoriaID - int: Identificador de la categoría
    - @MetodoEntregaID - int: Identificador del metodo de entrega
    - @NumeroPagina - Número de página que se desea consultar. 
    - @CantidadRegistros - Cantidad de registros que se mostrarán por página.
Salidas:
    - Nombre, categoría, método de entraga y ciudad de los clientes que su nombre cumple 
      con el criterio
Restricciones:
    - @NumeroPagina debe ser un número entero positivo
    - @CantidadRegistros deber ser mayor a 0 (entero positivo)
*/
CREATE PROCEDURE BuscarFiltrarClientes
  @Criterio nvarchar(100) = NULL,
  @CategoriaID int = NULL,
  @MetodoEntregaID int = NULL,
  @NumeroPagina int = 1,
  @CantidadRegistros int = 20

AS
BEGIN
  SELECT
      c.CustomerName,
      cc.CustomerCategoryName,
      me.DeliveryMethodName,
      ci.CityName
    FROM clientes c
    INNER JOIN categorias_clientes cc on cc.CustomerCategoryID = c.CustomerCategoryID
    INNER JOIN  metodos_entrega me on me.DeliveryMethodID = c.DeliveryMethodID
    INNER JOIN ciudades ci on ci.CityID = c.DeliveryCityID

    WHERE (
      @Criterio is NULL
      OR @Criterio = ''
      OR c.CustomerName LIKE '%' + @Criterio + '%'
    ) AND (
      @CategoriaID is NULL
      OR c.CustomerCategoryID = @CategoriaID
    ) AND (
      @MetodoEntregaID is NULL
      OR c.DeliveryMethodID = @MetodoEntregaID
    )

    ORDER BY c.CustomerName ASC
    OFFSET (@NumeroPagina - 1) * @CantidadRegistros ROWS
    FETCH NEXT @CantidadRegistros ROWS ONLY
END
GO

/*
Devuelve las categorías de los clientes
Entradas:
    - No recibe entradas
Salidas:
    - Categorías de los clientes registrados
Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerCategoriasClientes
AS
BEGIN
  SELECT 
      DISTINCT (cc.CustomerCategoryName),
      cc.CustomerCategoryID
  FROM categorias_clientes cc
  INNER JOIN clientes c on cc.CustomerCategoryID = c.CustomerCategoryID
END
GO

/*
Devuelve todos los métodos de entrega utilizados por lo clientes
Entradas:
    - No recibe parámetros
Salidas:
    - Los métodos de entrga que están vinvulo a algun cliente
Restricciones:
    - No posee restricciones
*/
CREATE PROCEDURE ObtenerMetodosDeEntregaClientes
AS
BEGIN
  SELECT DISTINCT (DeliveryMethodName),
  me.DeliveryMethodID
  FROM metodos_entrega me
  INNER JOIN clientes c on c.DeliveryMethodID = me.DeliveryMethodID
END
GO

/*
  Devuelve los detalles de un cliente en especifico
  Entradas:
    - @Nombre_Cliente - nvarchar(100): Nombre del cliente al que se le desean consultar sus datos 
  Salidas
    - Los siguientes datos del cliente: Nombre, categoría, grupo de compra, contactos, cliente por
      facturar, métodos de entrega, ciudad de entrega, código postal, teléfono, fax, payment days,
      dirección y localización geográfica.
  Restricciones
  - El nombre del cliente debe de coincidir con alguno registrado
*/
CREATE PROCEDURE ObtenerDatosClientes
  @Nombre_Cliente nvarchar(100)  --El nombre del cliente es único
AS
BEGIN
  SELECT
      c.CustomerName,
      cc.CustomerCategoryName,

      case 
        when c.BuyingGroupID is null then 'No pertenece a un grupo de compra'
        else gc.BuyingGroupName
      END AS BuyingGroupName,

      p.FullName as PrimaryContact,
      
      case
        when p1.FullName is null then 'No posee contacto alternativo'
        else p1.FullName
      END AS AlternativeContact,

      case
        when c.BillToCustomerID <> c.CustomerID then (SELECT CustomerName FROM clientes  WHERE CustomerID = c.BillToCustomerID)
        else c.CustomerName
      END AS BillToCustomer,

      me.DeliveryMethodName,
      ci.CityName,
      c.DeliveryPostalCode,
      c.PhoneNumber,
      c.FaxNumber,
      c.PaymentDays,
      c.WebsiteURL,
      CONCAT(
          'Entrega (Delivery): ',
          c.DeliveryAddressLine1, 
          ISNULL( ', ' +  c.DeliveryAddressLine2, ''), 
          ' - Postal',
          c.PostalAddressLine1, 
          ISNULL(', ' + c.PostalAddressLine2, '')) as Address,
      c.DeliveryLocation

  FROM clientes c
  INNER JOIN categorias_clientes cc on cc.CustomerCategoryID = c.CustomerCategoryID
  INNER JOIN personas p on p.PersonID = c.PrimaryContactPersonID
  INNER JOIN  metodos_entrega me on me.DeliveryMethodID = c.DeliveryMethodID
  INNER JOIN ciudades ci on ci.CityID = c.DeliveryCityID
  LEFT JOIN personas p1 on p1.PersonID = c.AlternateContactPersonID
  LEFT JOIN grupo_compra gc on gc.BuyingGroupID = c.BuyingGroupID

  WHERE c.CustomerName = @Nombre_Cliente
END
GO

/*
Agrega un nuevo cliente a la base de datos.
Entradas:
    - @Nombre_Cliente: Nombre del cliente.
    - @CategoriaID: Categoría del cliente.
    - @PrimaryContactID: Persona de contacto principal.
    - @MetodoEntregaID: Método de entrega.
    - @DeliveryCityID: Ciudad de entrega.
    - @PostalCityID: Ciudad postal.
    - @Telefono: Número de teléfono
    - @Fax: Fax
    - @WebsiteURL: Sitio web del cliente.
    - @DeliveryAddress1: Primera línea de la dirección de entrega.
    - @DeliveryPostalCode: Código postal de entrega.
    - @DeliveryLocation: Ubicación de entrega. Es opcional.
    - @PostalAddress1: Primera línea de la dirección postal.
    - @PostalPostalCode: Código postal de la dirección postal.
    - @DeliveryAddress2: Segunda línea de la dirección de entrega. Es opcional.
    - @PostalAddress2: Segunda línea de la dirección postal. Es opcional.
Salidas:
    - Identificador del cliente creado.
Valores por defecto:
    - BillToCustomerID: Igual al CustomerID generado.
    - AccountOpenedDate: Fecha actual.
    - StandardDiscountPercentage: 0.000.
    - IsStatementSent: 0.
    - IsOnCreditHold: 0.
    - PaymentDays: 0.
    - BuyingGroupID: NULL.
    - AlternateContactPersonID: NULL.
    - CreditLimit: NULL.
    - DeliveryRun: NULL.
    - RunPosition: NULL.
    - LastEditedBy: 1.
Restricciones:
    - CustomerName no puede estar repetido.
    - Los identificadores utilizados como referencia deben existir
      en sus respectivas tablas.
    - Si ocurre un error, la transacción se cancela.
*/
CREATE PROCEDURE AgregarNuevoCliente
    @Nombre_Cliente nvarchar(100),
    @CategoriaID INT,
    @PrimaryContactID INT,
    @MetodoEntregaID INT,
    @DeliveryCityID INT,
    @PostalCityID INT,
    @Telefono nvarchar(20),
    @Fax nvarchar(20),
    @WebsiteURL nvarchar(256),
    @DeliveryAddress1 nvarchar(60),
    @DeliveryPostalCode nvarchar(10),
    @DeliveryLocation nvarchar(MAX) = NULL,
    @PostalAddress1 nvarchar(60),
    @PostalPostalCode nvarchar(10),
    @DeliveryAddress2 nvarchar(60) = NULL,
    @PostalAddress2 nvarchar(60) = NULL
AS
BEGIN
    BEGIN TRY

        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1
            FROM clientes C
            WHERE C.CustomerName = @Nombre_Cliente
        )
        BEGIN
            THROW 50001, 'Ya existe un cliente con ese nombre.', 1;
        END

        DECLARE @ID_Cliente INT;
        SELECT @ID_Cliente = NEXT VALUE FOR Sequences.CustomerID;

        INSERT INTO clientes (
            CustomerID,
            CustomerName,
            BillToCustomerID,
            CustomerCategoryID,
            BuyingGroupID,
            PrimaryContactPersonID,
            AlternateContactPersonID,
            DeliveryMethodID,
            DeliveryCityID,
            PostalCityID,
            CreditLimit,
            AccountOpenedDate,
            StandardDiscountPercentage,
            IsStatementSent,
            IsOnCreditHold,
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
            @ID_Cliente,
            @Nombre_Cliente,
            @ID_Cliente,
            @CategoriaID,
            NULL,
            @PrimaryContactID,
            NULL,
            @MetodoEntregaID,
            @DeliveryCityID,
            @PostalCityID,
            NULL,
            CAST(GETDATE() AS DATE),
            0.000,
            0,
            0,
            0,
            @Telefono,
            @Fax,
            @WebsiteURL,
            @DeliveryAddress1,
            @DeliveryAddress2,
            @DeliveryPostalCode,
            CASE 
              WHEN @DeliveryLocation is NULL OR @DeliveryLocation = '' THEN NULL
              ELSE geography::Parse(@DeliveryLocation)
            END,
            @PostalAddress1,
            @PostalAddress2,
            @PostalPostalCode,
            1
        )

        COMMIT TRANSACTION;
        SELECT @ID_Cliente AS Cliente_ID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SELECT --Devolver los super errores
            ERROR_NUMBER() AS NumeroError,
            ERROR_MESSAGE() AS MensajeError,
            ERROR_LINE() AS LineaError
    END CATCH

END
GO


---------- Pruebas de los Stored Procedures ----------
EXECUTE GetClientes
EXECUTE BuscarFiltrarClientes 'Tailspin toys'
EXECUTE ObtenerCategoriasClientes
EXECUTE ObtenerMetodosDeEntregaClientes
EXECUTE ObtenerDatosClientes 'Tailspin Toys (Sylvanite, MT)'
EXEC AgregarNuevoCliente
    @Nombre_Cliente = 'Try Gonzales',
    @CategoriaID = 3,
    @PrimaryContactID = 2,
    @MetodoEntregaID = 3,
    @DeliveryCityID = 1,
    @PostalCityID = 1,
    @Telefono = '8888-8080',
    @Fax = '2020-2020',
    @WebsiteURL = 'https://www.clienteprueba.com',
    @DeliveryAddress1 = 'CAL',
    @DeliveryPostalCode = '70101',
    @PostalAddress1 = 'CAL',
    @PostalPostalCode = '70101'

select * from clientes c where c.Custome