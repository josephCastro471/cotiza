function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calcularSubtotalLinea({ cantidad, precioUnitario, descuentoPct }) {
  const bruto = cantidad * precioUnitario;
  const descuento = bruto * (descuentoPct / 100);
  return round2(bruto - descuento);
}

function calcularTotalesCotizacion(lineas, ivaPct) {
  const subtotal = round2(lineas.reduce((acc, linea) => acc + calcularSubtotalLinea(linea), 0));
  const iva = round2(subtotal * (ivaPct / 100));
  const total = round2(subtotal + iva);
  return { subtotal, iva, total };
}

export { round2, calcularSubtotalLinea, calcularTotalesCotizacion };
