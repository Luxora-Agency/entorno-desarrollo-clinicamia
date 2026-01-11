/**
 * Exportador RIPS (Resolución 2275 de 2023)
 * Genera archivos JSON para el Registro Individual de Prestación de Servicios de Salud
 */
const prisma = require('../../db/prisma');
const { NotFoundError } = require('../../utils/errors');

class ExportadorRIPSService {
  constructor() {
    this.codigoHabilitacion = process.env.CODIGO_HABILITACION || '000000000000';
    this.nombreIPS = process.env.NOMBRE_IPS || 'CLINICA MIA';
    this.nitIPS = process.env.NIT_IPS || '000000000';
  }

  /**
   * Generar RIPS JSON para un conjunto de facturas
   * @param {string[]} facturaIds - Array de IDs de facturas
   */
  async generarRIPS(facturaIds) {
    if (!facturaIds || facturaIds.length === 0) {
      throw new Error('Debe proporcionar al menos una factura para generar RIPS');
    }

    // 1. Obtener datos completos de las facturas
    const facturas = await prisma.factura.findMany({
      where: { id: { in: facturaIds } },
      include: {
        paciente: true,
        items: {
          include: {
            cita: {
              include: {
                especialidad: true,
                doctor: true,
                diagnosticosHCE: { take: 1 } // Intentar obtener diagnóstico asociado
              }
            },
            ordenMedica: {
              include: {
                examenProcedimiento: true,
                doctor: true
              }
            },
            ordenMedicamento: {
              include: {
                items: { include: { producto: true } },
                doctor: true
              }
            },
            admision: {
              include: {
                unidad: true,
                egreso: true
              }
            }
          }
        }
      }
    });

    if (!facturas || facturas.length === 0) {
      throw new NotFoundError('No se encontraron las facturas solicitadas');
    }

    // 2. Construir estructuras de datos RIPS
    const usuarios = new Map(); // Para evitar duplicados (US)
    const consultas = []; // AC
    const procedimientos = []; // AP
    const urgencias = []; // AU
    const hospitalizacion = []; // AH
    const recienNacidos = []; // AN
    const medicamentos = []; // AM
    const otrosServicios = []; // AT

    // 3. Procesar cada factura
    for (const factura of facturas) {
      // 3.1 Procesar Usuario (Paciente)
      if (!usuarios.has(factura.paciente.id)) {
        usuarios.set(factura.paciente.id, this._mapUsuario(factura.paciente));
      }

      // 3.2 Procesar Items de la factura
      for (const item of factura.items) {
        // Consultas (AC)
        if (item.tipo === 'Consulta' && item.cita) {
          consultas.push(this._mapConsulta(item, factura));
        }
        
        // Procedimientos (AP)
        else if (item.tipo === 'OrdenMedica' && item.ordenMedica) {
          procedimientos.push(this._mapProcedimiento(item, factura));
        }
        
        // Medicamentos (AM)
        else if (item.tipo === 'OrdenMedicamento' && item.ordenMedicamento) {
          const meds = this._mapMedicamentos(item, factura);
          medicamentos.push(...meds);
        }

        // Hospitalización (AH)
        else if (item.tipo === 'Hospitalizacion' && item.admision) {
          hospitalizacion.push(this._mapHospitalizacion(item, factura));
        }
        
        // Otros Servicios (AT) - Si no cae en los anteriores
        else if (item.tipo === 'Otro') {
          otrosServicios.push(this._mapOtroServicio(item, factura));
        }
      }
      
      // Urgencias (AU) - Buscar si hay atenciones de urgencia vinculadas al paciente en fechas cercanas
      // Nota: Esto requeriría lógica adicional si la factura agrupa urgencias
    }

    // 4. Construir objeto final JSON (Estructura Res. 2275)
    const ripsData = {
      "numDocumentoIdObligado": this.nitIPS,
      "numFactura": facturas[0].numero, // Nota: Res 2275 suele ser por factura electrónica. Aquí asumimos agrupación o individual.
      "tipoNota": null,
      "numNota": null,
      "usuarios": Array.from(usuarios.values()),
      "servicios": {
        "consultas": consultas.length > 0 ? consultas : undefined,
        "procedimientos": procedimientos.length > 0 ? procedimientos : undefined,
        "urgencias": urgencias.length > 0 ? urgencias : undefined,
        "hospitalizacion": hospitalizacion.length > 0 ? hospitalizacion : undefined,
        "recienNacidos": recienNacidos.length > 0 ? recienNacidos : undefined,
        "medicamentos": medicamentos.length > 0 ? medicamentos : undefined,
        "otrosServicios": otrosServicios.length > 0 ? otrosServicios : undefined
      }
    };

    return ripsData;
  }

