import { useEffect, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { pedir, armarQuery } from '../api';

// ruta: dirección de la API que busca. parametro: nombre del parámetro con el texto escrito.
// extra: otros parámetros fijos de la búsqueda. campoId y campoNombre: columnas que devuelve la API.
function SelectorBusqueda({
  etiqueta, valor, alCambiar, textoError, ruta, parametro, campoId, campoNombre, extra, ayuda, obligatorio
}) {
  const [opciones, setOpciones] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);

  // Busca 300 ms después de que el usuario deja de escribir
  useEffect(() => {
    const temporizador = setTimeout(async () => {
      setCargando(true);
      try {
        const respuesta = await pedir(ruta + armarQuery({ ...extra, [parametro]: texto.trim() }));
        setOpciones(respuesta.datos);
      } catch (e) {
        setOpciones([]);
      } finally {
        setCargando(false);
      }
    }, 300);

    return () => clearTimeout(temporizador);
  }, [texto]);

  // Si ya hay una opción elegida, se asegura de que esté en la lista
  const opcionesVisibles =
    valor && !opciones.some((opcion) => opcion[campoId] === valor[campoId])
      ? [valor, ...opciones]
      : opciones;

  return (
    <Autocomplete
      options={opcionesVisibles}
      value={valor}
      loading={cargando}
      loadingText="Buscando..."
      noOptionsText="No se encontraron resultados"
      filterOptions={(lista) => lista}
      getOptionLabel={(opcion) => opcion[campoNombre]}
      isOptionEqualToValue={(opcion, seleccionada) => opcion[campoId] === seleccionada[campoId]}
      onChange={(evento, nuevaOpcion) => alCambiar(nuevaOpcion)}
      onInputChange={(evento, nuevoTexto, razon) => {
        if (razon === 'input') setTexto(nuevoTexto);
      }}
      renderInput={(parametros) => (
        <TextField
          {...parametros}
          label={etiqueta}
          size="small"
          required={obligatorio !== false}
          error={Boolean(textoError)}
          helperText={textoError || ayuda || 'Escriba para buscar'}
          slotProps={{
            input: {
              ...parametros.InputProps,
              endAdornment: (
                <>
                  {cargando ? <CircularProgress size={18} /> : null}
                  {parametros.InputProps.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
}

export default SelectorBusqueda;