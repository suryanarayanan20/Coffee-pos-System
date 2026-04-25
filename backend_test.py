import requests
import sys
import json
from datetime import datetime

class CoffeePOSAPITester:
    def __init__(self, base_url="https://coffee-pos-backend.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.staff_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True)
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seed data creation"""
        print("\n🌱 Testing Seed Data...")
        success, response = self.run_test(
            "Seed Data Creation",
            "POST",
            "seed",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@surya.coffee", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            # Verify user data
            if response.get('user', {}).get('role') == 'admin':
                self.log_test("Admin Role Verification", True)
            else:
                self.log_test("Admin Role Verification", False, "Role mismatch")
            return True
        return False

    def test_staff_login(self):
        """Test staff login"""
        print("\n👤 Testing Staff Authentication...")
        success, response = self.run_test(
            "Staff Login",
            "POST",
            "auth/login",
            200,
            data={"email": "staff@surya.coffee", "password": "staff123"}
        )
        if success and 'token' in response:
            self.staff_token = response['token']
            # Verify user data
            if response.get('user', {}).get('role') == 'staff':
                self.log_test("Staff Role Verification", True)
            else:
                self.log_test("Staff Role Verification", False, "Role mismatch")
            return True
        return False

    def test_invalid_login(self):
        """Test invalid login credentials"""
        print("\n🚫 Testing Invalid Login...")
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )
        return success

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        print("\n👤 Testing Auth Me Endpoint...")
        if not self.admin_token:
            self.log_test("Auth Me Test", False, "No admin token available")
            return False
        
        success, response = self.run_test(
            "Auth Me - Admin",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )
        return success

    def test_products_api(self):
        """Test products API endpoints"""
        print("\n☕ Testing Products API...")
        
        # Get all products
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        if not success:
            return False
        
        products = response.get('products', [])
        if len(products) == 0:
            self.log_test("Products Count Check", False, "No products found")
            return False
        else:
            self.log_test("Products Count Check", True, f"Found {len(products)} products")
        
        # Test category filter
        success, response = self.run_test(
            "Filter Products by Coffee Category",
            "GET",
            "products?category=coffee",
            200
        )
        if success:
            coffee_products = response.get('products', [])
            self.log_test("Coffee Products Filter", len(coffee_products) > 0, f"Found {len(coffee_products)} coffee products")
        
        # Test search
        success, response = self.run_test(
            "Search Products",
            "GET",
            "products?search=espresso",
            200
        )
        if success:
            search_results = response.get('products', [])
            self.log_test("Product Search", len(search_results) > 0, f"Found {len(search_results)} results for 'espresso'")
        
        # Test get single product (if we have products)
        if products:
            product_id = products[0]['id']
            success, response = self.run_test(
                "Get Single Product",
                "GET",
                f"products/{product_id}",
                200
            )
        
        return True

    def test_admin_products_crud(self):
        """Test admin product CRUD operations"""
        print("\n🛠️ Testing Admin Products CRUD...")
        
        if not self.admin_token:
            self.log_test("Admin Products CRUD", False, "No admin token available")
            return False
        
        # Create a test product
        test_product = {
            "name": "Test Coffee",
            "price": 199.99,
            "category": "coffee",
            "description": "Test coffee for API testing",
            "available": True
        }
        
        success, response = self.run_test(
            "Create Product (Admin)",
            "POST",
            "products",
            200,
            data=test_product,
            token=self.admin_token
        )
        
        if not success:
            return False
        
        created_product = response
        product_id = created_product.get('id')
        
        if not product_id:
            self.log_test("Product Creation ID Check", False, "No product ID returned")
            return False
        
        # Update the product
        update_data = {
            "name": "Updated Test Coffee",
            "price": 249.99
        }
        
        success, response = self.run_test(
            "Update Product (Admin)",
            "PUT",
            f"products/{product_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        
        # Delete the product
        success, response = self.run_test(
            "Delete Product (Admin)",
            "DELETE",
            f"products/{product_id}",
            200,
            token=self.admin_token
        )
        
        return True

    def test_orders_api(self):
        """Test orders API"""
        print("\n📋 Testing Orders API...")
        
        if not self.staff_token:
            self.log_test("Orders API Test", False, "No staff token available")
            return False
        
        # Get existing orders
        success, response = self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200,
            token=self.staff_token
        )
        
        # Create a test order
        test_order = {
            "items": [
                {
                    "product_id": "test-product-id",
                    "name": "Test Coffee",
                    "price": 150.0,
                    "qty": 2
                }
            ],
            "customer_phone": "9876543210",
            "customer_name": "Test Customer",
            "payment_method": "cash"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=test_order,
            token=self.staff_token
        )
        
        if success:
            order = response
            # Verify tax calculation (12%)
            expected_subtotal = 300.0  # 150 * 2
            expected_tax = 36.0  # 300 * 0.12
            expected_total = 336.0
            
            if abs(order.get('subtotal', 0) - expected_subtotal) < 0.01:
                self.log_test("Order Subtotal Calculation", True)
            else:
                self.log_test("Order Subtotal Calculation", False, f"Expected {expected_subtotal}, got {order.get('subtotal')}")
            
            if abs(order.get('tax', 0) - expected_tax) < 0.01:
                self.log_test("Order Tax Calculation (12%)", True)
            else:
                self.log_test("Order Tax Calculation (12%)", False, f"Expected {expected_tax}, got {order.get('tax')}")
            
            if abs(order.get('total', 0) - expected_total) < 0.01:
                self.log_test("Order Total Calculation", True)
            else:
                self.log_test("Order Total Calculation", False, f"Expected {expected_total}, got {order.get('total')}")
            
            # Test get single order
            order_id = order.get('id')
            if order_id:
                success, response = self.run_test(
                    "Get Single Order",
                    "GET",
                    f"orders/{order_id}",
                    200,
                    token=self.staff_token
                )
        
        return True

    def test_customers_api(self):
        """Test customers API"""
        print("\n👥 Testing Customers API...")
        
        if not self.staff_token:
            self.log_test("Customers API Test", False, "No staff token available")
            return False
        
        # Get customers
        success, response = self.run_test(
            "Get Customers",
            "GET",
            "customers",
            200,
            token=self.staff_token
        )
        
        # Create a test customer
        test_customer = {
            "name": "Test Customer API",
            "phone": "9999888877",
            "email": "test@example.com"
        }
        
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=test_customer,
            token=self.staff_token
        )
        
        return True

    def test_dashboard_stats(self):
        """Test dashboard stats API"""
        print("\n📊 Testing Dashboard Stats...")
        
        if not self.admin_token:
            self.log_test("Dashboard Stats Test", False, "No admin token available")
            return False
        
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            token=self.admin_token
        )
        
        if success:
            stats = response
            required_fields = ['total_orders', 'today_orders', 'total_products', 'total_customers', 
                             'today_revenue', 'total_revenue', 'top_products', 'recent_orders']
            
            for field in required_fields:
                if field in stats:
                    self.log_test(f"Dashboard Stats - {field}", True)
                else:
                    self.log_test(f"Dashboard Stats - {field}", False, f"Missing field: {field}")
        
        return success

    def test_staff_admin_restrictions(self):
        """Test that staff cannot access admin-only endpoints"""
        print("\n🔒 Testing Staff Access Restrictions...")
        
        if not self.staff_token:
            self.log_test("Staff Restrictions Test", False, "No staff token available")
            return False
        
        # Staff should not be able to create products
        test_product = {
            "name": "Unauthorized Product",
            "price": 100.0,
            "category": "coffee",
            "description": "This should fail",
            "available": True
        }
        
        success, response = self.run_test(
            "Staff Create Product (Should Fail)",
            "POST",
            "products",
            403,  # Expecting forbidden
            data=test_product,
            token=self.staff_token
        )
        
        return success

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Coffee POS API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test sequence
        tests = [
            self.test_seed_data,
            self.test_admin_login,
            self.test_staff_login,
            self.test_invalid_login,
            self.test_auth_me,
            self.test_products_api,
            self.test_admin_products_crud,
            self.test_orders_api,
            self.test_customers_api,
            self.test_dashboard_stats,
            self.test_staff_admin_restrictions
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Return success if more than 80% tests pass
        return (self.tests_passed / self.tests_run) > 0.8 if self.tests_run > 0 else False

def main():
    tester = CoffeePOSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())