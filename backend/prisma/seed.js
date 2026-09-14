const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos iniciales (Seed)...');

  // 1. Create Default Users (one for each role)
  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@sanboni.edu.co';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'Admin123!';
  const passwordHashSuperAdmin = await bcrypt.hash(superadminPassword, 10);
  const passwordHashAdmin = await bcrypt.hash('Admin123!', 10);
  const passwordHashDocente = await bcrypt.hash('Docente123!', 10);
  const passwordHashEstudiante = await bcrypt.hash('Estudiante123!', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {},
    create: {
      email: superadminEmail,
      passwordHash: passwordHashSuperAdmin,
      firstName: 'Super',
      lastName: 'Administrador',
      role: 'SUPERADMIN',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sanboni.edu.co' },
    update: {},
    create: {
      email: 'admin@sanboni.edu.co',
      passwordHash: passwordHashAdmin,
      firstName: 'Coordinador',
      lastName: 'TIC',
      role: 'ADMIN',
    },
  });

  const docente = await prisma.user.upsert({
    where: { email: 'docente@sanboni.edu.co' },
    update: {},
    create: {
      email: 'docente@sanboni.edu.co',
      passwordHash: passwordHashDocente,
      firstName: 'Carlos',
      lastName: 'Mendoza (Docente)',
      role: 'DOCENTE',
    },
  });

  const estudiante = await prisma.user.upsert({
    where: { email: 'estudiante@sanboni.edu.co' },
    update: {},
    create: {
      email: 'estudiante@sanboni.edu.co',
      passwordHash: passwordHashEstudiante,
      firstName: 'Valentina',
      lastName: 'Gómez (Estudiante)',
      role: 'ESTUDIANTE',
    },
  });

  console.log('✅ Usuarios creados:');
  console.log(`   - Superadmin: ${superadminEmail} / ${superadminPassword}`);
  console.log(`   - Admin: admin@sanboni.edu.co / Admin123!`);
  console.log(`   - Docente: docente@sanboni.edu.co / Docente123!`);
  console.log(`   - Estudiante: estudiante@sanboni.edu.co / Estudiante123!`);

  // 2. Create Chromebook Carts
  const cart1 = await prisma.cart.create({
    data: {
      name: 'Carro 1 - Bloque A',
      description: 'Carro principal del bloque académico A',
      totalChromebooks: 30,
      location: 'Bloque A - Piso 1',
    },
  });

  const cart2 = await prisma.cart.create({
    data: {
      name: 'Carro 2 - Bloque B',
      description: 'Carro del bloque B, laboratorio de informática',
      totalChromebooks: 25,
      location: 'Bloque B - Piso 2',
    },
  });

  const cart3 = await prisma.cart.create({
    data: {
      name: 'Carro 3 - Biblioteca',
      description: 'Carro de la biblioteca central',
      totalChromebooks: 20,
      location: 'Biblioteca Central',
    },
  });

  console.log('✅ Carros de Chromebooks creados:');
  console.log(`   - ${cart1.name} (${cart1.totalChromebooks} equipos)`);
  console.log(`   - ${cart2.name} (${cart2.totalChromebooks} equipos)`);
  console.log(`   - ${cart3.name} (${cart3.totalChromebooks} equipos)`);

  // 3. Create the 4 Academic Cycles (grade-level groups, NOT time periods)
  const currentYear = 2026;

  const cycleExploratorio = await prisma.cycle.create({
    data: {
      name: `Ciclo Exploratorio ${currentYear}`,
      type: 'EXPLORATORIO',
      gradeRange: 'Transición a 2°',
      description: 'Ciclo para los grados iniciales de formación básica',
      year: currentYear,
      totalChromebooks: 30,
      active: true,
    },
  });

  const cycleConceptual = await prisma.cycle.create({
    data: {
      name: `Ciclo Conceptual ${currentYear}`,
      type: 'CONCEPTUAL',
      gradeRange: '3° a 5°',
      description: 'Ciclo para los grados de primaria superior',
      year: currentYear,
      totalChromebooks: 25,
      active: false,
    },
  });

  const cycleContextual = await prisma.cycle.create({
    data: {
      name: `Ciclo Contextual ${currentYear}`,
      type: 'CONTEXTUAL',
      gradeRange: '6° a 8°',
      description: 'Ciclo para los grados de secundaria básica',
      year: currentYear,
      totalChromebooks: 20,
      active: false,
    },
  });

  const cycleProyectivo = await prisma.cycle.create({
    data: {
      name: `Ciclo Proyectivo ${currentYear}`,
      type: 'PROYECTIVO',
      gradeRange: '9° a 11°',
      description: 'Ciclo para los grados de media vocacional',
      year: currentYear,
      totalChromebooks: 0,
      active: false,
    },
  });

  // 4. Assign carts to the active cycle (Exploratorio)
  await prisma.cartCycle.create({
    data: {
      cartId: cart1.id,
      cycleId: cycleExploratorio.id,
      allocatedQuantity: 15,
    },
  });

  await prisma.cartCycle.create({
    data: {
      cartId: cart2.id,
      cycleId: cycleExploratorio.id,
      allocatedQuantity: 10,
    },
  });

  await prisma.cartCycle.create({
    data: {
      cartId: cart3.id,
      cycleId: cycleExploratorio.id,
      allocatedQuantity: 5,
    },
  });

  console.log('✅ Ciclos académicos creados (por rango de grados):');
  console.log(`   - Exploratorio: ${cycleExploratorio.gradeRange} — 30 Chromebooks (ACTIVO)`);
  console.log(`   - Conceptual: ${cycleConceptual.gradeRange} — 25 Chromebooks`);
  console.log(`   - Contextual: ${cycleContextual.gradeRange} — 20 Chromebooks`);
  console.log(`   - Proyectivo: ${cycleProyectivo.gradeRange} — sin asignar`);

  console.log('✅ Carros asignados al ciclo Exploratorio activo');
  console.log('✨ Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
