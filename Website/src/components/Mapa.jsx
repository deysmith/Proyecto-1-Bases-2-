import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconoMarcador from 'leaflet/dist/images/marker-icon.png';
import iconoMarcador2x from 'leaflet/dist/images/marker-icon-2x.png';
import sombraMarcador from 'leaflet/dist/images/marker-shadow.png';
import { Alert } from '@mui/material';

// Arregla los íconos del marcador, que se rompen al usar Vite
L.Icon.Default.mergeOptions({
  iconUrl: iconoMarcador,
  iconRetinaUrl: iconoMarcador2x,
  shadowUrl: sombraMarcador
});

// Cuando el mapa está dentro de una ventana (Dialog) hay que recalcular su tamaño
function AjustarTamano() {
  const mapa = useMap();

  useEffect(() => {
    const temporizador = setTimeout(() => mapa.invalidateSize(), 300);
    return () => clearTimeout(temporizador);
  }, [mapa]);

  return null;
}

function Mapa({ latitud, longitud, texto }) {
  const sinUbicacion =
    latitud === null || latitud === undefined || longitud === null || longitud === undefined;

  if (sinUbicacion) {
    return <Alert severity="info">Este registro no tiene una ubicación registrada.</Alert>;
  }

  return (
    <MapContainer
      center={[latitud, longitud]}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: 280, width: '100%', borderRadius: 8 }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitud, longitud]}>
        <Popup>{texto}</Popup>
      </Marker>
      <AjustarTamano />
    </MapContainer>
  );
}

export default Mapa;