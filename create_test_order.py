#!/usr/bin/env python3
"""
Quick script to create a test order for debugging the orders page.
This bypasses the frontend and directly creates sample data in the database.
"""

import requests
import json

# Configuration
API_BASE = "http://127.0.0.1:8000"
ADMIN_EMAIL = "adminbuybiz@gmail.com"
ADMIN_PASSWORD = "BuyBIBZyourAdmin737"

def login_admin():
    """Login as admin and return the session token."""
    response = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None
    
    data = response.json()
    return data["session"]["access_token"]

def create_test_order(token):
    """Create a test order directly via the database."""
    headers = {"Authorization": f"Bearer {token}"}
    
    # First, get products to add to cart
    products_response = requests.get(f"{API_BASE}/api/products", headers=headers)
    if products_response.status_code != 200:
        print("Failed to get products")
        return
    
    products = products_response.json()["products"]
    if not products:
        print("No products available")
        return
    
    # Use the first product
    product = products[0]
    print(f"Using product: {product['name']} (ID: {product['id']})")
    
    # Add to cart
    cart_response = requests.post(f"{API_BASE}/api/cart", json={
        "product_id": product["id"],
        "quantity": 2,
        "selected_options": {}
    }, headers=headers)
    
    if cart_response.status_code != 200:
        print(f"Failed to add to cart: {cart_response.status_code}")
        print(cart_response.text)
        return
    
    print("Added product to cart")
    
    # Create order
    order_response = requests.post(f"{API_BASE}/api/orders", json={
        "shipping_name": "Test User",
        "shipping_address": "123 Test Street",
        "shipping_city": "Test City",
        "shipping_postal": "12345",
        "shipping_phone": "+1234567890",
        "notes": "Test order for debugging"
    }, headers=headers)
    
    if order_response.status_code != 200:
        print(f"Failed to create order: {order_response.status_code}")
        print(order_response.text)
        return
    
    order = order_response.json()
    print(f"Created test order: {order['order_uid']}")
    return order

def main():
    print("Creating test order...")
    
    # Login as admin
    token = login_admin()
    if not token:
        print("Failed to login as admin")
        return
    
    print("Logged in as admin successfully")
    
    # Create test order
    order = create_test_order(token)
    if order:
        print("Test order created successfully!")
        print(f"Order ID: {order.get('order_id')}")
        print(f"Order UID: {order.get('order_uid')}")
    else:
        print("Failed to create test order")

if __name__ == "__main__":
    main()