  // --- Mappers Auxiliares (Simplificados para demostración) ---

  _mapUsuario(paciente) {
    return {
      "tipoDocumentoIdentificacion": this._mapTipoDocumento(paciente.tipoDocumento),
      "numDocumentoIdentificacion": paciente.cedula,
      "tipoUsuario": this._mapTipoUsuario(paciente.tipoUsuario),
      "fechaNacimiento": paciente.fechaNacimiento ? paciente.fechaNacimiento.toISOString().split('T')[0] : "2000-01-01",
      "codSexo": paciente.genero === 'Masculino' ? 'M' : paciente.genero === 'Femenino' ? 'F' : 'I',
      "codPaisResidencia": "170", // Colombia
      "codMunicipioResidencia": "11001", // Bogotá (Default, debería venir de paciente)
      "codZonaTerritorialResidencia": "01", // Urbana
      "incapacidad": "NO",
      "codPaisOrigen": "170"
    };
  }

  _mapConsulta(item, factura) {
    // Diagnóstico default si no hay
    const dxPrincipal = "Z000"; 
    
    return {
      "codPrestador": this.codigoHabilitacion,
      "fechaInicioAtencion": item.cita.fecha ? item.cita.fecha.toISOString().split('T')[0] + ' ' + (item.cita.hora ? item.cita.hora.toISOString().split('T')[1].substring(0,5) : '00:00') : new Date().toISOString(),
      "numAutorizacion": factura.epsAutorizacion || null,
      "codConsulta": "890201", // Código CUPS genérico consulta, debería venir de especialidad o servicio
      "modalidadGrupoServicioTecSal": "01", // Intramural
      "grupoServicios": "01", // Consulta Externa
      "codServicio": "366", // Medicina General (Ejemplo)
      "finalidadTecnologiaSalud": "44", // Alteración joven (Ejemplo)
      "causaMotivoAtencion": "38", // Enfermedad general
      "codDiagnosticoPrincipal": dxPrincipal,
      "codDiagnosticoRelacionado1": null,
      "codDiagnosticoRelacionado2": null,
      "codDiagnosticoRelacionado3": null,
      "tipoDiagnosticoPrincipal": "01", // Impresión diagnóstica
      "tipoDocumentoIdentificacion": this._mapTipoDocumento(factura.paciente.tipoDocumento),
      "numDocumentoIdentificacion": factura.paciente.cedula,
      "vrServicio": parseFloat(item.subtotal),
      "tipoPagoModerador": "05", // Cuota moderadora
      "vrPagoModerador": 0,
      "numFEVPagoModerador": null,
      "consecutivo": 1
    };
  }

  _mapProcedimiento(item, factura) {
    return {
      "codPrestador": this.codigoHabilitacion,
      "fechaInicioAtencion": item.createdAt.toISOString(),
      "idMIPRES": null,
      "numAutorizacion": factura.epsAutorizacion || null,
      "codProcedimiento": item.ordenMedica.examenProcedimiento.codigoCUPS || "902210", // Default Hemograma
      "viaIngresoServicioSalud": "01", // Ambulatorio
      "modalidadGrupoServicioTecSal": "01",
      "grupoServicios": "02", // Apoyo diagnóstico
      "codServicio": "714", // Laboratorio clínico
      "finalidadTecnologiaSalud": "01", // Diagnóstico
      "tipoDocumentoIdentificacion": this._mapTipoDocumento(factura.paciente.tipoDocumento),
      "numDocumentoIdentificacion": factura.paciente.cedula,
      "codDiagnosticoPrincipal": "Z000",
      "codDiagnosticoRelacionado": null,
      "codComplicacion": null,
      "vrServicio": parseFloat(item.subtotal),
      "tipoPagoModerador": null,
      "vrPagoModerador": 0,
      "numFEVPagoModerador": null,
      "consecutivo": 1
    };
  }

