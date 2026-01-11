
#!/bin/bash

rename_model() {
  lower=$1
  pascal=$2
  # Rename model definition
  sed -i '' "s/^model $lower {/model $pascal {\\n  @@map(\"$lower\")/" prisma/schema.prisma
  # Rename type usage (field Type)
  sed -i '' -E "s/^(\s+\w+\s+)$lower(\[\]|\?)?/\1$pascal\2/g" prisma/schema.prisma
}

rename_model "usuarios" "Usuario"
rename_model "citas" "Cita"
rename_model "pacientes" "Paciente"
rename_model "doctores" "Doctor"
rename_model "especialidades" "Especialidad"
rename_model "departamentos" "Departamento"
rename_model "productos" "Producto"
rename_model "ordenes_medicas" "OrdenMedica"
rename_model "ordenes_medicamentos" "OrdenMedicamento"
rename_model "facturas" "Factura"
rename_model "prescripciones" "Prescripcion"
rename_model "procedimientos" "Procedimiento"
rename_model "signos_vitales" "SignoVital"
rename_model "evoluciones_clinicas" "EvolucionClinica"
rename_model "diagnosticos_hce" "DiagnosticoHCE"
rename_model "admisiones" "Admision"
rename_model "camas" "Cama"
rename_model "habitaciones" "Habitacion"
rename_model "unidades" "Unidad"
rename_model "notas_enfermeria" "NotaEnfermeria"
rename_model "atenciones_urgencias" "AtencionUrgencia"
rename_model "interconsultas" "Interconsulta"
rename_model "administraciones_medicamentos" "AdministracionMedicamento"
rename_model "facturas_items" "FacturaItem"
rename_model "ordenes_medicamentos_items" "OrdenMedicamentoItem"
rename_model "doctores_especialidades" "DoctorEspecialidad"
rename_model "categorias_productos" "CategoriaProducto"
rename_model "etiquetas_productos" "EtiquetaProducto"
rename_model "productos_etiquetas" "ProductoEtiqueta"
rename_model "categorias_examenes" "CategoriaExamen"
rename_model "examenes_procedimientos" "ExamenProcedimiento"
rename_model "documentos_paciente" "DocumentoPaciente"
rename_model "pagos" "Pago"
rename_model "paquetes_hospitalizacion" "PaqueteHospitalizacion"
rename_model "auditoria_hce" "AuditoriaHCE"
rename_model "alertas_clinicas" "AlertaClinica"
rename_model "egresos" "Egreso"
rename_model "asignaciones_enfermeria" "AsignacionEnfermeria"
rename_model "movimientos" "Movimiento"
