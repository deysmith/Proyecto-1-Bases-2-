-- Devuelve los metodos de entrega disponibles
CREATE PROCEDURE ObtenerMetodosDeEntrega
AS
BEGIN
  SELECT DeliveryMethodName
  FROM metodos_entrega 
END
GO

---------- Pruebas de los Stored Procedures ----------
EXECUTE ObtenerMetodosDeEntrega
