'use client';

import { useState, useEffect } from 'react';
import { useCalidad2ConsentimientosHC } from '@/hooks/useCalidad2ConsentimientosHC';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FileSignature, Search, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiGet } from '@/services/api';
import FirmaDigitalPad from './FirmaDigitalPad';

export default function AplicarConsentimientoModal({ onClose }) {
  const { tipos, loadTipos, aplicarConsentimiento } = useCalidad2ConsentimientosHC();
  const [loading, setLoading] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    tipoId: '',
    pacienteId: '',
    medicoId: '',
    lugarAplicacion: '',
    riesgosExplicados: '',
    observaciones: '',
  });

  // Firmas
  const [firmas, setFirmas] = useState({
    firmaPaciente: null,
    firmaTestigo: null,
    firmaFamiliar: null,
    firmaMedico: null,
  });

  // Estado para búsqueda de pacientes y médicos
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [searchMedico, setSearchMedico] = useState('');
  const [openPaciente, setOpenPaciente] = useState(false);
  const [openMedico, setOpenMedico] = useState(false);

  const [errors, setErrors] = useState({});

  // Cargar tipos al montar
  useEffect(() => {
    loadTipos({ estado: 'VIGENTE', limit: 100 });
  }, []);

  // Buscar pacientes
  useEffect(() => {
    if (searchPaciente.length >= 3) {
      buscarPacientes(searchPaciente);
    }
  }, [searchPaciente]);

  // Buscar médicos
  useEffect(() => {
    if (searchMedico.length >= 2) {
      buscarMedicos(searchMedico);
    }
  }, [searchMedico]);

  // Actualizar tipo seleccionado cuando cambia tipoId
  useEffect(() => {
    if (formData.tipoId && tipos.length > 0) {
      const tipo = tipos.find(t => t.id === formData.tipoId);
      setTipoSeleccionado(tipo);
    }
  }, [formData.tipoId, tipos]);

  const buscarPacientes = async (search) => {
    try {
      const response = await apiGet('/pacientes', { search, limit: 20 });
      setPacientes(response.data?.pacientes || response.data || []);
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      setPacientes([]);
    }
  };

  const buscarMedicos = async (search) => {
    try {
      const response = await apiGet('/doctores', { search, limit: 20 });
      setMedicos(response.data?.doctores || response.data || []);
    } catch (error) {
      console.error('Error buscando médicos:', error);
      setMedicos([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handlePacienteSelect = (paciente) => {
    setPacienteSeleccionado(paciente);
    setFormData({ ...formData, pacienteId: paciente.id });
    setOpenPaciente(false);
    if (errors.pacienteId) {
      setErrors({ ...errors, pacienteId: null });
    }
  };

  const handleMedicoSelect = (medico) => {
    setMedicoSeleccionado(medico);
    setFormData({ ...formData, medicoId: medico.id });
    setOpenMedico(false);
    if (errors.medicoId) {
      setErrors({ ...errors, medicoId: null });
    }
  };

  const handleFirmaChange = (tipo, firmaData) => {
    setFirmas({ ...firmas, [tipo]: firmaData });
    if (errors[tipo]) {
      setErrors({ ...errors, [tipo]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.tipoId) {
      newErrors.tipoId = 'Seleccione un tipo de consentimiento';
    }

    if (!formData.pacienteId) {
      newErrors.pacienteId = 'Seleccione un paciente';
    }

    if (!formData.medicoId) {
      newErrors.medicoId = 'Seleccione un médico';
    }

    if (!formData.lugarAplicacion?.trim()) {
      newErrors.lugarAplicacion = 'El lugar de aplicación es requerido';
    }

    // Validar firmas requeridas según el tipo
    if (tipoSeleccionado) {
      if (tipoSeleccionado.requiereFirma && !firmas.firmaPaciente) {
        newErrors.firmaPaciente = 'Se requiere la firma del paciente';
      }
      if (tipoSeleccionado.requiereTestigo && !firmas.firmaTestigo) {
        newErrors.firmaTestigo = 'Se requiere la firma del testigo';
      }
      if (tipoSeleccionado.requiereFamiliar && !firmas.firmaFamiliar) {
        newErrors.firmaFamiliar = 'Se requiere la firma del familiar';
      }
      // Firma del médico siempre requerida
      if (!firmas.firmaMedico) {
        newErrors.firmaMedico = 'Se requiere la firma del médico';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        ...firmas,
        fechaAplicacion: new Date().toISOString(),
      };

      const success = await aplicarConsentimiento(dataToSubmit);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error al aplicar consentimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Aplicar Consentimiento Informado
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de tipo de consentimiento */}
          <div>
            <Label htmlFor="tipoId">
              Tipo de Consentimiento <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.tipoId}
              onValueChange={(value) => handleChange('tipoId', value)}
            >
              <SelectTrigger className={errors.tipoId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccione el tipo de consentimiento" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tipo.nombre}</span>
                      <Badge variant="outline" className="text-xs">
                        {tipo.codigo}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipoId && <p className="text-sm text-red-500 mt-1">{errors.tipoId}</p>}
            {tipoSeleccionado && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Servicio:</strong> {tipoSeleccionado.servicio} |
                  <strong> Procedimiento:</strong> {tipoSeleccionado.procedimiento}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Selección de paciente */}
            <div>
              <Label htmlFor="paciente">
                Paciente <span className="text-red-500">*</span>
              </Label>
              <Popover open={openPaciente} onOpenChange={setOpenPaciente}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={`w-full justify-between ${errors.pacienteId ? 'border-red-500' : ''}`}
                  >
                    {pacienteSeleccionado ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
                      </span>
                    ) : (
                      <span className="text-gray-500">Buscar paciente...</span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar por nombre o documento..."
                      value={searchPaciente}
                      onValueChange={setSearchPaciente}
                    />
                    <CommandEmpty>No se encontraron pacientes</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {pacientes.map((paciente) => (
                        <CommandItem
                          key={paciente.id}
                          value={paciente.id}
                          onSelect={() => handlePacienteSelect(paciente)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {paciente.nombre} {paciente.apellido}
                            </span>
                            <span className="text-xs text-gray-500">
                              Doc: {paciente.documentoIdentidad}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.pacienteId && <p className="text-sm text-red-500 mt-1">{errors.pacienteId}</p>}
            </div>

            {/* Selección de médico */}
            <div>
              <Label htmlFor="medico">
                Médico Responsable <span className="text-red-500">*</span>
              </Label>
              <Popover open={openMedico} onOpenChange={setOpenMedico}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={`w-full justify-between ${errors.medicoId ? 'border-red-500' : ''}`}
                  >
                    {medicoSeleccionado ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
                      </span>
                    ) : (
                      <span className="text-gray-500">Buscar médico...</span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar por nombre..."
                      value={searchMedico}
                      onValueChange={setSearchMedico}
                    />
                    <CommandEmpty>No se encontraron médicos</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {medicos.map((medico) => (
                        <CommandItem
                          key={medico.id}
                          value={medico.id}
                          onSelect={() => handleMedicoSelect(medico)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {medico.nombre} {medico.apellido}
                            </span>
                            <span className="text-xs text-gray-500">
                              {medico.especialidad || 'Sin especialidad'}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.medicoId && <p className="text-sm text-red-500 mt-1">{errors.medicoId}</p>}
            </div>
          </div>

          {/* Lugar de aplicación */}
          <div>
            <Label htmlFor="lugarAplicacion">
              Lugar de Aplicación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lugarAplicacion"
              value={formData.lugarAplicacion}
              onChange={(e) => handleChange('lugarAplicacion', e.target.value)}
              placeholder="Ej: Consultorio 201 - Cirugía"
              className={errors.lugarAplicacion ? 'border-red-500' : ''}
            />
            {errors.lugarAplicacion && (
              <p className="text-sm text-red-500 mt-1">{errors.lugarAplicacion}</p>
            )}
          </div>

          {/* Riesgos explicados */}
          <div>
            <Label htmlFor="riesgosExplicados">Riesgos Explicados al Paciente</Label>
            <Textarea
              id="riesgosExplicados"
              value={formData.riesgosExplicados}
              onChange={(e) => handleChange('riesgosExplicados', e.target.value)}
              placeholder="Describa los riesgos que fueron explicados al paciente..."
              rows={3}
            />
          </div>

          {/* Observaciones */}
          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={2}
            />
          </div>

          {/* Sección de firmas */}
          {tipoSeleccionado && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Firmas Digitales
              </h3>

              <div className="space-y-4">
                {/* Firma del paciente */}
                {tipoSeleccionado.requiereFirma && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>
                        Firma del Paciente <span className="text-red-500">*</span>
                      </Label>
                      {firmas.firmaPaciente && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Firmado
                        </Badge>
                      )}
                    </div>
                    <FirmaDigitalPad
                      onSave={(firma) => handleFirmaChange('firmaPaciente', firma)}
                      label="Paciente"
                    />
                    {errors.firmaPaciente && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.firmaPaciente}
                      </p>
                    )}
                  </div>
                )}

                {/* Firma del testigo */}
                {tipoSeleccionado.requiereTestigo && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>
                        Firma del Testigo <span className="text-red-500">*</span>
                      </Label>
                      {firmas.firmaTestigo && (
                        <Badge variant="default" className="bg-blue-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Firmado
                        </Badge>
                      )}
                    </div>
                    <FirmaDigitalPad
                      onSave={(firma) => handleFirmaChange('firmaTestigo', firma)}
                      label="Testigo"
                    />
                    {errors.firmaTestigo && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.firmaTestigo}
                      </p>
                    )}
                  </div>
                )}

                {/* Firma del familiar */}
                {tipoSeleccionado.requiereFamiliar && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>
                        Firma del Familiar Responsable <span className="text-red-500">*</span>
                      </Label>
                      {firmas.firmaFamiliar && (
                        <Badge variant="default" className="bg-purple-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Firmado
                        </Badge>
                      )}
                    </div>
                    <FirmaDigitalPad
                      onSave={(firma) => handleFirmaChange('firmaFamiliar', firma)}
                      label="Familiar"
                    />
                    {errors.firmaFamiliar && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.firmaFamiliar}
                      </p>
                    )}
                  </div>
                )}

                {/* Firma del médico - SIEMPRE REQUERIDA */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label>
                      Firma del Médico <span className="text-red-500">*</span>
                    </Label>
                    {firmas.firmaMedico && (
                      <Badge variant="default" className="bg-orange-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Firmado
                      </Badge>
                    )}
                  </div>
                  <FirmaDigitalPad
                    onSave={(firma) => handleFirmaChange('firmaMedico', firma)}
                    label="Médico"
                  />
                  {errors.firmaMedico && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firmaMedico}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !tipoSeleccionado}>
              {loading ? 'Guardando...' : 'Aplicar Consentimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
