#!/usr/bin/env python3
"""
Backend API Testing for Clínica Mía - Laboratory Module
Tests the Laboratory workflow: Order Creation -> Results Entry -> Completion
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:4000"
TEST_USER = {
    "email": "admin@clinicamia.com",
    "password": "admin123"
}

class LaboratoryBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.test_results = []
        self.test_data = {}
        self.created_order_id = None

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

    def setup_test_data(self):
        """Fetch necessary data (Patient, Doctor, Exam) for testing"""
        print("\n📋 Setting up Test Data...")
        
        try:
            # 1. Get Patient
            response = requests.get(f"{self.base_url}/pacientes?limit=1", headers=self.headers)
            if response.status_code == 200 and response.json().get("data"):
                self.test_data["paciente_id"] = response.json()["data"][0]["id"]
                self.log_test("Setup Patient", True, f"Found patient: {self.test_data['paciente_id']}")
            else:
                self.log_test("Setup Patient", False, "No patients found")
                return False

            # 2. Get Doctor
            response = requests.get(f"{self.base_url}/doctores", headers=self.headers)
            if response.status_code == 200 and response.json().get("data"):
                # Handle potential structure difference
                docs = response.json()["data"]
                if isinstance(docs, dict) and "doctores" in docs: docs = docs["doctores"]
                
                if docs:
                    self.test_data["doctor_id"] = docs[0]["usuarioId"] # Use linked user ID usually required
                    self.log_test("Setup Doctor", True, f"Found doctor: {self.test_data['doctor_id']}")
                else:
                    self.log_test("Setup Doctor", False, "No doctors found")
                    return False
            else:
                self.log_test("Setup Doctor", False, "Failed to fetch doctors")
                return False

            # 3. Get Exam
            response = requests.get(f"{self.base_url}/examenes-procedimientos?limit=1", headers=self.headers)
            if response.status_code == 200 and response.json().get("data"):
                exam = response.json()["data"][0]
                self.test_data["examen_id"] = exam["id"]
                self.test_data["precio"] = exam.get("costoBase", 0)
                self.log_test("Setup Exam", True, f"Found exam: {exam['nombre']}")
            else:
                self.log_test("Setup Exam", False, "No exams found")
                return False

            return True

        except Exception as e:
            self.log_test("Setup Data", False, f"Error setting up data: {str(e)}")
            return False

    def test_create_order(self):
        """Test creating a lab order"""
        print("\n🧪 Testing Create Order...")
        
        try:
            order_data = {
                "paciente_id": self.test_data["paciente_id"],
                "doctor_id": self.test_data["doctor_id"],
                "examen_procedimiento_id": self.test_data["examen_id"],
                "prioridad": "Urgente",
                "observaciones": "Test order from automated script",
                "precio_aplicado": self.test_data["precio"]
            }
            
            response = requests.post(
                f"{self.base_url}/ordenes-medicas",
                headers=self.headers,
                json=order_data
            )
            
            if response.status_code == 201:
                data = response.json()
                self.created_order_id = data["data"]["orden"]["id"]
                self.log_test("Create Order", True, f"Order created: {self.created_order_id}")
                return True
            else:
                self.log_test("Create Order", False, f"Failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Order", False, f"Error: {str(e)}")
            return False

    def test_complete_order(self):
        """Test completing order with results"""
        print("\n✅ Testing Complete Order (Enter Results)...")
        
        if not self.created_order_id:
            self.log_test("Complete Order", False, "Skipped - No order created")
            return False
            
        try:
            results_data = {
                "resultados": {
                    "Hemoglobina": {
                        "valor": "14.5",
                        "unidad": "g/dL",
                        "referencia": "12-16",
                        "estado": "Normal"
                    },
                    "Leucocitos": {
                        "valor": "7500",
                        "unidad": "/mm3",
                        "referencia": "4500-11000",
                        "estado": "Normal"
                    }
                }
            }
            
            response = requests.post(
                f"{self.base_url}/ordenes-medicas/{self.created_order_id}/completar",
                headers=self.headers,
                json=results_data
            )
            
            if response.status_code == 200:
                self.log_test("Complete Order", True, "Order completed successfully")
                
                # Verify status and results
                verify_response = requests.get(
                    f"{self.base_url}/ordenes-medicas/{self.created_order_id}",
                    headers=self.headers
                )
                
                if verify_response.status_code == 200:
                    order = verify_response.json()["data"]["orden"]
                    if order["estado"] == "Completada" and "Hemoglobina" in order["resultados"]:
                        self.log_test("Verify Results", True, "Order status is 'Completada' and results persisted")
                        return True
                    else:
                        self.log_test("Verify Results", False, f"Verification failed. Status: {order['estado']}, Results: {order['resultados']}")
                        return False
            else:
                self.log_test("Complete Order", False, f"Failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Complete Order", False, f"Error: {str(e)}")
            return False

    def cleanup(self):
        """Delete created order"""
        print("\n🧹 Cleanup...")
        if self.created_order_id:
            try:
                requests.delete(f"{self.base_url}/ordenes-medicas/{self.created_order_id}", headers=self.headers)
                print("Deleted test order")
            except:
                pass

    def run(self):
        if self.authenticate() and self.setup_test_data():
            self.test_create_order()
            self.test_complete_order()
        self.cleanup()

if __name__ == "__main__":
    LaboratoryBackendTester().run()
