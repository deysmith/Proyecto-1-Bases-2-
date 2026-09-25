USE WideWorldImporters;

/*
  En este archivo se van a ir creadon los sinónimos de las tablas cuando sea necesario
*/

CREATE SYNONYM clientes FOR Sales.Customers
CREATE SYNONYM categorias_clientes FOR Sales.CustomerCategories
CREATE SYNONYM grupo_compra FOR Sales.BuyingGroups

CREATE SYNONYM metodos_entrega FOR Application.DeliveryMethods
CREATE SYNONYM ciudades for Application.Cities
CREATE SYNONYM personas for Application.People

CREATE SYNONYM proveedores FOR Purchasing.Suppliers
CREATE SYNONYM categorias_proveedores For Purchasing.SupplierCategories

SELECT 
  name as Sinonimo,
  base_object_name as Tabla
FROM sys.synonyms

--drop synonym if exists 