USE WideWorldImporters;

/*
  En este archivo se van a ir creadon los sinónimos de las tablas cuando sea necesario,
  esto para ir haciendo solo los necesarios
*/

CREATE SYNONYM clientes FOR Sales.Customers
CREATE SYNONYM categorias_clientes FOR Sales.CustomerCategories
CREATE SYNONYM grupo_compra FOR Sales.BuyingGroups

CREATE SYNONYM metodos_entrega FOR Application.DeliveryMethods
CREATE SYNONYM cuidades for Application.Cities
CREATE SYNONYM personas for Application.People