  _mapMedicamentos(item, factura) {
    const resultados = [];
    let consecutivo = 1;
    
    for (const medItem of item.ordenMedicamento.items) {
        resultados.push({
            "codPrestador": this.codigoHabilitacion,
            "numAutorizacion": factura.epsAutorizacion || null,
            "idMIPRES": null,
            "fechaDispensAdmon": item.createdAt.toISOString(),
            "codDiagnosticoPrincipal": "Z000",
            "codDiagnosticoRelacionado": null,
            "tipoMedicamento": "01", // POS
            "codTecnologiaSalud": medItem.producto.sku || "UNKNOWN", // Debería ser CUM
            "nomTecnologiaSalud": medItem.producto.nombre,
            "concentracionMedicamento": 0,
            "unidadMedida": "39", // Miligramo
            "formaFarmaceutica": "01", // Sólido
            "unidadMinDispensa": "01", // Tableta
            "cantidadMedicamento": medItem.cantidad,
            "diasTratamiento": 1,
            "tipoDocumentoIdentificacion": this._mapTipoDocumento(factura.paciente.tipoDocumento),
            "numDocumentoIdentificacion": factura.paciente.cedula,
            "vrUnitMedicamento": parseFloat(medItem.precioUnitario),
            "vrServicio": parseFloat(medItem.subtotal),
            "tipoPagoModerador": null,
            "vrPagoModerador": 0,
            "numFEVPagoModerador": null,
            "consecutivo": consecutivo++
        });
    }
    return resultados;
  }

  _mapHospitalizacion(item, factura) {
    return {
        "codPrestador": this.codigoHabilitacion,
        "viaIngresoServicioSalud": "02", // Urgencias
        "fechaInicioAtencion": item.admision.fechaIngreso.toISOString(),
        "numAutorizacion": factura.epsAutorizacion || null,
        "causaMotivoAtencion": "38", // Enfermedad General
        "codDiagnosticoPrincipal": "Z000", // Debería venir de admision.diagnosticoIngreso
        "codDiagnosticoPrincipalE": "Z000", // Debería venir de admision.diagnosticoEgreso
        "codDiagnosticoRelacionadoE1": null,
        "codDiagnosticoRelacionadoE2": null,
        "codDiagnosticoRelacionadoE3": null,
        "codComplicacion": null,
        "condicionDestinoUsuarioEgreso": "01", // Alta
        "codDiagnosticoCausaMuerte": null,
        "fechaEgreso": item.admision.fechaEgreso ? item.admision.fechaEgreso.toISOString() : new Date().toISOString(),
        "consecutivo": 1
    };
  }
  
  _mapOtroServicio(item, factura) {
    return {
        "codPrestador": this.codigoHabilitacion,
        "numAutorizacion": factura.epsAutorizacion || null,
        "idMIPRES": null,
        "fechaSuministroTecnologia": item.createdAt.toISOString(),
        "tipoOS": "01", // Materiales e insumos
        "codTecnologiaSalud": "GENERICO",
        "nomTecnologiaSalud": item.descripcion,
        "cantidadOS": item.cantidad,
        "tipoDocumentoIdentificacion": this._mapTipoDocumento(factura.paciente.tipoDocumento),
        "numDocumentoIdentificacion": factura.paciente.cedula,
        "vrUnitOS": parseFloat(item.precioUnitario),
        "vrServicio": parseFloat(item.subtotal),
        "tipoPagoModerador": null,
        "vrPagoModerador": 0,
        "numFEVPagoModerador": null,
        "consecutivo": 1
    };
  }

  // --- Helpers ---

  _mapTipoDocumento(tipo) {
    const map = {
      'Cédula de Ciudadanía': 'CC',
      'Tarjeta de Identidad': 'TI',
      'Cédula de Extranjería': 'CE',
      'Pasaporte': 'PA',
      'Registro Civil': 'RC',
      'Permiso Especial de Permanencia': 'PE',
    };
    return map[tipo] || 'CC';
  }

  _mapTipoUsuario(tipo) {
    const map = {
      'Contributivo': '01',
      'Subsidiado': '02',
      'Vinculado': '03',
      'Particular': '04',
      'Otro': '05',
    };
    return map[tipo] || '01'; // Default Contributivo
  }
}

module.exports = new ExportadorRIPSService();
