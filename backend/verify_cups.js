const prisma = require('db/prisma');

async function checkCups() {
  const codesToCheck = ['903101', '903201', '430101']; // Algunos ejemplos del usuario
  
  console.log('Checking specific CUPS codes...');
  
  for (const code of codesToCheck) {
    const cup = await prisma.catalogoCups.findUnique({
      where: { codigo: code }
    });
    
    if (cup) {
      console.log(`[FOUND] ${code}: ${cup.descripcion}`);
    } else {
      console.log(`[MISSING] ${code}`);
    }
  }

  // Count total
  const count = await prisma.catalogoCups.count();
  console.log(`Total CUPS in DB: ${count}`);
}

checkCups()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
