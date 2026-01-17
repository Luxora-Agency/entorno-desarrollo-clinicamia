/**
 * Script para actualizar productos existentes con datos de INVIMA
 * Fuente: https://www.datos.gov.co/resource/i7cb-raxc.json (CUM INVIMA)
 *
 * Este script:
 * 1. Lee todos los productos de la BD que no tienen registro sanitario
 * 2. Busca en la API de datos.gov.co por principio activo o nombre
 * 3. Actualiza el producto con los datos encontrados
 */
const prisma = require('../db/prisma');

const API_URL = 'https://www.datos.gov.co/resource/i7cb-raxc.json';

// Función para hacer delay entre peticiones (evitar rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para normalizar texto (quitar acentos y caracteres especiales)
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Función para buscar en la API de datos.gov.co
async function buscarEnINVIMA(searchTerm) {
  try {
    const normalized = normalizeText(searchTerm);
    if (!normalized || normalized.length < 3) return null;

    // Buscar por principio activo
    const url = `${API_URL}?$where=lower(principioactivo) like '%25${encodeURIComponent(normalized)}%25'&$limit=5&estadocum=Activo`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`Error buscando ${searchTerm}:`, error.message);
    return null;
  }
}

// Función para extraer principio activo del nombre del producto
function extraerPrincipioActivo(nombre) {
  if (!nombre) return null;

  // Remover concentraciones y presentaciones comunes
  let limpio = nombre
    .replace(/\d+\s*(mg|g|ml|mcg|ui|%|mg\/ml|g\/ml)/gi, '')
    .replace(/\s*(tabletas?|capsulas?|comprimidos?|ampollas?|viales?|gotas|jarabe|suspension|solucion|inyectable|crema|gel|pomada|parches?|sobres?)/gi, '')
    .replace(/\s*(oral|iv|im|sc|topico|nasal|oftalmic[oa])/gi, '')
    .replace(/\s*(x\s*\d+|\d+\s*x)/gi, '')
    .replace(/\s*\+\s*/g, ' ')
    .trim();

  // Tomar la primera palabra significativa (generalmente el principio activo)
  const palabras = limpio.split(/\s+/);
  return palabras[0] || nombre;
}

// Mapeo de formas farmacéuticas a valores estándar
function mapearFormaFarmaceutica(forma) {
  if (!forma) return null;
  const formaLower = forma.toLowerCase();

  if (formaLower.includes('tableta') || formaLower.includes('comprimido')) {
    if (formaLower.includes('recubierta') || formaLower.includes('pelicula')) return 'TABLETA RECUBIERTA';
    if (formaLower.includes('efervescente')) return 'TABLETA EFERVESCENTE';
    if (formaLower.includes('masticable')) return 'TABLETA MASTICABLE';
    if (formaLower.includes('prolongada') || formaLower.includes('liberacion')) return 'TABLETA DE LIBERACION PROLONGADA';
    return 'TABLETA';
  }
  if (formaLower.includes('capsula')) {
    if (formaLower.includes('blanda')) return 'CAPSULA BLANDA';
    return 'CAPSULA DURA';
  }
  if (formaLower.includes('inyectable') || formaLower.includes('inyeccion')) {
    if (formaLower.includes('polvo') || formaLower.includes('liofilizado')) return 'POLVO PARA RECONSTITUIR A SOLUCION INYECTABLE';
    return 'SOLUCION INYECTABLE';
  }
  if (formaLower.includes('jarabe') || formaLower.includes('suspension oral')) return 'SUSPENSION ORAL';
  if (formaLower.includes('gotas')) return 'SOLUCION ORAL EN GOTAS';
  if (formaLower.includes('crema')) return 'CREMA';
  if (formaLower.includes('gel')) return 'GEL';
  if (formaLower.includes('pomada') || formaLower.includes('unguento')) return 'POMADA';
  if (formaLower.includes('aerosol') || formaLower.includes('inhalador')) return 'AEROSOL PARA INHALACION';
  if (formaLower.includes('solucion') && formaLower.includes('infusion')) return 'SOLUCION PARA INFUSION';
  if (formaLower.includes('parche')) return 'PARCHE TRANSDERMICO';
  if (formaLower.includes('supositorio')) return 'SUPOSITORIO';
  if (formaLower.includes('ovulo')) return 'OVULO VAGINAL';

  return forma.toUpperCase();
}

