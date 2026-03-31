#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime, timedelta

class OrderlyAPITester:
    def __init__(self, base_url="https://order-sync-dev.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.customers = []
        self.orders = []
        self.reminders = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            self.log(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test authentication endpoints"""
        self.log("\n=== TESTING AUTHENTICATION ===")
        
        # Test login with admin credentials
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@orderly.com", "password": "admin123"}
        )
        
        if success:
            self.user_data = response
            self.log(f"   Logged in as: {response.get('name')} ({response.get('email')})")
        else:
            self.log("❌ Login failed - cannot continue with authenticated tests")
            return False

        # Test /auth/me endpoint
        success, response = self.run_test(
            "Get Current User",
            "GET", 
            "auth/me",
            200
        )

        if success:
            self.log(f"   User info: {response.get('name')} - {response.get('role')}")

        return True

    def test_dashboard(self):
        """Test dashboard endpoint"""
        self.log("\n=== TESTING DASHBOARD ===")
        
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard",
            200
        )
        
        if success:
            stats = response
            self.log(f"   Total Customers: {stats.get('total_customers', 0)}")
            self.log(f"   Total Orders: {stats.get('total_orders', 0)}")
            self.log(f"   Revenue: ${stats.get('total_revenue', 0)}")
            self.log(f"   Reminders Today: {stats.get('reminders_today', 0)}")
            self.log(f"   Recent Orders: {len(stats.get('recent_orders', []))}")
            self.log(f"   Today Reminders: {len(stats.get('today_reminders', []))}")

        return success

    def test_customers_crud(self):
        """Test customer CRUD operations"""
        self.log("\n=== TESTING CUSTOMERS CRUD ===")
        
        # List existing customers
        success, response = self.run_test(
            "List Customers",
            "GET",
            "customers",
            200
        )
        
        if success:
            self.customers = response
            self.log(f"   Found {len(self.customers)} existing customers")

        # Create new customer
        test_customer = {
            "name": "Test Customer",
            "phone": "+91 99999 88888",
            "notes": "Test customer for API testing",
            "tags": ["Test", "API"]
        }
        
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=test_customer
        )
        
        if success:
            new_customer = response
            self.log(f"   Created customer: {new_customer.get('name')} (ID: {new_customer.get('id')})")
            
            # Update customer
            update_data = {"notes": "Updated notes for testing"}
            success, response = self.run_test(
                "Update Customer",
                "PUT",
                f"customers/{new_customer['id']}",
                200,
                data=update_data
            )
            
            if success:
                self.log(f"   Updated customer notes")
            
            # Delete customer
            success, response = self.run_test(
                "Delete Customer",
                "DELETE",
                f"customers/{new_customer['id']}",
                200
            )
            
            if success:
                self.log(f"   Deleted test customer")

        return True

    def test_orders_crud(self):
        """Test order CRUD operations"""
        self.log("\n=== TESTING ORDERS CRUD ===")
        
        # List existing orders
        success, response = self.run_test(
            "List Orders",
            "GET",
            "orders",
            200
        )
        
        if success:
            self.orders = response
            self.log(f"   Found {len(self.orders)} existing orders")

        # Need a customer to create order
        if not self.customers:
            self.log("   No customers available for order testing")
            return False

        customer_id = self.customers[0]['id']
        
        # Create new order
        test_order = {
            "customer_id": customer_id,
            "product_name": "Test Product",
            "amount": 99.99,
            "status": "New"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=test_order
        )
        
        if success:
            new_order = response
            self.log(f"   Created order: {new_order.get('product_name')} - ${new_order.get('amount')}")
            
            # Update order status
            update_data = {"status": "Paid"}
            success, response = self.run_test(
                "Update Order",
                "PUT",
                f"orders/{new_order['id']}",
                200,
                data=update_data
            )
            
            if success:
                self.log(f"   Updated order status to Paid")
            
            # Delete order
            success, response = self.run_test(
                "Delete Order",
                "DELETE",
                f"orders/{new_order['id']}",
                200
            )
            
            if success:
                self.log(f"   Deleted test order")

        return True

    def test_reminders_crud(self):
        """Test reminder CRUD operations"""
        self.log("\n=== TESTING REMINDERS CRUD ===")
        
        # List existing reminders
        success, response = self.run_test(
            "List Reminders",
            "GET",
            "reminders",
            200
        )
        
        if success:
            self.reminders = response
            self.log(f"   Found {len(self.reminders)} existing reminders")

        # Test due today filter
        success, response = self.run_test(
            "List Due Today Reminders",
            "GET",
            "reminders?due_today=true",
            200
        )
        
        if success:
            due_today = response
            self.log(f"   Found {len(due_today)} reminders due today")

        # Need a customer to create reminder
        if not self.customers:
            self.log("   No customers available for reminder testing")
            return False

        customer_id = self.customers[0]['id']
        
        # Create new reminder
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00")
        test_reminder = {
            "customer_id": customer_id,
            "date_time": tomorrow,
            "note": "Test reminder for API testing"
        }
        
        success, response = self.run_test(
            "Create Reminder",
            "POST",
            "reminders",
            200,
            data=test_reminder
        )
        
        if success:
            new_reminder = response
            self.log(f"   Created reminder: {new_reminder.get('note')}")
            
            # Update reminder
            update_data = {"note": "Updated test reminder"}
            success, response = self.run_test(
                "Update Reminder",
                "PUT",
                f"reminders/{new_reminder['id']}",
                200,
                data=update_data
            )
            
            if success:
                self.log(f"   Updated reminder note")
            
            # Delete reminder
            success, response = self.run_test(
                "Delete Reminder",
                "DELETE",
                f"reminders/{new_reminder['id']}",
                200
            )
            
            if success:
                self.log(f"   Deleted test reminder")

        return True

    def test_logout(self):
        """Test logout"""
        self.log("\n=== TESTING LOGOUT ===")
        
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        
        if success:
            self.log("   Successfully logged out")
            
            # Verify we can't access protected endpoints
            success, response = self.run_test(
                "Access Protected After Logout",
                "GET",
                "dashboard",
                401
            )
            
            if success:
                self.log("   Confirmed: Cannot access protected endpoints after logout")

        return success

def main():
    print("🚀 Starting Orderly API Tests")
    print("=" * 50)
    
    tester = OrderlyAPITester()
    
    # Run all tests
    auth_success = tester.test_auth_flow()
    if not auth_success:
        print("\n❌ Authentication failed - stopping tests")
        return 1
    
    tester.test_dashboard()
    tester.test_customers_crud()
    tester.test_orders_crud() 
    tester.test_reminders_crud()
    tester.test_logout()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())