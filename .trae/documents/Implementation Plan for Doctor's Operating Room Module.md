I will implement the **Doctor's Operating Room Module** (Módulo de Quirófano) by creating a comprehensive frontend interface integrated with the existing backend services.

### **1. Integration Point**
*   **Update `DashboardDoctor.jsx`**: Add a new "Quirófano" mode alongside "Hospitalización" and "Consulta Externa".
*   **Navigation**: Add a dedicated button in the dashboard header to switch to the Operating Room view.

### **2. New Components Structure**
I will create a new directory `frontend/components/clinica/doctor/quirofano/` containing:

*   **`DashboardDoctorQuirofano.jsx`**: The main dashboard for the surgeon.
    *   **Features**:
        *   **KPI Cards**: Surgeries Today, In Progress, Pending Protocol.
        *   **Surgery List**: A filterable table of surgeries assigned to the doctor (`medicoResponsableId`).
        *   **Actions**: "Schedule Surgery" button.
    
*   **`SurgicalWorkspace.jsx`**: The active execution environment for a surgery.
    *   **Phases (Tabs)**:
        1.  **Pre-operative**: Safety Checklist, Team Confirmation, Patient Verification.
        2.  **Intra-operative**:
            *   **Timer**: Real-time tracking of surgery duration.
            *   **Team**: Management of surgical team (Surgeon, Anesthesiologist, Nurses).
            *   **Materials**: Section to log used supplies (integrated with Inventory UI).
        3.  **Post-operative**:
            *   **Protocol Form**: Detailed registration of findings, complications, and procedure description.
            *   **Orders**: Post-op recovery orders.

*   **`SurgeryScheduler.jsx`**: A modal to book operating rooms.
    *   Checks availability using existing backend logic.
    *   Allows selection of patient, procedure type, and room.

### **3. Service Layer Updates**
*   **Update `frontend/services/quirofano.service.js`**:
    *   Add `getPersonal()` to fetch available surgical staff (backend endpoint exists).
*   **Leverage `procedimiento.service.js`**:
    *   Use existing methods: `iniciar`, `completar` (for protocols), `cancelar`, `getEstadisticas`.

### **4. Key Features Implementation**
*   **Traceability**: All actions (Start, Finish) map directly to backend state transitions (`Programado` -> `EnProceso` -> `Completado`).
*   **Documentation**: The "Complete Surgery" action will require filling the **Surgical Protocol**, which generates a PDF via the existing backend service.
*   **Security**: Use the existing authentication token for all requests.

### **5. Verification**
*   I will verify the flow by scheduling a surgery, starting it, and completing it with a protocol, ensuring the status updates correctly in the dashboard.
