#!/usr/bin/env python3
"""
Backend API Testing for Clínica Mía - Doctor Availability Module
Tests the doctor availability endpoints for appointment scheduling
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:4000"
TEST_USER = {
    "email": "admin@clinicamia.com",
    "password": "admin123"
}

class DisponibilidadTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.test_results = []
        self.test_doctor_id = None
        self.test_fecha = None

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

    def setup_test_doctor(self):
        """Find or create a doctor with configured schedules for testing"""
        try:
            print("\n👨‍⚕️ Setting up test doctor with schedules...")
            
            # First, try to find existing doctors
            response = requests.get(
                f"{self.base_url}/doctores",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                doctors = data.get("data", [])
                
                # Look for a doctor with configured schedules
                for doctor in doctors:
                    if doctor.get("horarios"):
                        self.test_doctor_id = doctor["id"]
                        self.log_test("Find Test Doctor", True, f"Found doctor with schedules: {doctor.get('nombre', 'Unknown')} (ID: {self.test_doctor_id})")
                        return True
                
                # If no doctor with schedules found, try to find any doctor
                if doctors:
                    doctor = doctors[0]
                    self.test_doctor_id = doctor["id"]
                    
                    # Set up test date (tomorrow)
                    tomorrow = datetime.now() + timedelta(days=1)
                    self.test_fecha = tomorrow.strftime("%Y-%m-%d")
                    
                    self.log_test("Setup Test Doctor", True, f"Found doctor: {doctor.get('nombre', 'Unknown')} (ID: {self.test_doctor_id})")
                    return True
                
                self.log_test("Setup Test Doctor", False, "No doctors found in database")
                return False
            else:
                self.log_test("Setup Test Doctor", False, f"Failed to fetch doctors: {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Setup Test Doctor", False, f"Error setting up test doctor: {str(e)}")
            return False

    def test_get_disponibilidad_endpoint(self):
        """Test GET /disponibilidad/:doctorId endpoint"""
        print("\n📅 Testing GET /disponibilidad/:doctorId endpoint...")
        
        if not self.test_doctor_id:
            self.log_test("GET Disponibilidad", False, "No test doctor available")
            return
        
        # Set test date if not already set
        if not self.test_fecha:
            tomorrow = datetime.now() + timedelta(days=1)
            self.test_fecha = tomorrow.strftime("%Y-%m-%d")
        
        # Test 1: Valid doctor and date
        try:
            response = requests.get(
                f"{self.base_url}/disponibilidad/{self.test_doctor_id}?fecha={self.test_fecha}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    availability_data = data["data"]
                    required_fields = ["fecha", "horarios_configurados", "slots_disponibles"]
                    
                    if all(field in availability_data for field in required_fields):
                        self.log_test("GET Disponibilidad - Valid Request", True, 
                                    f"Retrieved availability for {self.test_fecha}. Horarios configurados: {availability_data['horarios_configurados']}, Slots: {len(availability_data['slots_disponibles'])}")
                    else:
                        self.log_test("GET Disponibilidad - Valid Request", False, f"Missing required fields in response: {availability_data}")
                else:
                    self.log_test("GET Disponibilidad - Valid Request", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Disponibilidad - Valid Request", False, f"Request failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Disponibilidad - Valid Request", False, f"Error: {str(e)}")

        # Test 2: Missing fecha parameter
        try:
            response = requests.get(
                f"{self.base_url}/disponibilidad/{self.test_doctor_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                if not data.get("success") and "fecha es requerido" in data.get("message", ""):
                    self.log_test("GET Disponibilidad - Missing Fecha", True, "Correctly rejected request without fecha parameter")
                else:
                    self.log_test("GET Disponibilidad - Missing Fecha", False, f"Unexpected response: {data}")
            else:
                self.log_test("GET Disponibilidad - Missing Fecha", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("GET Disponibilidad - Missing Fecha", False, f"Error: {str(e)}")

        # Test 3: Invalid doctor ID
        try:
            fake_doctor_id = "00000000-0000-0000-0000-000000000000"
            response = requests.get(
                f"{self.base_url}/disponibilidad/{fake_doctor_id}?fecha={self.test_fecha}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 404:
                data = response.json()
                if not data.get("success") and "no encontrado" in data.get("message", ""):
                    self.log_test("GET Disponibilidad - Invalid Doctor", True, "Correctly rejected request with invalid doctor ID")
                else:
                    self.log_test("GET Disponibilidad - Invalid Doctor", False, f"Unexpected response: {data}")
            else:
                self.log_test("GET Disponibilidad - Invalid Doctor", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("GET Disponibilidad - Invalid Doctor", False, f"Error: {str(e)}")

        # Test 4: Invalid date format
        try:
            response = requests.get(
                f"{self.base_url}/disponibilidad/{self.test_doctor_id}?fecha=invalid-date",
                headers=self.headers,
                timeout=10
            )
            
            # Should handle gracefully (either 400 or return empty availability)
            if response.status_code in [200, 400]:
                self.log_test("GET Disponibilidad - Invalid Date", True, f"Handled invalid date format appropriately (status: {response.status_code})")
            else:
                self.log_test("GET Disponibilidad - Invalid Date", False, f"Unexpected status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("GET Disponibilidad - Invalid Date", False, f"Error: {str(e)}")

    def test_post_validar_endpoint(self):
        """Test POST /disponibilidad/validar endpoint"""
        print("\n✅ Testing POST /disponibilidad/validar endpoint...")
        
        if not self.test_doctor_id:
            self.log_test("POST Validar Disponibilidad", False, "No test doctor available")
            return
        
        if not self.test_fecha:
            tomorrow = datetime.now() + timedelta(days=1)
            self.test_fecha = tomorrow.strftime("%Y-%m-%d")

        # Test 1: Valid availability check
        try:
            valid_data = {
                "doctor_id": self.test_doctor_id,
                "fecha": self.test_fecha,
                "hora": "09:00",
                "duracion_minutos": 30
            }
            
            response = requests.post(
                f"{self.base_url}/disponibilidad/validar",
                headers=self.headers,
                json=valid_data,
                timeout=10
            )
            
            if response.status_code in [200, 400]:  # Both success and "not available" are valid responses
                data = response.json()
                if "disponible" in data and "message" in data:
                    if data["disponible"]:
                        self.log_test("POST Validar - Valid Request", True, f"Slot is available: {data['message']}")
                    else:
                        self.log_test("POST Validar - Valid Request", True, f"Slot not available (expected): {data['message']}")
                else:
                    self.log_test("POST Validar - Valid Request", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Validar - Valid Request", False, f"Unexpected status code: {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Validar - Valid Request", False, f"Error: {str(e)}")

        # Test 2: Missing required fields
        try:
            invalid_data = {
                "doctor_id": self.test_doctor_id,
                # Missing fecha and hora
            }
            
            response = requests.post(
                f"{self.base_url}/disponibilidad/validar",
                headers=self.headers,
                json=invalid_data,
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                if not data.get("success") and "requeridos" in data.get("message", ""):
                    self.log_test("POST Validar - Missing Fields", True, "Correctly rejected request with missing fields")
                else:
                    self.log_test("POST Validar - Missing Fields", False, f"Unexpected response: {data}")
            else:
                self.log_test("POST Validar - Missing Fields", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("POST Validar - Missing Fields", False, f"Error: {str(e)}")

        # Test 3: Invalid doctor ID
        try:
            invalid_doctor_data = {
                "doctor_id": "00000000-0000-0000-0000-000000000000",
                "fecha": self.test_fecha,
                "hora": "09:00",
                "duracion_minutos": 30
            }
            
            response = requests.post(
                f"{self.base_url}/disponibilidad/validar",
                headers=self.headers,
                json=invalid_doctor_data,
                timeout=10
            )
            
            if response.status_code in [400, 404, 500]:  # Various error codes are acceptable
                data = response.json()
                if not data.get("success"):
                    self.log_test("POST Validar - Invalid Doctor", True, f"Correctly rejected invalid doctor ID: {data.get('message', 'No message')}")
                else:
                    self.log_test("POST Validar - Invalid Doctor", False, f"Should have failed but got success: {data}")
            else:
                self.log_test("POST Validar - Invalid Doctor", False, f"Expected error status, got {response.status_code}")
                
        except Exception as e:
            self.log_test("POST Validar - Invalid Doctor", False, f"Error: {str(e)}")

        # Test 4: Test with different duration
        try:
            duration_data = {
                "doctor_id": self.test_doctor_id,
                "fecha": self.test_fecha,
                "hora": "10:00",
                "duracion_minutos": 60  # 1 hour appointment
            }
            
            response = requests.post(
                f"{self.base_url}/disponibilidad/validar",
                headers=self.headers,
                json=duration_data,
                timeout=10
            )
            
            if response.status_code in [200, 400]:
                data = response.json()
                if "disponible" in data:
                    self.log_test("POST Validar - Custom Duration", True, f"Handled 60-minute appointment: disponible={data['disponible']}")
                else:
                    self.log_test("POST Validar - Custom Duration", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Validar - Custom Duration", False, f"Unexpected status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("POST Validar - Custom Duration", False, f"Error: {str(e)}")

    def test_get_semana_endpoint(self):
        """Test GET /disponibilidad/:doctorId/semana endpoint (optional)"""
        print("\n📊 Testing GET /disponibilidad/:doctorId/semana endpoint...")
        
        if not self.test_doctor_id:
            self.log_test("GET Disponibilidad Semana", False, "No test doctor available")
            return

        try:
            today = datetime.now().strftime("%Y-%m-%d")
            response = requests.get(
                f"{self.base_url}/disponibilidad/{self.test_doctor_id}/semana?fecha_inicio={today}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    week_data = data["data"]
                    if isinstance(week_data, list) and len(week_data) == 7:
                        self.log_test("GET Disponibilidad Semana", True, f"Retrieved 7-day availability data")
                    else:
                        self.log_test("GET Disponibilidad Semana", False, f"Expected 7 days of data, got: {len(week_data) if isinstance(week_data, list) else 'not a list'}")
                else:
                    self.log_test("GET Disponibilidad Semana", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Disponibilidad Semana", False, f"Request failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Disponibilidad Semana", False, f"Error: {str(e)}")

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️  Testing Error Handling...")
        
        # Test unauthorized access (without token)
        try:
            headers_no_auth = {"Content-Type": "application/json"}
            response = requests.get(
                f"{self.base_url}/disponibilidad/{self.test_doctor_id or 'test'}?fecha=2025-01-15",
                headers=headers_no_auth,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test("Unauthorized Access", True, "Correctly rejected request without token")
            else:
                self.log_test("Unauthorized Access", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Unauthorized Access", False, f"Error testing unauthorized access: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests for Clínica Mía - Doctor Availability Module")
        print("=" * 80)
        
        # Test sequence
        if not self.test_health_check():
            print("❌ Health check failed, aborting tests")
            return False
            
        if not self.authenticate():
            print("❌ Authentication failed, aborting tests")
            return False
            
        if not self.setup_test_doctor():
            print("⚠️  Could not set up test doctor, continuing with limited tests")
        
        self.test_get_disponibilidad_endpoint()
        self.test_post_validar_endpoint()
        self.test_get_semana_endpoint()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
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
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = DisponibilidadTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)