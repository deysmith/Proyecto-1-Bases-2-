import { createTheme } from '@mui/material/styles';

// Paleta: 60% neutros (fondo claro), 30% azul (menú y encabezados), 10% verde azulado (acentos)
const tema = createTheme({
  palette: {
    primary: { main: '#1F4E79' },
    secondary: { main: '#00796B' },
    background: { default: '#F4F6F8', paper: '#FFFFFF' }
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: { fontWeight: 600, fontSize: '1.9rem' }
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } }
    }
  }
});

export default tema;