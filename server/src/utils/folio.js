async function generarFolio(prisma, empresaId) {
  const empresa = await prisma.empresa.update({
    where: { id: empresaId },
    data: { siguienteFolio: { increment: 1 } },
  });
  const numero = empresa.siguienteFolio - 1;
  return `${empresa.prefijoFolio}-${String(numero).padStart(4, '0')}`;
}

async function generarFolioDuplicado(prisma, cotizacionOrigen) {
  const hermanos = await prisma.cotizacion.count({
    where: { cotizacionPadreId: cotizacionOrigen.id },
  });
  return `${cotizacionOrigen.folio}-R${hermanos + 1}`;
}

export { generarFolio, generarFolioDuplicado };
