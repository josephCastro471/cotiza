import 'dotenv/config.js';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/config/db.js';
import { hashPassword } from '../src/utils/password.js';

const ROLES = ['ADMIN', 'GERENTE', 'VENDEDOR', 'CLIENTE'];

async function limpiar() {
  await prisma.$transaction([
    prisma.cotizacionEvento.deleteMany(),
    prisma.cotizacionLinea.deleteMany(),
    prisma.cotizacion.deleteMany(),
    prisma.catalogoItem.deleteMany(),
    prisma.usuario.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.empresa.deleteMany(),
  ]);
}

async function crearEmpresaConDatos({ nombre, ruc, prefijoFolio, clientesSeed, catalogoSeed }) {
  const empresa = await prisma.empresa.create({
    data: { nombre, ruc, prefijoFolio, ivaPct: 15, siguienteFolio: 1 },
  });

  const clientes = [];
  for (const c of clientesSeed) {
    clientes.push(await prisma.cliente.create({ data: { ...c, empresaId: empresa.id } }));
  }

  const catalogo = [];
  for (const item of catalogoSeed) {
    catalogo.push(await prisma.catalogoItem.create({ data: { ...item, empresaId: empresa.id } }));
  }

  const passwordHash = await hashPassword('demo1234');
  const usuarios = {};
  for (const rol of ROLES) {
    const esCliente = rol === 'CLIENTE';
    usuarios[rol] = await prisma.usuario.create({
      data: {
        empresaId: empresa.id,
        nombre: `${rol.charAt(0)}${rol.slice(1).toLowerCase()} Demo ${prefijoFolio}`,
        email: `${rol.toLowerCase()}.${prefijoFolio.toLowerCase().replace('cot-', '')}@cotiza.demo`,
        passwordHash,
        rol,
        clienteId: esCliente ? clientes[0].id : null,
      },
    });
  }

  return { empresa, clientes, catalogo, usuarios };
}

function fechaHaceDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}

async function crearCotizacion({ empresa, cliente, vendedor, estado, diasAtras, montoAprox }) {
  const cantidad = Math.max(1, Math.round(montoAprox / 150));
  const precioUnitario = Math.round((montoAprox / cantidad) * 100) / 100;
  const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
  const iva = Math.round(subtotal * 0.15 * 100) / 100;
  const total = Math.round((subtotal + iva) * 100) / 100;

  const empresaActualizada = await prisma.empresa.update({
    where: { id: empresa.id },
    data: { siguienteFolio: { increment: 1 } },
  });
  const folio = `${empresa.prefijoFolio}-${String(empresaActualizada.siguienteFolio - 1).padStart(4, '0')}`;

  const emision = fechaHaceDias(diasAtras);
  const validez = new Date(emision);
  validez.setDate(validez.getDate() + 15);

  const cotizacion = await prisma.cotizacion.create({
    data: {
      empresaId: empresa.id,
      folio,
      clienteId: cliente.id,
      vendedorId: vendedor.id,
      estado,
      subtotal,
      iva,
      total,
      fechaEmision: emision,
      fechaValidez: validez,
      lineas: {
        create: [
          { descripcion: 'Ítem de catálogo', cantidad, precioUnitario, descuentoPct: 0, subtotal, orden: 1 },
        ],
      },
    },
  });

  const eventos = [{ tipo: 'CREADA', actorId: vendedor.id, createdAt: emision }];
  if (['ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO'].includes(estado)) {
    eventos.push({ tipo: 'ENVIADA', actorId: vendedor.id, createdAt: fechaHaceDias(diasAtras - 1) });
  }
  if (estado === 'APROBADO') eventos.push({ tipo: 'APROBADA', actorId: vendedor.id, createdAt: fechaHaceDias(Math.max(0, diasAtras - 2)) });
  if (estado === 'RECHAZADO') eventos.push({ tipo: 'RECHAZADA', actorId: vendedor.id, createdAt: fechaHaceDias(Math.max(0, diasAtras - 2)) });
  if (estado === 'VENCIDO') eventos.push({ tipo: 'VENCIDA', actorId: vendedor.id, createdAt: fechaHaceDias(1) });

  for (const evento of eventos) {
    await prisma.cotizacionEvento.create({ data: { cotizacionId: cotizacion.id, ...evento } });
  }

  return cotizacion;
}

