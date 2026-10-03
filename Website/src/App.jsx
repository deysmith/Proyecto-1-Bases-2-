import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import EncabezadoPagina from './components/EncabezadoPagina';
import Clientes from './pages/Clientes';

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
        <Route path="/proveedores" element={<Pronto titulo="Proveedores" />} />
        <Route path="/productos" element={<Pronto titulo="Inventario" />} />
        <Route path="/ventas" element={<Pronto titulo="Ventas" />} />
        <Route path="/estadisticas" element={<Pronto titulo="Estadísticas" />} />
        <Route path="*" element={<Navigate to="/clientes" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;