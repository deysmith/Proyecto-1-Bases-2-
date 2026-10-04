import { Alert, Snackbar } from '@mui/material';

// aviso = { tipo: 'success' | 'error', texto: '...' }  (o null para ocultarlo)
function Aviso({ aviso, alCerrar }) {
  return (
    <Snackbar
      open={Boolean(aviso)}
      autoHideDuration={6000}
      onClose={alCerrar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={alCerrar} severity={aviso ? aviso.tipo : 'info'} variant="filled">
        {aviso ? aviso.texto : ''}
      </Alert>
    </Snackbar>
  );
}

export default Aviso;