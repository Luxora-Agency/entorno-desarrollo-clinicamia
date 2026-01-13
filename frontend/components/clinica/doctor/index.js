// Componentes principales del módulo Doctor
export { default as ClinicalWorkspace } from './ClinicalWorkspace';
export { default as AttentionTypeSelector, clearAttentionTypePreference } from './AttentionTypeSelector';
export { default as PatientContextBar } from './PatientContextBar';
export { default as DashboardDoctorHospitalizacion } from './DashboardDoctorHospitalizacion';
export { default as DoctorSettingsModule } from './DoctorSettingsModule';

// Widgets y acciones rápidas
export { default as ProximasCitasWidget } from './ProximasCitasWidget';
export { default as DoctorQuickActions } from './DoctorQuickActions';
export { default as DoctorNotifications, NotificationsCard } from './DoctorNotifications';
export { default as DoctorCommandPalette, useDoctorCommandPalette } from './DoctorCommandPalette';
export { default as HospitalizedPatientsWidget } from './HospitalizedPatientsWidget';
export { default as QuirofanoWidget } from './QuirofanoWidget';
export { default as RecentPatientsWidget, addRecentPatient, clearRecentPatients } from './RecentPatientsWidget';
export { default as DoctorBreadcrumbs, ViewHeader } from './DoctorBreadcrumbs';
export { default as ClinicalAlertsWidget } from './ClinicalAlertsWidget';
export { default as FloatingActionButton } from './FloatingActionButton';
export { default as KeyboardShortcutsHelp, useKeyboardShortcutsHelp, ShortcutsHint } from './KeyboardShortcutsHelp';
export { default as ConsultationTimer, useConsultationTimer, CompactTimer } from './ConsultationTimer';

// Herramientas clínicas
export { default as EpicrisisGenerator } from './EpicrisisGenerator';
export { default as AnalizadorHCE } from './AnalizadorHCE';
export { default as AIMedicalAssistant } from './AIMedicalAssistant';
export { default as BloqueoAgendaManager } from './BloqueoAgendaManager';

// Formularios y paneles
export { default as AnamnesisForm } from './AnamnesisForm';
export { default as AntecedentesEstructurados } from './AntecedentesEstructurados';
export { default as PanelHistorialClinico } from './PanelHistorialClinico';
export { default as RondaMedicaPanel } from './RondaMedicaPanel';

// Modales
export { default as ModalEvolucionHospitalizacion } from './ModalEvolucionHospitalizacion';
export { default as ModalOrdenesMedicas } from './ModalOrdenesMedicas';

// Plantillas
export { default as PlantillasPlanesModule } from './PlantillasPlanesModule';
export { default as TemplateSelector } from './TemplateSelector';

// Quirófano
export { default as DashboardDoctorQuirofano } from './quirofano/DashboardDoctorQuirofano';
export { default as SurgeryScheduler } from './quirofano/SurgeryScheduler';
export { default as SurgicalProtocolForm } from './quirofano/SurgicalProtocolForm';
export { default as SurgicalWorkspace } from './quirofano/SurgicalWorkspace';