// Función principal
async function actualizarProductos() {
  console.log('='.repeat(60));
  console.log('ACTUALIZADOR DE PRODUCTOS CON DATOS INVIMA');
  console.log('Fuente: datos.gov.co - CUM INVIMA Colombia');
  console.log('='.repeat(60));

  try {
    // Obtener productos sin registro sanitario
    const productosSinDatos = await prisma.producto.findMany({
      where: {
        OR: [
          { registroSanitario: null },
          { registroSanitario: '' }
        ]
      },
      select: {
        id: true,
        nombre: true,
        principioActivo: true,
        concentracion: true,
        formaFarmaceutica: true
      },
      take: 500 // Procesar en lotes de 500
    });

    console.log(`\nProductos sin datos INVIMA: ${productosSinDatos.length}`);
    console.log('Iniciando actualización...\n');

    let actualizados = 0;
    let noEncontrados = 0;
    let errores = 0;

    for (let i = 0; i < productosSinDatos.length; i++) {
      const producto = productosSinDatos[i];

      // Determinar término de búsqueda
      const termino = producto.principioActivo || extraerPrincipioActivo(producto.nombre);

      if (!termino || termino.length < 3) {
        noEncontrados++;
        continue;
      }

      // Mostrar progreso cada 50 productos
      if (i % 50 === 0) {
        console.log(`Progreso: ${i}/${productosSinDatos.length} (${Math.round(i/productosSinDatos.length*100)}%)`);
      }

      try {
        // Buscar en INVIMA
        const datosINVIMA = await buscarEnINVIMA(termino);

        if (datosINVIMA) {
          // Preparar datos para actualizar
          const updateData = {};

          if (datosINVIMA.registrosanitario) updateData.registroSanitario = datosINVIMA.registrosanitario;
          if (datosINVIMA.expedientecum) updateData.cum = datosINVIMA.expedientecum;
          if (datosINVIMA.titular) updateData.laboratorio = datosINVIMA.titular;
          if (datosINVIMA.atc) updateData.codigoAtc = datosINVIMA.atc;
          if (datosINVIMA.principioactivo && !producto.principioActivo) {
            updateData.principioActivo = datosINVIMA.principioactivo.toUpperCase();
          }
          if (datosINVIMA.concentracion && !producto.concentracion) {
            const conc = datosINVIMA.concentracion;
            const unidad = datosINVIMA.unidadmedida || '';
            updateData.concentracion = `${conc} ${unidad}`.trim();
          }
          if (datosINVIMA.formafarmaceutica && !producto.formaFarmaceutica) {
            updateData.formaFarmaceutica = mapearFormaFarmaceutica(datosINVIMA.formafarmaceutica);
          }
          if (datosINVIMA.viaadministracion) {
            updateData.viaAdministracion = datosINVIMA.viaadministracion.toUpperCase();
          }
          if (datosINVIMA.descripcioncomercial) {
            updateData.presentacion = datosINVIMA.descripcioncomercial;
          }

          // Solo actualizar si hay datos nuevos
          if (Object.keys(updateData).length > 0) {
            await prisma.producto.update({
              where: { id: producto.id },
              data: updateData
            });
            actualizados++;

            if (actualizados <= 10 || actualizados % 100 === 0) {
              console.log(`  ✓ ${producto.nombre} -> ${updateData.registroSanitario || 'actualizado'}`);
            }
          } else {
            noEncontrados++;
          }
        } else {
          noEncontrados++;
        }

        // Delay para evitar rate limiting (100ms entre peticiones)
        await delay(100);

      } catch (err) {
        errores++;
        if (errores <= 5) {
          console.error(`  ✗ Error con ${producto.nombre}:`, err.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN DE ACTUALIZACIÓN');
    console.log('='.repeat(60));
    console.log(`Productos procesados: ${productosSinDatos.length}`);
    console.log(`Actualizados con éxito: ${actualizados}`);
    console.log(`No encontrados en INVIMA: ${noEncontrados}`);
    console.log(`Errores: ${errores}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
actualizarProductos();
