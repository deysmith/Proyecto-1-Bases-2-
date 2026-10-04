import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';

function ConfirmarDialogo({ abierto, titulo, texto, textoBoton, cargando, alConfirmar, alCancelar }) {
  return (
    <Dialog open={abierto} onClose={cargando ? undefined : alCancelar}>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{texto}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={alCancelar} disabled={cargando}>Cancelar</Button>
        <Button onClick={alConfirmar} color="error" variant="contained" disabled={cargando}>
          {cargando ? 'Eliminando...' : textoBoton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmarDialogo;