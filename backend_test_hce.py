#!/usr/bin/env python3
"""
Backend API Testing for Clínica Mía - HCE (Historia Clínica Electrónica) Module
Tests the HCE backend endpoints for integration with the new frontend
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:4000"
TEST_USER = {
    "email": "admin@clinicamia.com",
    "password": "admin123"
}

class HCEBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.test_results = []
        self.test_paciente_id = None
        self.test_profesional_id = None
        self.created_evolucion_id = None
        self.created_signo_vital_id = None
        self.created_diagnostico_id = None
        self.created_alerta_id = None

    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })

    def authenticate(self):
        """Get JWT token for authentication"""
        try:
            print("\n🔐 Testing Authentication...")
            
            response = requests.post(
                f"{self.base_url}/auth/login",
                headers=self.headers,
                json=TEST_USER,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "token" in data.get("data", {}):
                    self.token = data["data"]["token"]
                    self.headers["Authorization"] = f"Bearer {self.token}"
                    # Store user ID as profesional_id for testing
                    if "user" in data.get("data", {}):
                        self.test_profesional_id = data["data"]["user"]["id"]
                    self.log_test("Authentication", True, "Login successful, token obtained")
                    return True
                else:
                    self.log_test("Authentication", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Authentication", False, f"Login failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Authentication error: {str(e)}")
            return False

    def test_health_check(self):
        """Test health endpoint"""
        try:
            print("\n🏥 Testing Health Check...")
            
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok" and data.get("database") == "connected":
                    self.log_test("Health Check", True, "Server and database are healthy")
                    return True
                else:
                    self.log_test("Health Check", False, f"Health check failed: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"Health endpoint returned {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Health check error: {str(e)}")
            return False

    def get_test_patient(self):
        """Get a test patient for HCE operations"""
        try:
            print("\n👤 Getting Test Patient...")
            
            # First try to search for existing patients
            response = requests.get(
                f"{self.base_url}/pacientes/search?q=test",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data", {}).get("pacientes"):
                    pacientes = data["data"]["pacientes"]
                    if len(pacientes) > 0:
                        self.test_paciente_id = pacientes[0]["id"]
                        self.log_test("Get Test Patient", True, f"Found existing patient: {pacientes[0]['nombre']} {pacientes[0]['apellido']}")
                        return True
            
            # If no patients found, try to get any patient
            response = requests.get(
                f"{self.base_url}/pacientes?limit=1",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    pacientes = data["data"]
                    if len(pacientes) > 0:
                        self.test_paciente_id = pacientes[0]["id"]
                        self.log_test("Get Test Patient", True, f"Using existing patient: {pacientes[0]['nombre']} {pacientes[0]['apellido']}")
                        return True
            
            self.log_test("Get Test Patient", False, "No patients found in database")
            return False
                
        except Exception as e:
            self.log_test("Get Test Patient", False, f"Error getting test patient: {str(e)}")
            return False

    def test_evoluciones_endpoints(self):
        """Test Evoluciones Clínicas SOAP endpoints"""
        print("\n📝 Testing Evoluciones Clínicas SOAP Endpoints...")
        
        # Test GET /evoluciones (list)
        try:
            response = requests.get(
                f"{self.base_url}/evoluciones?paciente_id={self.test_paciente_id}&limit=100",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data:
                    evoluciones = data["data"]
                    self.log_test("GET Evoluciones", True, f"Retrieved {len(evoluciones)} evoluciones for patient")
                else:
                    self.log_test("GET Evoluciones", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Evoluciones", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Evoluciones", False, f"GET error: {str(e)}")

        # Test POST /evoluciones (create)
        try:
            evolucion_data = {
                "paciente_id": self.test_paciente_id,
                "profesional_id": self.test_profesional_id,
                "subjetivo": "Paciente refiere dolor lumbar de 3 días de evolución, que se intensifica con los movimientos. Niega fiebre o irradiación.",
                "objetivo": "TA: 120/80 mmHg, FC: 72 lpm, FR: 16 rpm, Temp: 36.5°C. Paciente consciente, orientado. Dolor a la palpación en región lumbar baja.",
                "analisis": "Lumbalgia mecánica aguda. Probable contractura muscular paravertebral. Descartar patología discal.",
                "plan": "1. Analgesia con ibuprofeno 400mg c/8h por 5 días. 2. Relajante muscular. 3. Fisioterapia. 4. Control en 1 semana. 5. Rx lumbar si no mejora."
            }
            
            response = requests.post(
                f"{self.base_url}/evoluciones",
                headers=self.headers,
                json=evolucion_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "evolucion" in data.get("data", {}):
                    self.created_evolucion_id = data["data"]["evolucion"]["id"]
                    self.log_test("POST Evolución", True, f"Evolución SOAP created with ID: {self.created_evolucion_id}")
                else:
                    self.log_test("POST Evolución", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Evolución", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Evolución", False, f"POST error: {str(e)}")

        # Test GET /evoluciones/:id (get by ID)
        if self.created_evolucion_id:
            try:
                response = requests.get(
                    f"{self.base_url}/evoluciones/{self.created_evolucion_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "evolucion" in data.get("data", {}):
                        evolucion = data["data"]["evolucion"]
                        # Verify SOAP fields are present
                        soap_fields = ["subjetivo", "objetivo", "analisis", "plan"]
                        missing_fields = [field for field in soap_fields if not evolucion.get(field)]
                        if not missing_fields:
                            self.log_test("GET Evolución by ID", True, "Evolución retrieved with all SOAP fields")
                        else:
                            self.log_test("GET Evolución by ID", False, f"Missing SOAP fields: {missing_fields}")
                    else:
                        self.log_test("GET Evolución by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Evolución by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Evolución by ID", False, f"GET by ID error: {str(e)}")

    def test_signos_vitales_endpoints(self):
        """Test Signos Vitales endpoints"""
        print("\n🩺 Testing Signos Vitales Endpoints...")
        
        # Test GET /signos-vitales (list)
        try:
            response = requests.get(
                f"{self.base_url}/signos-vitales?paciente_id={self.test_paciente_id}&limit=100",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data:
                    signos = data["data"]
                    self.log_test("GET Signos Vitales", True, f"Retrieved {len(signos)} signos vitales for patient")
                else:
                    self.log_test("GET Signos Vitales", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Signos Vitales", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Signos Vitales", False, f"GET error: {str(e)}")

        # Test POST /signos-vitales (create)
        try:
            signos_data = {
                "paciente_id": self.test_paciente_id,
                "profesional_id": self.test_profesional_id,
                "presion_sistolica": 120,
                "presion_diastolica": 80,
                "frecuencia_cardiaca": 72,
                "frecuencia_respiratoria": 16,
                "temperatura": 36.5,
                "saturacion_oxigeno": 98,
                "peso": 70.5,
                "talla": 170
            }
            
            response = requests.post(
                f"{self.base_url}/signos-vitales",
                headers=self.headers,
                json=signos_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "signoVital" in data.get("data", {}):
                    self.created_signo_vital_id = data["data"]["signoVital"]["id"]
                    signo = data["data"]["signoVital"]
                    # Check if IMC was calculated
                    if signo.get("imc"):
                        self.log_test("POST Signos Vitales", True, f"Signos vitales created with ID: {self.created_signo_vital_id}, IMC: {signo['imc']}")
                    else:
                        self.log_test("POST Signos Vitales", True, f"Signos vitales created with ID: {self.created_signo_vital_id}")
                else:
                    self.log_test("POST Signos Vitales", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Signos Vitales", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Signos Vitales", False, f"POST error: {str(e)}")

        # Test GET /signos-vitales/grafica/:paciente_id (chart data)
        try:
            response = requests.get(
                f"{self.base_url}/signos-vitales/grafica/{self.test_paciente_id}?tipo=presion&dias=7",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "datos" in data.get("data", {}):
                    datos = data["data"]["datos"]
                    self.log_test("GET Signos Vitales Gráfica", True, f"Retrieved {len(datos)} data points for chart")
                else:
                    self.log_test("GET Signos Vitales Gráfica", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Signos Vitales Gráfica", False, f"GET chart failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Signos Vitales Gráfica", False, f"GET chart error: {str(e)}")

    def test_diagnosticos_endpoints(self):
        """Test Diagnósticos CIE-11 endpoints"""
        print("\n🔬 Testing Diagnósticos CIE-11 Endpoints...")
        
        # Test GET /diagnosticos (list)
        try:
            response = requests.get(
                f"{self.base_url}/diagnosticos?paciente_id={self.test_paciente_id}&limit=100",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data:
                    diagnosticos = data["data"]
                    self.log_test("GET Diagnósticos", True, f"Retrieved {len(diagnosticos)} diagnósticos for patient")
                else:
                    self.log_test("GET Diagnósticos", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Diagnósticos", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Diagnósticos", False, f"GET error: {str(e)}")

        # Test POST /diagnosticos (create)
        try:
            diagnostico_data = {
                "paciente_id": self.test_paciente_id,
                "profesional_id": self.test_profesional_id,
                "codigo_cie11": "2E20",
                "descripcion_cie11": "Diabetes mellitus tipo 2",
                "tipo_diagnostico": "Principal",
                "estado_diagnostico": "Activo",
                "observaciones": "Paciente con diabetes tipo 2 de reciente diagnóstico. Requiere seguimiento nutricional y control glucémico."
            }
            
            response = requests.post(
                f"{self.base_url}/diagnosticos",
                headers=self.headers,
                json=diagnostico_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "diagnostico" in data.get("data", {}):
                    self.created_diagnostico_id = data["data"]["diagnostico"]["id"]
                    diagnostico = data["data"]["diagnostico"]
                    self.log_test("POST Diagnóstico", True, f"Diagnóstico CIE-11 created: {diagnostico['codigoCIE11']} - {diagnostico['descripcionCIE11']}")
                else:
                    self.log_test("POST Diagnóstico", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Diagnóstico", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Diagnóstico", False, f"POST error: {str(e)}")

        # Test GET /diagnosticos/:id (get by ID)
        if self.created_diagnostico_id:
            try:
                response = requests.get(
                    f"{self.base_url}/diagnosticos/{self.created_diagnostico_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "diagnostico" in data.get("data", {}):
                        diagnostico = data["data"]["diagnostico"]
                        # Verify required fields
                        required_fields = ["codigoCIE11", "descripcionCIE11", "tipoDiagnostico", "estadoDiagnostico"]
                        missing_fields = [field for field in required_fields if not diagnostico.get(field)]
                        if not missing_fields:
                            self.log_test("GET Diagnóstico by ID", True, f"Diagnóstico retrieved: {diagnostico['tipoDiagnostico']} - {diagnostico['estadoDiagnostico']}")
                        else:
                            self.log_test("GET Diagnóstico by ID", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("GET Diagnóstico by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Diagnóstico by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Diagnóstico by ID", False, f"GET by ID error: {str(e)}")

        # Test GET /diagnosticos/principal/:paciente_id (get principal diagnosis)
        try:
            response = requests.get(
                f"{self.base_url}/diagnosticos/principal/{self.test_paciente_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    diagnostico = data.get("data", {}).get("diagnostico")
                    if diagnostico:
                        self.log_test("GET Diagnóstico Principal", True, f"Principal diagnosis found: {diagnostico['codigoCIE11']}")
                    else:
                        self.log_test("GET Diagnóstico Principal", True, "No principal diagnosis found (expected for new patient)")
                else:
                    self.log_test("GET Diagnóstico Principal", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Diagnóstico Principal", False, f"GET principal failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Diagnóstico Principal", False, f"GET principal error: {str(e)}")

    def test_alertas_endpoints(self):
        """Test Alertas Clínicas endpoints"""
        print("\n🚨 Testing Alertas Clínicas Endpoints...")
        
        # Test GET /alertas (list)
        try:
            response = requests.get(
                f"{self.base_url}/alertas?paciente_id={self.test_paciente_id}&limit=100",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data:
                    alertas = data["data"]
                    self.log_test("GET Alertas", True, f"Retrieved {len(alertas)} alertas for patient")
                else:
                    self.log_test("GET Alertas", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Alertas", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Alertas", False, f"GET error: {str(e)}")

        # Test POST /alertas (create)
        try:
            alerta_data = {
                "paciente_id": self.test_paciente_id,
                "profesional_id": self.test_profesional_id,
                "tipo_alerta": "Alergia",
                "titulo": "Alergia a la penicilina",
                "descripcion": "Paciente presenta alergia conocida a la penicilina con antecedente de reacción anafiláctica previa en 2020.",
                "severidad": "Alta",
                "origen": "Historia Clínica"
            }
            
            response = requests.post(
                f"{self.base_url}/alertas",
                headers=self.headers,
                json=alerta_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "alerta" in data.get("data", {}):
                    self.created_alerta_id = data["data"]["alerta"]["id"]
                    alerta = data["data"]["alerta"]
                    self.log_test("POST Alerta", True, f"Alerta clínica created: {alerta['tipoAlerta']} - {alerta['severidad']}")
                else:
                    self.log_test("POST Alerta", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Alerta", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Alerta", False, f"POST error: {str(e)}")

        # Test GET /alertas/:id (get by ID)
        if self.created_alerta_id:
            try:
                response = requests.get(
                    f"{self.base_url}/alertas/{self.created_alerta_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "alerta" in data.get("data", {}):
                        alerta = data["data"]["alerta"]
                        # Verify required fields
                        required_fields = ["tipoAlerta", "titulo", "descripcion", "severidad"]
                        missing_fields = [field for field in required_fields if not alerta.get(field)]
                        if not missing_fields:
                            self.log_test("GET Alerta by ID", True, f"Alerta retrieved: {alerta['tipoAlerta']} - {alerta['severidad']}")
                        else:
                            self.log_test("GET Alerta by ID", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("GET Alerta by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Alerta by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Alerta by ID", False, f"GET by ID error: {str(e)}")

        # Test GET /alertas/activas/:paciente_id (get active alerts)
        try:
            response = requests.get(
                f"{self.base_url}/alertas/activas/{self.test_paciente_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "alertas" in data.get("data", {}):
                    alertas_activas = data["data"]["alertas"]
                    self.log_test("GET Alertas Activas", True, f"Retrieved {len(alertas_activas)} active alerts")
                else:
                    self.log_test("GET Alertas Activas", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Alertas Activas", False, f"GET active alerts failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Alertas Activas", False, f"GET active alerts error: {str(e)}")

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️  Testing Error Handling...")
        
        # Test unauthorized access (without token)
        try:
            headers_no_auth = {"Content-Type": "application/json"}
            response = requests.get(
                f"{self.base_url}/evoluciones",
                headers=headers_no_auth,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test("Unauthorized Access", True, "Correctly rejected request without token")
            else:
                self.log_test("Unauthorized Access", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Unauthorized Access", False, f"Error testing unauthorized access: {str(e)}")

        # Test invalid data (missing required fields for evolución)
        try:
            invalid_data = {
                "paciente_id": self.test_paciente_id,
                "subjetivo": "Missing other SOAP fields"
            }
            
            response = requests.post(
                f"{self.base_url}/evoluciones",
                headers=self.headers,
                json=invalid_data,
                timeout=10
            )
            
            if response.status_code >= 400:
                self.log_test("Invalid Evolución Data", True, f"Correctly rejected incomplete SOAP data with status {response.status_code}")
            else:
                self.log_test("Invalid Evolución Data", False, f"Should have rejected incomplete SOAP data, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Evolución Data", False, f"Error testing invalid data: {str(e)}")

        # Test invalid patient ID
        try:
            fake_uuid = str(uuid.uuid4())
            response = requests.get(
                f"{self.base_url}/evoluciones?paciente_id={fake_uuid}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and len(data["data"]) == 0:
                    self.log_test("Invalid Patient ID", True, "Correctly returned empty results for non-existent patient")
                else:
                    self.log_test("Invalid Patient ID", False, f"Unexpected response for invalid patient ID: {data}")
            else:
                self.log_test("Invalid Patient ID", False, f"Unexpected status code for invalid patient ID: {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Patient ID", False, f"Error testing invalid patient ID: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests for Clínica Mía - HCE (Historia Clínica Electrónica) Module")
        print("=" * 90)
        
        # Test sequence
        if not self.test_health_check():
            print("❌ Health check failed, aborting tests")
            return False
            
        if not self.authenticate():
            print("❌ Authentication failed, aborting tests")
            return False
            
        if not self.get_test_patient():
            print("❌ Could not get test patient, aborting tests")
            return False
            
        self.test_evoluciones_endpoints()
        self.test_signos_vitales_endpoints()
        self.test_diagnosticos_endpoints()
        self.test_alertas_endpoints()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 90)
        print("📊 HCE MODULE TEST SUMMARY")
        print("=" * 90)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        else:
            print("\n🎉 ALL HCE TESTS PASSED! The module is ready for frontend integration.")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = HCEBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)