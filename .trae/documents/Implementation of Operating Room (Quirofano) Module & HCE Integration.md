I will implement the complete Operating Room (Quirofano) module and integrate it with the existing system (HCE, Patients, Doctors).

### 1. Database Schema Updates (`schema.prisma`)
- **Create `Quirofano` Model**:
  - Fields: `id`, `nombre`, `tipo` (e.g., General, Partos), `estado` (Activo, Mantenimiento), `ubicacion`.
- **Update `Procedimiento` Model**:
  - Add `quirofanoId` (Relation to `Quirofano`).
  - Add `anestesiologoId` (Relation to `Usuario`/`Doctor`).
  - Add `tipoAnestesia` (String/Enum).
  - Add `horaInicioReal` and `horaFinReal` (DateTime) for precise duration tracking.
  - Add `tipoCirugia` (Electiva, Urgencia).

### 2. Backend Implementation
- **Quirofano Service & Controller**:
  - CRUD operations for managing Operating Rooms.
  - `checkAvailability(quirofanoId, date, duration)`: Logic to prevent overlapping surgeries.
- **Enhance `Procedimiento` Service**:
  - Update `crearProcedimiento` to accept `quirofanoId` and validate availability.
  - Update `completarProcedimiento` to handle anesthesia details and precise timings.
  - Implement **Stock Deduction**: When `insumosUtilizados` are recorded, optionally trigger inventory updates in the Pharmacy module.

### 3. Integration with HCE & Modules
- **HCE**: Ensure surgery reports (`Procedimiento` records) are automatically visible in the Patient's History (this is already partially supported by the relation `paciente.procedimientos`, but I will ensure the data flow is complete).
- **Admissions**: Automate status changes (e.g., when surgery starts, patient status -> "En Cirugía").

### 4. Testing & Validation
- **Unit Tests**: Test scheduling logic (overlap prevention).
- **Integration Tests**: Verify the flow: Schedule Surgery -> Execute -> Complete -> Verify HCE Update.

### 5. Deliverables
- Updated `schema.prisma`.
- New `quirofano.service.js`, `quirofano.controller.js`, `quirofano.routes.js`.
- Updated `procedimiento.service.js`.
- Test suite for the new module.
