#!/usr/bin/env python3
"""
Backend API Testing for Clínica Mía - Pharmacy Module
Tests the Hono.js backend endpoints for Pharmacy Products, Categories, and Labels
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:4000"
TEST_USER = {
    "email": "admin@clinica.com",
    "password": "admin123"
}

class PharmacyBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.test_results = []
        self.created_categoria_id = None
        self.created_etiqueta_id = None
        self.created_producto_id = None

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

    def test_categorias_productos_endpoints(self):
        """Test all Product Categories endpoints"""
        print("\n📦 Testing Categorías de Productos Endpoints...")
        
        # Test GET /categorias-productos (list)
        try:
            response = requests.get(
                f"{self.base_url}/categorias-productos",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    categories = data["data"]
                    self.log_test("GET Categorías Productos", True, f"Retrieved {len(categories)} product categories")
                else:
                    self.log_test("GET Categorías Productos", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Categorías Productos", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Categorías Productos", False, f"GET error: {str(e)}")

        # Test POST /categorias-productos (create)
        try:
            categoria_data = {
                "nombre": "Analgésicos",
                "descripcion": "Medicamentos para alivio del dolor",
                "color": "#10b981"
            }
            
            response = requests.post(
                f"{self.base_url}/categorias-productos",
                headers=self.headers,
                json=categoria_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "data" in data:
                    self.created_categoria_id = data["data"]["id"]
                    self.log_test("POST Categoría Producto", True, f"Category created with ID: {self.created_categoria_id}")
                else:
                    self.log_test("POST Categoría Producto", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Categoría Producto", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Categoría Producto", False, f"POST error: {str(e)}")

        # Test GET /categorias-productos/:id (get by ID)
        if self.created_categoria_id:
            try:
                response = requests.get(
                    f"{self.base_url}/categorias-productos/{self.created_categoria_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        self.log_test("GET Categoría Producto by ID", True, "Category retrieved successfully")
                    else:
                        self.log_test("GET Categoría Producto by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Categoría Producto by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Categoría Producto by ID", False, f"GET by ID error: {str(e)}")

        # Test PUT /categorias-productos/:id (update)
        if self.created_categoria_id:
            try:
                update_data = {
                    "nombre": "Analgésicos Actualizados",
                    "descripcion": "Medicamentos para alivio del dolor - Actualizado",
                    "color": "#059669"
                }
                
                response = requests.put(
                    f"{self.base_url}/categorias-productos/{self.created_categoria_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        self.log_test("PUT Categoría Producto", True, "Category updated successfully")
                    else:
                        self.log_test("PUT Categoría Producto", False, f"Invalid response format: {data}")
                else:
                    self.log_test("PUT Categoría Producto", False, f"PUT failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("PUT Categoría Producto", False, f"PUT error: {str(e)}")

    def test_etiquetas_productos_endpoints(self):
        """Test all Product Labels endpoints"""
        print("\n🏷️  Testing Etiquetas de Productos Endpoints...")
        
        # Test GET /etiquetas-productos (list)
        try:
            response = requests.get(
                f"{self.base_url}/etiquetas-productos",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    labels = data["data"]
                    self.log_test("GET Etiquetas Productos", True, f"Retrieved {len(labels)} product labels")
                else:
                    self.log_test("GET Etiquetas Productos", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Etiquetas Productos", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Etiquetas Productos", False, f"GET error: {str(e)}")

        # Test POST /etiquetas-productos (create)
        try:
            etiqueta_data = {
                "nombre": "Controlado",
                "color": "#ef4444"
            }
            
            response = requests.post(
                f"{self.base_url}/etiquetas-productos",
                headers=self.headers,
                json=etiqueta_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and "data" in data:
                    self.created_etiqueta_id = data["data"]["id"]
                    self.log_test("POST Etiqueta Producto", True, f"Label created with ID: {self.created_etiqueta_id}")
                else:
                    self.log_test("POST Etiqueta Producto", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST Etiqueta Producto", False, f"POST failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST Etiqueta Producto", False, f"POST error: {str(e)}")

        # Test GET /etiquetas-productos/:id (get by ID)
        if self.created_etiqueta_id:
            try:
                response = requests.get(
                    f"{self.base_url}/etiquetas-productos/{self.created_etiqueta_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        self.log_test("GET Etiqueta Producto by ID", True, "Label retrieved successfully")
                    else:
                        self.log_test("GET Etiqueta Producto by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Etiqueta Producto by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Etiqueta Producto by ID", False, f"GET by ID error: {str(e)}")

        # Test PUT /etiquetas-productos/:id (update)
        if self.created_etiqueta_id:
            try:
                update_data = {
                    "nombre": "Controlado Actualizado",
                    "color": "#dc2626"
                }
                
                response = requests.put(
                    f"{self.base_url}/etiquetas-productos/{self.created_etiqueta_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        self.log_test("PUT Etiqueta Producto", True, "Label updated successfully")
                    else:
                        self.log_test("PUT Etiqueta Producto", False, f"Invalid response format: {data}")
                else:
                    self.log_test("PUT Etiqueta Producto", False, f"PUT failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("PUT Etiqueta Producto", False, f"PUT error: {str(e)}")

    def test_productos_endpoints(self):
        """Test all Products endpoints"""
        print("\n💊 Testing Productos Farmacéuticos Endpoints...")
        
        # Test GET /productos (list)
        try:
            response = requests.get(
                f"{self.base_url}/productos",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    products = data["data"]
                    self.log_test("GET Productos", True, f"Retrieved {len(products)} pharmaceutical products")
                else:
                    self.log_test("GET Productos", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Productos", False, f"GET failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Productos", False, f"GET error: {str(e)}")

        # Test GET /productos/stats (statistics)
        try:
            response = requests.get(
                f"{self.base_url}/productos/stats",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    stats = data["data"]
                    self.log_test("GET Productos Stats", True, f"Stats: {stats.get('total', 0)} total, {stats.get('activos', 0)} active, ${stats.get('valorInventario', 0)} inventory value")
                else:
                    self.log_test("GET Productos Stats", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET Productos Stats", False, f"Stats failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET Productos Stats", False, f"Stats error: {str(e)}")

        # Test POST /productos (create)
        if self.created_categoria_id:
            try:
                # Calculate future expiration date
                future_date = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
                
                producto_data = {
                    "nombre": "Acetaminofén 500mg",
                    "categoriaId": self.created_categoria_id,
                    "sku": f"ACE500-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "laboratorio": "Laboratorios Genfar",
                    "descripcion": "Analgésico y antipirético para alivio del dolor",
                    "principioActivo": "Acetaminofén",
                    "concentracion": "500mg",
                    "viaAdministracion": "Oral",
                    "presentacion": "Tableta",
                    "registroSanitario": "INVIMA-2024-001",
                    "temperaturaAlmacenamiento": "Temperatura ambiente (15-30°C)",
                    "requiereReceta": False,
                    "cantidadTotal": 100,
                    "cantidadConsumida": 0,
                    "cantidadMinAlerta": 20,
                    "lote": "LOT12345",
                    "fechaVencimiento": future_date,
                    "precioVenta": 5000.00,
                    "precioCompra": 3500.00,
                    "activo": True,
                    "etiquetasIds": [self.created_etiqueta_id] if self.created_etiqueta_id else []
                }
                
                response = requests.post(
                    f"{self.base_url}/productos",
                    headers=self.headers,
                    json=producto_data,
                    timeout=10
                )
                
                if response.status_code == 201:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        self.created_producto_id = data["data"]["id"]
                        self.log_test("POST Producto", True, f"Product created with ID: {self.created_producto_id}")
                    else:
                        self.log_test("POST Producto", False, f"Invalid response format: {data}")
                else:
                    self.log_test("POST Producto", False, f"POST failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("POST Producto", False, f"POST error: {str(e)}")

        # Test GET /productos/:id (get by ID)
        if self.created_producto_id:
            try:
                response = requests.get(
                    f"{self.base_url}/productos/{self.created_producto_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        product = data["data"]
                        self.log_test("GET Producto by ID", True, f"Product retrieved: {product.get('nombre', 'Unknown')}")
                    else:
                        self.log_test("GET Producto by ID", False, f"Invalid response format: {data}")
                else:
                    self.log_test("GET Producto by ID", False, f"GET by ID failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("GET Producto by ID", False, f"GET by ID error: {str(e)}")

        # Test PUT /productos/:id (update)
        if self.created_producto_id:
            try:
                update_data = {
                    "nombre": "Acetaminofén 500mg - Actualizado",
                    "descripcion": "Analgésico y antipirético para alivio del dolor - Versión actualizada",
                    "precioVenta": 5500.00,
                    "cantidadTotal": 150
                }
                
                response = requests.put(
                    f"{self.base_url}/productos/{self.created_producto_id}",
                    headers=self.headers,
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        self.log_test("PUT Producto", True, "Product updated successfully")
                    else:
                        self.log_test("PUT Producto", False, f"Invalid response format: {data}")
                else:
                    self.log_test("PUT Producto", False, f"PUT failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("PUT Producto", False, f"PUT error: {str(e)}")

    def test_search_and_filters(self):
        """Test search and filter functionality"""
        print("\n🔍 Testing Search and Filter Functionality...")
        
        # Test product search
        try:
            response = requests.get(
                f"{self.base_url}/productos?search=Acetaminofén",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    products = data["data"]
                    self.log_test("Product Search", True, f"Search returned {len(products)} products")
                else:
                    self.log_test("Product Search", False, f"Invalid response format: {data}")
            else:
                self.log_test("Product Search", False, f"Search failed with status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Product Search", False, f"Search error: {str(e)}")

        # Test category filter
        if self.created_categoria_id:
            try:
                response = requests.get(
                    f"{self.base_url}/productos?categoriaId={self.created_categoria_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        products = data["data"]
                        self.log_test("Category Filter", True, f"Category filter returned {len(products)} products")
                    else:
                        self.log_test("Category Filter", False, f"Invalid response format: {data}")
                else:
                    self.log_test("Category Filter", False, f"Filter failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("Category Filter", False, f"Filter error: {str(e)}")

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️  Testing Error Handling...")
        
        # Test unauthorized access (without token)
        try:
            headers_no_auth = {"Content-Type": "application/json"}
            response = requests.get(
                f"{self.base_url}/categorias-productos",
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
                f"{self.base_url}/categorias-productos",
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

        # Test non-existent resource
        try:
            response = requests.get(
                f"{self.base_url}/productos/non-existent-id",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 404 or response.status_code >= 400:
                self.log_test("Non-existent Resource", True, f"Correctly handled non-existent resource with status {response.status_code}")
            else:
                self.log_test("Non-existent Resource", False, f"Should have returned error for non-existent resource, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Non-existent Resource", False, f"Error testing non-existent resource: {str(e)}")

    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created product
        if self.created_producto_id:
            try:
                response = requests.delete(
                    f"{self.base_url}/productos/{self.created_producto_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_test("DELETE Producto", True, "Product deleted successfully")
                else:
                    self.log_test("DELETE Producto", False, f"DELETE failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("DELETE Producto", False, f"DELETE error: {str(e)}")

        # Delete created label
        if self.created_etiqueta_id:
            try:
                response = requests.delete(
                    f"{self.base_url}/etiquetas-productos/{self.created_etiqueta_id}",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_test("DELETE Etiqueta", True, "Label deleted successfully")
                else:
                    self.log_test("DELETE Etiqueta", False, f"DELETE failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("DELETE Etiqueta", False, f"DELETE error: {str(e)}")

        # Delete created category
        if self.created_categoria_id:
            try:
                response = requests.delete(
                    f"{self.base_url}/categorias-productos/{self.created_categoria_id}",
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
        print("🚀 Starting Backend API Tests for Clínica Mía - Pharmacy Module")
        print("=" * 80)
        
        # Test sequence
        if not self.test_health_check():
            print("❌ Health check failed, aborting tests")
            return False
            
        if not self.authenticate():
            print("❌ Authentication failed, aborting tests")
            return False
            
        self.test_categorias_productos_endpoints()
        self.test_etiquetas_productos_endpoints()
        self.test_productos_endpoints()
        self.test_search_and_filters()
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
    tester = PharmacyBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)