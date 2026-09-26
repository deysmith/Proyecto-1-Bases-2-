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
    - @Criterio - nvarchar(50): Criterio de búsqueda
Salidas:
    - Nombre, categoría y método de envío de los proveedores que coincidan con
      el criterio de búsqueda
Restricciones:
    - EL criterio debe tener entre 0 y 50 caracteres
*/
CREATE PROCEDURE BuscarProveedores
  @Criterio nvarchar(50)
AS
BEGIN
SELECT
    p.SupplierName,
    c.SupplierCategoryName,
    ISNULL(me.DeliveryMethodName, 'No posee un metodo de entrega estándar') as DeliveryMethodName
  FROM proveedores p
  INNER JOIN categorias_proveedores c on c.SupplierCategoryID = p.SupplierCategoryID
  LEFT JOIN metodos_entrega me on me.DeliveryMethodID = p.DeliveryMethodID
  WHERE p.SupplierName LIKE '%' + @Criterio + '%' OR c.SupplierCategoryName LIKE '%' + @Criterio + '%'
  ORDER BY p.SupplierName ASC
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
      ISNULL(p.SupplierReference, 'No indica'),
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
      ISNULL(p.BankAccountBranch, 'No indica'),
      ISNULL(p.BankAccountNumber, 'No indica'),
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


select * from proveedores

---------- Pruebas de los Stored Procedures ----------
EXECUTE GetProveedores
EXECUTE BuscarProveedores No
EXECUTE ObtenerCategoriasProveedores
EXECUTE ObtenerDatosProveedor 'A Datum Corporation'
