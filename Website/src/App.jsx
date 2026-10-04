import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import EncabezadoPagina from './components/EncabezadoPagina';
import Clientes from './pages/Clientes';
import Proveedores from './pages/Proveedores';
import Inventario from './pages/Inventario';
import Ventas from './pages/Ventas';

// Página temporal mientras se construyen los demás módulos
function Pronto({ titulo }) {
  return <EncabezadoPagina titulo={titulo} subtitulo="Este módulo se está construyendo." />;
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/clientes" replace />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/productos" element={<Inventario />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/estadisticas" element={<Pronto titulo="Estadísticas" />} />
        <Route path="*" element={<Navigate to="/clientes" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;