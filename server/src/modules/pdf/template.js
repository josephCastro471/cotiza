import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 16 },
  empresa: { fontSize: 14, fontWeight: 700 },
  folio: { position: 'absolute', top: 20, right: 20, fontSize: 11 },
  tabla: { marginTop: 16, borderTopWidth: 1, borderColor: '#000' },
  fila: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ccc', paddingVertical: 4 },
  filaBanda: { backgroundColor: '#F4F7F1' },
  col: { flex: 1 },
  colMonto: { flex: 1, textAlign: 'right' },
  totales: { marginTop: 12, borderTopWidth: 2, borderColor: '#000', paddingTop: 6, alignItems: 'flex-end' },
  sello: { position: 'absolute', top: 60, right: 20, borderWidth: 2, padding: 8, transform: 'rotate(-4deg)' },
});

function CotizacionDocument({ cotizacion }) {
  const colorSello = cotizacion.estado === 'APROBADO' ? '#1F6B4E' : '#A33A28';
  const mostrarSello = cotizacion.estado === 'APROBADO' || cotizacion.estado === 'RECHAZADO';

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.folio }, cotizacion.folio),
      mostrarSello &&
        React.createElement(
          View,
          { style: { ...styles.sello, borderColor: colorSello } },
          React.createElement(Text, { style: { color: colorSello, fontWeight: 700 } }, cotizacion.estado)
        ),
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.empresa }, cotizacion.empresa.nombre),
        React.createElement(Text, null, `RUC ${cotizacion.empresa.ruc}`),
        React.createElement(Text, null, `Cliente: ${cotizacion.cliente.nombre} — RUC ${cotizacion.cliente.ruc}`)
      ),
      React.createElement(
        View,
        { style: styles.tabla },
        ...cotizacion.lineas.map((linea, i) =>
          React.createElement(
            View,
            { key: linea.id, style: [styles.fila, i % 2 === 1 ? styles.filaBanda : {}] },
            React.createElement(Text, { style: styles.col }, linea.descripcion),
            React.createElement(Text, { style: styles.colMonto }, String(linea.cantidad)),
            React.createElement(Text, { style: styles.colMonto }, `$ ${Number(linea.precioUnitario).toFixed(2)}`),
            React.createElement(Text, { style: styles.colMonto }, `$ ${Number(linea.subtotal).toFixed(2)}`)
          )
        )
      ),
      React.createElement(
        View,
        { style: styles.totales },
        React.createElement(Text, null, `Subtotal: $ ${Number(cotizacion.subtotal).toFixed(2)}`),
        React.createElement(Text, null, `IVA: $ ${Number(cotizacion.iva).toFixed(2)}`),
        React.createElement(Text, { style: { fontWeight: 700 } }, `Total: $ ${Number(cotizacion.total).toFixed(2)}`)
      )
    )
  );
}

export { CotizacionDocument };