async function seed() {
  await limpiar();

  const empresaA = await crearEmpresaConDatos({
    nombre: 'Constructora Andes Cía. Ltda.',
    ruc: '0992847561001',
    prefijoFolio: 'COT-A',
    clientesSeed: [
      { nombre: 'Hormigones del Litoral', ruc: '0991234567001', email: 'contacto@hormigoneslitoral.ec' },
      { nombre: 'Aceros Pacífico S.A.', ruc: '0997654321001', email: 'ventas@acerospacifico.ec' },
      { nombre: 'Municipio de Daule', ruc: '1760001570001', email: 'compras@daule.gob.ec' },
      { nombre: 'Ferretería Vinces', ruc: '1204567890001', email: 'info@ferreteriavinces.ec' },
      { nombre: 'Agrícola Babahoyo', ruc: '1204455667001', email: 'admin@agricolababahoyo.ec' },
      { nombre: 'Transportes Quevedo', ruc: '1205566778001', email: 'logistica@transportesquevedo.ec' },
    ],
    catalogoSeed: [
      { nombre: 'Cemento Portland (saco 50kg)', tipo: 'PRODUCTO', precioUnitario: 8.5 },
      { nombre: 'Varilla de acero 12mm (6m)', tipo: 'PRODUCTO', precioUnitario: 14.2 },
      { nombre: 'Bloque de hormigón 15cm', tipo: 'PRODUCTO', precioUnitario: 0.65 },
      { nombre: 'Diseño estructural', tipo: 'SERVICIO', precioUnitario: 850 },
      { nombre: 'Supervisión de obra (mes)', tipo: 'SERVICIO', precioUnitario: 1200 },
      { nombre: 'Transporte de materiales', tipo: 'SERVICIO', precioUnitario: 180 },
      { nombre: 'Excavadora (día)', tipo: 'SERVICIO', precioUnitario: 320 },
      { nombre: 'Tubería PVC 4" (6m)', tipo: 'PRODUCTO', precioUnitario: 22.4 },
      { nombre: 'Pintura exterior (galón)', tipo: 'PRODUCTO', precioUnitario: 28.9 },
    ],
  });

  const empresaB = await crearEmpresaConDatos({
    nombre: 'Consultora Delta TI',
    ruc: '0991122334001',
    prefijoFolio: 'COT-B',
    clientesSeed: [
      { nombre: 'Banco del Pacífico', ruc: '0990123456001', email: 'ti@bancopacifico.ec' },
      { nombre: 'Plásticos Milagro', ruc: '1204433221001', email: 'sistemas@plasticosmilagro.ec' },
      { nombre: 'Corporación Favorita', ruc: '1790012345001', email: 'proyectos@favorita.ec' },
      { nombre: 'Universidad de Guayaquil', ruc: '0968765432001', email: 'ti@ug.edu.ec' },
      { nombre: 'Seguros Equinoccial', ruc: '1790098765001', email: 'compras@equinoccial.ec' },
      { nombre: 'Farmacias Cruz Azul', ruc: '1204987654001', email: 'sistemas@cruzazul.ec' },
    ],
    catalogoSeed: [
      { nombre: 'Desarrollo de módulo a medida', tipo: 'SERVICIO', precioUnitario: 2400 },
      { nombre: 'Licencia anual de software', tipo: 'PRODUCTO', precioUnitario: 960 },
      { nombre: 'Migración de base de datos', tipo: 'SERVICIO', precioUnitario: 1500 },
      { nombre: 'Soporte técnico (mes)', tipo: 'SERVICIO', precioUnitario: 450 },
      { nombre: 'Servidor cloud (mes)', tipo: 'PRODUCTO', precioUnitario: 180 },
      { nombre: 'Auditoría de seguridad', tipo: 'SERVICIO', precioUnitario: 2100 },
      { nombre: 'Capacitación de equipo (día)', tipo: 'SERVICIO', precioUnitario: 600 },
      { nombre: 'Licencia de monitoreo', tipo: 'PRODUCTO', precioUnitario: 320 },
      { nombre: 'Integración de API', tipo: 'SERVICIO', precioUnitario: 980 },
    ],
  });

  const distribucion = [
    ...Array(4).fill('BORRADOR'),
    ...Array(4).fill('ENVIADO'), // 3 requeridas "en vivo" + 1 extra de relleno
    ...Array(12).fill('APROBADO'),
    ...Array(2).fill('RECHAZADO'),
    ...Array(2).fill('VENCIDO'),
  ]; // 24 total, coincide con design-system.md §17

  for (const [empresa, usuarios, clientes] of [
    [empresaA.empresa, empresaA.usuarios, empresaA.clientes],
    [empresaB.empresa, empresaB.usuarios, empresaB.clientes],
  ]) {
    for (let i = 0; i < distribucion.length / 2; i += 1) {
      const estado = distribucion[i];
      const cliente = clientes[i % clientes.length];
      const vendedor = usuarios.VENDEDOR;
      const diasAtras = Math.floor(Math.random() * 90) + (estado === 'VENCIDO' ? 30 : 0);
      const montoAprox = 320 + Math.random() * (18400 - 320);
      // eslint-disable-next-line no-await-in-loop
      await crearCotizacion({ empresa, cliente, vendedor, estado, diasAtras, montoAprox });
    }
  }

  console.log('Seed completo: 2 empresas, 8 usuarios, 24 cotizaciones.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seed };
