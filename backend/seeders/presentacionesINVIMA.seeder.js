/**
 * Seeder para crear presentaciones de productos desde INVIMA
 * Cada presentación tiene su propia concentración, stock, precio y alertas
 */
const prisma = require('../db/prisma');

const API_URL = 'https://www.datos.gov.co/resource/i7cb-raxc.json';

// Buscar todas las presentaciones de un producto en INVIMA
async function buscarPresentacionesINVIMA(principioActivo) {
  try {
    const normalized = principioActivo
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[áéíóú]/g, match => ({ 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' }[match] || match));

    // Buscar múltiples resultados
    const url = `${API_URL}?$where=lower(principioactivo) like '%25${encodeURIComponent(normalized)}%25'&$limit=20&estadocum=Activo`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return data || [];
  } catch (error) {
    return [];
  }
}

// Generar SKU único para presentación
function generarSKU(productoSKU, concentracion, index) {
  const concSlug = concentracion
    .replace(/\s+/g, '')
    .replace(/\//g, '-')
    .replace(/\./g, '')
    .toUpperCase()
    .substring(0, 10);
  return `${productoSKU}-${concSlug}-${String(index).padStart(2, '0')}`;
}

// Extraer unidad de medida de la concentración
function extraerUnidad(concentracion) {
  if (!concentracion) return null;
  const c = concentracion.toLowerCase();

  if (c.includes('mg/ml')) return 'mg/ml';
  if (c.includes('g/ml')) return 'g/ml';
  if (c.includes('ui/ml')) return 'UI/ml';
  if (c.includes('mcg/ml')) return 'mcg/ml';
  if (c.includes('%')) return '%';
  if (c.includes('mcg')) return 'mcg';
  if (c.includes('mg')) return 'mg';
  if (c.match(/\d+\s*g\b/i)) return 'g';
  if (c.includes('ml')) return 'ml';
  if (c.includes('ui') || c.includes('u.i')) return 'UI';
  if (c.includes('meq')) return 'mEq';

  return null;
}

// Validar que la concentración sea numérica (no solo letras)
function esConcentracionValida(conc) {
  if (!conc) return false;
  // Debe tener al menos un número
  return /\d/.test(conc);
}

async function crearPresentaciones() {
  console.log('=== CREANDO PRESENTACIONES DESDE INVIMA ===\n');

  // Obtener productos que tienen principioActivo o nombre
  const productos = await prisma.producto.findMany({
    where: {
      activo: true
    },
    select: {
      id: true,
      nombre: true,
      sku: true,
      principioActivo: true,
      formaFarmaceutica: true,
      _count: {
        select: { presentaciones: true }
      }
    },
    orderBy: { nombre: 'asc' }
  });

  console.log('Total productos:', productos.length);

  let productosConPresentaciones = 0;
  let totalPresentaciones = 0;

  // Procesar solo productos que no tienen presentaciones aún
  const productosAProcesar = productos.filter(p => p._count.presentaciones === 0).slice(0, 200);
  console.log('Productos a procesar:', productosAProcesar.length);

  for (let i = 0; i < productosAProcesar.length; i++) {
    const producto = productosAProcesar[i];
    const busqueda = producto.principioActivo || producto.nombre;

    // Ignorar productos que son descripciones de políticas
    if (busqueda.startsWith('SE FINANCIAN')) continue;

    // Buscar en INVIMA
    const resultados = await buscarPresentacionesINVIMA(busqueda);

    if (resultados.length > 0) {
      // Agrupar por concentración única
      const concentracionesUnicas = new Map();

      for (const r of resultados) {
        // Construir concentración desde cantidad + unidadmedida
        const cantidad = r.cantidad;
        const unidad = r.unidadmedida || 'mg';

        if (!cantidad || isNaN(parseFloat(cantidad))) continue;

        // Formatear concentración
        const conc = `${cantidad} ${unidad}`.trim();

        if (!concentracionesUnicas.has(conc)) {
          concentracionesUnicas.set(conc, {
            concentracion: conc,
            formaFarmaceutica: r.formafarmaceutica || producto.formaFarmaceutica,
            cum: r.expedientecum,
            registroSanitario: r.registrosanitario,
            descripcion: r.descripcioncomercial,
            unidadReferencia: r.unidadreferencia
          });
        }
      }

      if (concentracionesUnicas.size > 0) {
        let index = 1;
        for (const [conc, datos] of concentracionesUnicas) {
          try {
            const sku = generarSKU(producto.sku, conc, index);

            await prisma.productoPresentacion.create({
              data: {
                productoId: producto.id,
                nombre: `${conc} ${datos.formaFarmaceutica || ''}`.trim(),
                concentracion: conc,
                unidadMedida: extraerUnidad(conc),
                formaFarmaceutica: datos.formaFarmaceutica,
                sku: sku,
                cum: datos.cum,
                registroSanitario: datos.registroSanitario,
                descripcion: datos.descripcion,
                cantidadTotal: 0,
                cantidadMinimaAlerta: 10,
                precioVenta: 0,
                esPredeterminada: index === 1
              }
            });

            totalPresentaciones++;
            index++;
          } catch (e) {
            // SKU duplicado u otro error, ignorar
          }
        }

        productosConPresentaciones++;

        if (productosConPresentaciones <= 10) {
          console.log(`  ✓ ${producto.nombre}: ${concentracionesUnicas.size} presentaciones`);
          for (const [conc] of concentracionesUnicas) {
            console.log(`      - ${conc}`);
          }
        } else if (productosConPresentaciones % 20 === 0) {
          console.log(`Progreso: ${productosConPresentaciones} productos procesados...`);
        }
      }
    }

    // Pausa para no saturar API
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log('Productos con presentaciones:', productosConPresentaciones);
  console.log('Total presentaciones creadas:', totalPresentaciones);

  // Estadísticas finales
  const stats = await prisma.productoPresentacion.aggregate({
    _count: true
  });
  console.log('\nTotal presentaciones en BD:', stats._count);

  await prisma.$disconnect();
}

crearPresentaciones();
