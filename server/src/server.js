import 'dotenv/config.js';
import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Cotiza API escuchando en el puerto ${PORT}`);
});
