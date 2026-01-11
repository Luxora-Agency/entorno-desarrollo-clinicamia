I will implement the complete **Imagenología (Radiology/Imaging)** module, ensuring full integration with the backend, HCE, and other system modules.

### **1. Database Schema Enhancement (Prisma)**
I will add a new model `EstudioImagenologia` to `backend/prisma/schema.prisma` to track imaging studies specifically.
*   **Model:** `EstudioImagenologia`
    *   **Fields:** `id`, `tipoEstudio` (X-Ray, MRI, etc.), `zonaCuerpo`, `prioridad`, `indicacionClinica`, `hallazgos`, `conclusion`, `recomendaciones`, `imagenesUrl` (JSON), `informeUrl` (PDF), `estado` (Pendiente, EnProceso, Completado).
    *   **Relations:**
        *   `paciente`: Link to `Paciente`.
        *   `medicoSolicitante`: Link to `Usuario` (Doctor).
        *   `radiologo`: Link to `Usuario` (Radiologist).
        *   `ordenMedica`: Optional link to `OrdenMedica` (integration point with Citas/Orders).

### **2. Backend Implementation**
I will create the necessary backend infrastructure:
*   **Service (`backend/services/imagenologia.service.js`):**
    *   `createEstudio`: Create a new study request.
    *   `getAll`: List studies with filtering (by status, patient, date).
    *   `getById`: Get full details of a study.
    *   `updateInforme`: For radiologists to save findings/conclusions.
    *   `uploadImagenes`: Mock functionality to attach image URLs.
*   **Controller (`backend/controllers/imagenologia.controller.js`):** Handle HTTP requests.
*   **Routes (`backend/routes/imagenologia.js`):** Define API endpoints (e.g., `POST /`, `GET /`, `PUT /:id/informe`).
*   **Server Registration:** Register the new route in `backend/server.js`.

### **3. Frontend Implementation & Integration**
I will update the existing `ImagenologiaModule.jsx` to be fully functional:
*   **API Integration:** Replace mock data with calls to the new backend endpoints using `fetch` or a custom hook.
*   **Real-time Updates:** Ensure the dashboard reflects changes (e.g., status changes from "Pending" to "Completed").
*   **Radiologist Workflow:** Implement the "Write Report" modal/form for doctors to enter findings.
*   **Viewer Simulation:** Ensure the "View Images" button works (opening the stored URLs).

### **4. HCE Integration**
*   **Patient History:** Ensure that completed imaging studies are retrievable when viewing a patient's HCE. I will add a method in `HCEModule` or `ImagenologiaService` to fetch studies by `pacienteId` so they appear in the patient's timeline or exams tab.

### **5. Testing & Validation**
*   **Integration Test:** Create `backend/tests/integration/imagenologia_flow.test.js` to verify:
    1.  Creating a study request.
    2.  Retrieving the list of pending studies.
    3.  Updating the study with results (Radiologist action).
    4.  Verifying the study appears in the patient's history.
