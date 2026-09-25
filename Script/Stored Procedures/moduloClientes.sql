/*
Devuelve el nombre, categoría y método de entraga de los clientes registradas
Entradas:
    - No recibe entradas
Salidas:
    - Nombre, categoría y método de entraga de los clientes registradas
Restricciones:
    - No posee restrcciones
*/
CREATE PROCEDURE GetClientes 
AS
BEGIN
  SELECT
      c.CustomerName,
      cc.CustomerCategoryName,
      me.DeliveryMethodName
    FROM clientes c
    INNER JOIN categorias_clientes cc on cc.CustomerCategoryID = c.CustomerCategoryID
    INNER JOIN  metodos_entrega me on me.DeliveryMethodID = c.DeliveryMethodID
    ORDER BY c.CustomerName ASC
END
GO

/*
Devuelve el nombre, categoría y método de entraga de los clientes qque su nombre
coincide con el criterio de búsqueda
Entradas:
    - @Criterio - nvarchar(50): Criterio de búsqueda
Salidas:
    - Nombre, categoría y método de entraga de los clientes que su nombre cumple 
      con el criterio
Restricciones:
    - @Criterio dene tener una longitud de 0 a 50 caracteres
*/
CREATE PROCEDURE BuscarClientes
  @Criterio nvarchar(50)
AS
BEGIN
  SELECT
      c.CustomerID,
      c.CustomerName,
      cc.CustomerCategoryName,
      me.DeliveryMethodName
    FROM clientes c
    INNER JOIN categorias_clientes cc on cc.CustomerCategoryID = c.CustomerCategoryID
    INNER JOIN  metodos_entrega me on me.DeliveryMethodID = c.DeliveryMethodID
    WHERE c.CustomerName LIKE '%' + @Criterio + '%'
    ORDER BY c.CustomerName ASC
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
      cc.CustomerCategoryName
  FROM categorias_clientes cc
END
GO

/*
  Devuelve los detalles de un cliente en especifico
  Entradas:
    - @Nombre_Cliente - nvarchar(100): Nombre del cliente al que se le desean consultar sus datos 
  Salidas
    - Los siguientes datos del cliente: Nombre, categoría, grupo de compra, contactos, cliente por
      facturar, métodos de entrega, cuidad de entrega, código postal, teléfono, fax, payment days,
      dirección y localización geográfica.
  Restricciones
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

select * from clientes where CustomerID = 2

---------- Pruebas de los Stored Procedures ----------
EXECUTE GetClientes
EXECUTE BuscarClientes 'Tailspin toys'
EXECUTE ObtenerCategoriasClientes
EXECUTE ObtenerDatosClientes 'Tailspin Toys (Sylvanite, MT)'