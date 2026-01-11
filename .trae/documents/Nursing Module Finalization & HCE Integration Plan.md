I will finalize the Nursing Module implementation, ensuring full interoperability with HCE and the rest of the system.

### 1. Validation & Testing (First Step)
- Create `backend_test_nursing.py` to simulate a full nursing workflow:
    - Nurse Login.
    - Assign Nurse to Unit/Patient.
    - View Assigned Patients.
    - Create Nursing Note.
    - Administer Medication (link to Prescription).
    - Record Vital Signs.
    - Verify data appears in HCE.

### 2. Frontend Implementation (Nursing Dashboard)
- **Complete `DashboardEnfermera.jsx`**:
    - **Tasks Tab**: Implement fetching of "Tareas". These will be an aggregation of:
        - Pending Medications (`/administraciones`).
        - Active Medical Orders (`/ordenes-medicas`) of type 'Cuidados', 'Procedimiento', 'Dieta'.
    - **Alerts Tab**: Connect to existing `/alertas/activas` endpoint to show real clinical alerts (Allergies, Critical Vitals).
    - **Vitals**: Ensure real-time update of patient vitals.

### 3. HCE Integration (Interoperability)
- **Doctor's View**: Add a new **"Notas de Enfermería"** tab to the Doctor's HCE (`HCEModule.jsx`).
    - Create `frontend/components/clinica/hce/TabNotasEnfermeria.jsx`.
    - Allow doctors to read (read-only) nursing notes, administrations, and vital signs recorded by nurses.

### 4. Backend Refinements
- Verify `ordenesMedicas` route allows filtering by "pending" and "type" for the nursing task list.
- Ensure `SignoVital` records created by nurses are automatically visible in the Doctor's HCE (they share the same table, so this should work, will verify).

### 5. Final Verification
- Run the test script again.
- Verify the frontend UI shows the data correctly.
