#!/usr/bin/env python3
"""
Backend API Testing for Clínica Mía - Exámenes y Procedimientos Module
Tests the refactored backend endpoints for Categories and Exams/Procedures
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:4000"
TEST_USER = {
    "email": "admin@clinica.com",
    "password": "admin123"
}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.test_results = []
        self.created_categoria_id = None
        self.created_examen_id = None

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

    def test_categorias_endpoints(self):
        """Test all Categorías de Exámenes endpoints"""
        print("\n📋 Testing Categorías de Exámenes Endpoints...")
        
        # Test GET /categorias-examenes (list)
        try:
            response = requests.get(
                f"{self.base_url}/categorias-examenes",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "categorias" in data["data"]:
                    self.log_test("GET Categorías", True, f"Retrieved {len(data['data']['categorias'])} categories")
                elif "data" in data and isinstance(data["data"], list):
                    # Handle paginated response format
                    self.log_test("GET Categorías", True, f"Retrieved {len(data['data'])} categories (paginated)")
                else:
                    self.log_test("GET Categorías", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Categorías", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Categorías", False, f"GET error: {str(e)}")

        # Test POST /categorias-examenes (create)
        try:
            categoria_data = {
                "nombre": "Laboratorio Clínico",
                "descripcion": "Análisis de laboratorio y pruebas diagnósticas",
                "colorHex": "#FF5733"
            }
            
            response = requests.post(
                f"{self.base_url}/categorias-examenes",
                headers=self.headers,
                json=categoria_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "categoria" in data.get("data", {}):
                    self.created_categoria_id = data["data"]["categoria"]["id"]
                    self.log_test("POST Categoría", True, f"Category created with ID: {self.created_categoria_id}")
                else:
                    self.log_test("POST Categoría", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Categoría", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Categoría", False, f"POST error: {str(e)}")

        # Test GET /categorias-examenes/:id (get by ID)
        if self.created_categoria_id:
            try:
                response = requests.get(
                    f"{self.base_url}/categorias-examenes/{self.created_categoria_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "categoria" in data.get("data", {}):
                        self.log_test("GET Categoría by ID", True, "Category retrieved successfully")
                    else:
                        self.log_test("GET Categoría by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Categoría by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Categoría by ID", False, f"GET by ID error: {str(e)}")

        # Test PUT /categorias-examenes/:id (update)
        if self.created_categoria_id:
            try:
                update_data = {
                    "nombre": "Laboratorio Clínico Actualizado",
                    "descripcion": "Análisis de laboratorio y pruebas diagnósticas actualizadas"
                }
                
                response = requests.put(
                    f"{self.base_url}/categorias-examenes/{self.created_categoria_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "categoria" in data.get("data", {}):
                        self.log_test("PUT Categoría", True, "Category updated successfully")
                    else:
                        self.log_test("PUT Categoría", False, f"Invalid response format: {data}")
                else:
                    self.log_test("PUT Categoría", False, f"PUT failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("PUT Categoría", False, f"PUT error: {str(e)}")

        # Test GET /categorias-examenes/estadisticas
        try:
            response = requests.get(
                f"{self.base_url}/categorias-examenes/estadisticas",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    stats = data["data"]
                    if "total" in stats and "activas" in stats:
                        self.log_test("GET Categorías Stats", True, f"Stats: {stats['total']} total, {stats['activas']} active")
                    else:
                        self.log_test("GET Categorías Stats", False, f"Invalid stats format: {stats}")
                else:
                    self.log_test("GET Categorías Stats", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Categorías Stats", False, f"Stats failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Categorías Stats", False, f"Stats error: {str(e)}")

    def test_examenes_endpoints(self):
        """Test all Exámenes y Procedimientos endpoints"""
        print("\n🔬 Testing Exámenes y Procedimientos Endpoints...")
        
        # Test GET /examenes-procedimientos (list)
        try:
            response = requests.get(
                f"{self.base_url}/examenes-procedimientos",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "items" in data["data"]:
                    self.log_test("GET Exámenes", True, f"Retrieved {len(data['data']['items'])} exams/procedures")
                elif "data" in data and isinstance(data["data"], list):
                    # Handle paginated response format
                    self.log_test("GET Exámenes", True, f"Retrieved {len(data['data'])} exams/procedures (paginated)")
                else:
                    self.log_test("GET Exámenes", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Exámenes", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Exámenes", False, f"GET error: {str(e)}")

        # Test POST /examenes-procedimientos (create)
        try:
            examen_data = {
                "tipo": "Examen",
                "nombre": "Hemograma Completo",
                "descripcion": "Análisis completo de sangre con conteo celular",
                "categoriaId": self.created_categoria_id,
                "duracionMinutos": 15,
                "costoBase": 50.00,
                "preparacionEspecial": "Ayuno de 8 horas",
                "requiereAyuno": True
            }
            
            response = requests.post(
                f"{self.base_url}/examenes-procedimientos",
                headers=self.headers,
                json=examen_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "item" in data.get("data", {}):
                    self.created_examen_id = data["data"]["item"]["id"]
                    self.log_test("POST Examen", True, f"Exam created with ID: {self.created_examen_id}")
                else:
                    self.log_test("POST Examen", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Examen", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Examen", False, f"POST error: {str(e)}")

        # Test GET /examenes-procedimientos/:id (get by ID)
        if self.created_examen_id:
            try:
                response = requests.get(
                    f"{self.base_url}/examenes-procedimientos/{self.created_examen_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "item" in data.get("data", {}):
                        self.log_test("GET Examen by ID", True, "Exam retrieved successfully")
                    else:
                        self.log_test("GET Examen by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Examen by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Examen by ID", False, f"GET by ID error: {str(e)}")

        # Test PUT /examenes-procedimientos/:id (update)
        if self.created_examen_id:
            try:
                update_data = {
                    "nombre": "Hemograma Completo Actualizado",
                    "costoBase": 60.00,
                    "duracionMinutos": 20
                }
                
                response = requests.put(
                    f"{self.base_url}/examenes-procedimientos/{self.created_examen_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "item" in data.get("data", {}):
                        self.log_test("PUT Examen", True, "Exam updated successfully")
                    else:
                        self.log_test("PUT Examen", False, f"Invalid response format: {data}")
                else:
                    self.log_test("PUT Examen", False, f"PUT failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("PUT Examen", False, f"PUT error: {str(e)}")

        # Test GET /examenes-procedimientos/estadisticas
        try:
            response = requests.get(
                f"{self.base_url}/examenes-procedimientos/estadisticas",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    stats = data["data"]
                    if "total" in stats and "totalExamenes" in stats:
                        self.log_test("GET Exámenes Stats", True, f"Stats: {stats['total']} total, {stats['totalExamenes']} exams, {stats.get('totalProcedimientos', 0)} procedures")
                    else:
                        self.log_test("GET Exámenes Stats", False, f"Invalid stats format: {stats}")
                else:
                    self.log_test("GET Exámenes Stats", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Exámenes Stats", False, f"Stats failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Exámenes Stats", False, f"Stats error: {str(e)}")

        # Test DELETE /examenes-procedimientos/:id (delete)
        if self.created_examen_id:
            try:
                response = requests.delete(
                    f"{self.base_url}/examenes-procedimientos/{self.created_examen_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_test("DELETE Examen", True, "Exam deleted successfully")
                    else:
                        self.log_test("DELETE Examen", False, f"Invalid response format: {data}")
                else:
                    self.log_test("DELETE Examen", False, f"DELETE failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("DELETE Examen", False, f"DELETE error: {str(e)}")

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️  Testing Error Handling...")
        
        # Test unauthorized access (without token)
        try:
            headers_no_auth = {"Content-Type": "application/json"}
            response = requests.get(
                f"{self.base_url}/categorias-examenes",
                headers=headers_no_auth,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test("Unauthorized Access", True, "Correctly rejected request without token")
            else:
                self.log_test("Unauthorized Access", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Unauthorized Access", False, f"Error testing unauthorized access: {str(e)}")

        # Test invalid data (missing required fields)
        try:
            invalid_data = {
                "descripcion": "Missing nombre field"
            }
            
            response = requests.post(
                f"{self.base_url}/categorias-examenes",
                headers=self.headers,
                json=invalid_data,
                timeout=10
            )
            
            if response.status_code >= 400:
                self.log_test("Invalid Data Handling", True, f"Correctly rejected invalid data with status {response.status_code}")
            else:
                self.log_test("Invalid Data Handling", False, f"Should have rejected invalid data, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Data Handling", False, f"Error testing invalid data: {str(e)}")

    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created category (this will also test DELETE endpoint)
        if self.created_categoria_id:
            try:
                response = requests.delete(
                    f"{self.base_url}/categorias-examenes/{self.created_categoria_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_test("DELETE Categoría", True, "Category deleted successfully")
                else:
                    self.log_test("DELETE Categoría", False, f"DELETE failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("DELETE Categoría", False, f"DELETE error: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests for Clínica Mía - Exámenes y Procedimientos Module")
        print("=" * 80)
        
        # Test sequence
        if not self.test_health_check():
            print("❌ Health check failed, aborting tests")
            return False
            
        if not self.authenticate():
            print("❌ Authentication failed, aborting tests")
            return False
            
        self.test_categorias_endpoints()
        self.test_examenes_endpoints()
        self.test_error_handling()
        self.cleanup()
        
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
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)