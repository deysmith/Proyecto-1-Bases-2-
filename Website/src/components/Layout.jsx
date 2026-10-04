import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';

const anchoMenu = 240;

const opciones = [
  { texto: 'Clientes', ruta: '/clientes', icono: <PeopleIcon /> },
  { texto: 'Proveedores', ruta: '/proveedores', icono: <LocalShippingIcon /> },
  { texto: 'Inventario', ruta: '/productos', icono: <Inventory2Icon /> },
  { texto: 'Ventas', ruta: '/ventas', icono: <ReceiptLongIcon /> },
  { texto: 'Estadísticas', ruta: '/estadisticas', icono: <BarChartIcon /> }
];

function Layout({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  const menu = (
    <Box>
      <Toolbar />
      <List>
        {opciones.map((opcion) => (
          <ListItemButton
            key={opcion.ruta}
            component={NavLink}
            to={opcion.ruta}
            selected={ubicacion.pathname.startsWith(opcion.ruta)}
            onClick={() => setMenuAbierto(false)}
          >
            <ListItemIcon>{opcion.icono}</ListItemIcon>
            <ListItemText primary={opcion.texto} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (tema) => tema.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Abrir menú"
            edge="start"
            onClick={() => setMenuAbierto(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" fontWeight={700}>
            Wide World Importers
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Menú fijo en pantallas grandes */}
      <Drawer
        variant="permanent"
        sx={{
          width: anchoMenu,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: anchoMenu, boxSizing: 'border-box' }
        }}
      >
        {menu}
      </Drawer>

      {/* Menú desplegable en celulares */}
      <Drawer
        variant="temporary"
        open={menuAbierto}
        onClose={() => setMenuAbierto(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: anchoMenu, boxSizing: 'border-box' }
        }}
      >
        {menu}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;