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
CREATE SYNONYM categorias_proveedores FOR Purchasing.SupplierCategories

CREATE SYNONYM productos FOR Warehouse.StockItems
CREATE SYNONYM inventario_productos FOR Warehouse.StockItemHoldings
CREATE SYNONYM nombre_grupo_producto FOR Warehouse.StockGroups

/*
Warehouse.StockItemStockGroups es una tabla muchos a muchos, se relaciona
con Warehouse.StockItems para indicar el producto y con Warehouse.StockGroups
para incicar el grupo. Un porducto puede pertenecer a mas de un grupo, entonces 
eso se almacena en Warehouse.StockItemStockGroups
*/
CREATE SYNONYM grupos_productos FOR Warehouse.StockItemStockGroups
CREATE SYNONYM colores_productos FOR Warehouse.Colors
CREATE SYNONYM tipos_paquetes_productos FOR Warehouse.PackageTypes

SELECT 
  name as Sinonimo,
  base_object_name as Tabla
FROM sys.synonyms

--drop synonym if exists grupo_producto