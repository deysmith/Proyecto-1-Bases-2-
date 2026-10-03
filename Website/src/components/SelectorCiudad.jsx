import { useEffect, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { pedir, armarQuery } from '../api';

function SelectorCiudad({ etiqueta, valor, alCambiar, textoError }) {
  const [opciones, setOpciones] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);

  // Busca las ciudades 300 ms después de que el usuario deja de escribir
  useEffect(() => {
    const temporizador = setTimeout(async () => {
      setCargando(true);
      try {
        const respuesta = await pedir('/api/generales/ciudades' + armarQuery({ criterio: texto.trim() }));
        setOpciones(respuesta.datos);
      } catch (e) {
        setOpciones([]);
      } finally {
        setCargando(false);
      }
    }, 300);

    return () => clearTimeout(temporizador);
  }, [texto]);

  // Si ya hay una ciudad elegida, se asegura de que esté en la lista de opciones
  const opcionesVisibles =
    valor && !opciones.some((opcion) => opcion.CityID === valor.CityID)
      ? [valor, ...opciones]
      : opciones;

  return (
    <Autocomplete
      options={opcionesVisibles}
      value={valor}
      loading={cargando}
      loadingText="Buscando..."
      noOptionsText="No se encontraron ciudades"
      filterOptions={(lista) => lista}
      getOptionLabel={(opcion) =>
        opcion.StateProvinceName ? `${opcion.CityName}, ${opcion.StateProvinceName}` : opcion.CityName
      }
      isOptionEqualToValue={(opcion, seleccionada) => opcion.CityID === seleccionada.CityID}
      onChange={(evento, nuevaCiudad) => alCambiar(nuevaCiudad)}
      onInputChange={(evento, nuevoTexto, razon) => {
        if (razon === 'input') setTexto(nuevoTexto);
      }}
      renderInput={(parametros) => (
        <TextField
          {...parametros}
          label={etiqueta}
          size="small"
          required
          error={Boolean(textoError)}
          helperText={textoError || 'Escriba para buscar la ciudad'}
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

export default SelectorCiudad;