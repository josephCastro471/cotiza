const TRANSICIONES = {
  BORRADOR: { enviar: 'ENVIADO' },
  ENVIADO: { aprobar: 'APROBADO', rechazar: 'RECHAZADO', devolver: 'BORRADOR', vencer: 'VENCIDO' },
  APROBADO: {},
  RECHAZADO: {},
  VENCIDO: {},
};

function puedeTransicionar(estadoActual, accion) {
  return Boolean(TRANSICIONES[estadoActual] && TRANSICIONES[estadoActual][accion]);
}

function siguienteEstado(estadoActual, accion) {
  if (!puedeTransicionar(estadoActual, accion)) {
    const err = new Error(`No se puede "${accion}" una cotización en estado ${estadoActual}.`);
    err.code = 'TRANSICION_INVALIDA';
    throw err;
  }
  return TRANSICIONES[estadoActual][accion];
}

export { TRANSICIONES, puedeTransicionar, siguienteEstado };
