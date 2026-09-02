#!/usr/bin/env python3
"""
Test script to verify the orders API is working correctly.
"""

import requests
import json

API_BASE = "http://127.0.0.1:8000"
ADMIN_EMAIL = "adminbuybiz@gmail.com"
ADMIN_PASSWORD = "BuyBIBZyourAdmin737"

def test_orders_api():
    """Test the orders API endpoint."""
    
    # Login as admin
    print("1. Testing admin login...")
    login_response = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    print("✅ Admin login successful")
    token = login_response.json()["session"]["access_token"]
    
    # Test orders endpoint
    print("2. Testing orders API...")
    headers = {"Authorization": f"Bearer {token}"}
    orders_response = requests.get(f"{API_BASE}/api/orders", headers=headers)
    
    if orders_response.status_code != 200:
        print(f"❌ Orders API failed: {orders_response.status_code}")
        print(orders_response.text)
        return False
    
    orders_data = orders_response.json()
    print("✅ Orders API working")
    
    # Show orders data
    orders = orders_data.get("orders", [])
    print(f"📦 Found {len(orders)} order(s)")
    
    for i, order in enumerate(orders[:3]):  # Show first 3 orders
        print(f"   Order {i+1}:")
        print(f"     ID: {order['id']}")
        print(f"     UID: {order['order_uid']}")
        print(f"     Status: {order['status']}")
        print(f"     Total: ${order['total']}")
        print(f"     Items: {len(order.get('order_items', []))}")
        print("")
    
    return True

if __name__ == "__main__":
    print("Testing Orders API...")
    print("=" * 50)
    
    if test_orders_api():
        print("🎉 All tests passed! The orders API is working correctly.")
        print("\nTo test the frontend:")
        print("1. Go to http://localhost:5500")
        print("2. Click 'Login' and use:")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print("3. Navigate to 'My Orders' to see the test order")
    else:
        print("❌ Tests failed. Check the backend server and database connection.")