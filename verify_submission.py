#!/usr/bin/env python3
"""
Enhanced database verification script for customer registration testing.
Verifies that customers created by the Puppeteer automation script are properly stored in the database.
"""
import psycopg2
import sys
from datetime import datetime, timedelta
import json

def verify_submission(customer_id=None, minutes_back=2):
    """Verify customer submission in database"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='aisdb',
            user='akafay',
            password='akafay'
        )
        cur = conn.cursor()
        
        print("=" * 60)
        print("📊 DATABASE VERIFICATION REPORT")
        print("=" * 60)
        
        if customer_id:
            # Verify specific customer
            cur.execute('''
                SELECT * FROM customers 
                WHERE customer_id = %s
            ''', (customer_id,))
            row = cur.fetchone()
            
            if not row:
                print(f"❌ Customer {customer_id} NOT FOUND in database")
                return False
            
            # Get column names
            cur.execute('''
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'customers' 
                ORDER BY ordinal_position
            ''')
            columns = [col[0] for col in cur.fetchall()]
            
            # Create data dict
            customer_data = dict(zip(columns, row))
            
            print(f"✅ Customer Found: {customer_id}")
            print(f"   Created At: {customer_data.get('created_at')}")
            print(f"   Full Name: {customer_data.get('full_name')}")
            print("")
            
        else:
            # Find most recent customer created in last N minutes
            cur.execute('''
                SELECT customer_id, full_name, created_at
                FROM customers 
                WHERE created_at > NOW() - INTERVAL '%s minutes'
                ORDER BY created_at DESC
                LIMIT 1
            ''', (minutes_back,))
            
            recent = cur.fetchone()
            
            if not recent:
                print(f"⚠️  No customers created in the last {minutes_back} minutes")
                print("   Checking for AUTO_TEST customers...")
                
                cur.execute('''
                    SELECT customer_id, full_name, created_at
                    FROM customers 
                    WHERE customer_id LIKE 'AUTO_TEST%'
                    ORDER BY created_at DESC
                    LIMIT 1
                ''')
                auto_test = cur.fetchone()
                
                if auto_test:
                    customer_id, full_name, created_at = auto_test
                    print(f"✅ Found AUTO_TEST customer: {customer_id}")
                    print(f"   Full Name: {full_name}")
                    print(f"   Created At: {created_at}")
                    cur.execute('SELECT * FROM customers WHERE customer_id = %s', (customer_id,))
                    row = cur.fetchone()
                else:
                    print("❌ No AUTO_TEST customers found")
                    return False
            else:
                customer_id, full_name, created_at = recent
                print(f"✅ Most Recent Customer (last {minutes_back} minutes):")
                print(f"   Customer ID: {customer_id}")
                print(f"   Full Name: {full_name}")
                print(f"   Created At: {created_at}")
                print("")
                
                cur.execute('SELECT * FROM customers WHERE customer_id = %s', (customer_id,))
                row = cur.fetchone()
            
            # Get column names
            cur.execute('''
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'customers' 
                ORDER BY ordinal_position
            ''')
            columns = [col[0] for col in cur.fetchall()]
            
            # Create data dict
            customer_data = dict(zip(columns, row))
        
        # Analyze field completeness
        total_fields = len(columns)
        filled_fields = []
        empty_fields = []
        
        for col in columns:
            val = customer_data.get(col)
            if val is not None and val != '':
                filled_fields.append(col)
            else:
                empty_fields.append(col)
        
        filled_count = len(filled_fields)
        completeness = round((filled_count / total_fields) * 100, 1) if total_fields > 0 else 0
        
        print(f"📋 Field Completeness Analysis:")
        print(f"   Total Fields: {total_fields}")
        print(f"   Filled Fields: {filled_count}")
        print(f"   Empty Fields: {total_fields - filled_count}")
        print(f"   Completeness: {completeness}%")
        print("")
        
        # Show sample filled fields
        print(f"✅ Sample Filled Fields (first 20):")
        for field in filled_fields[:20]:
            value = customer_data.get(field)
            if isinstance(value, str) and len(value) > 50:
                value = value[:50] + "..."
            print(f"   - {field}: {value}")
        if len(filled_fields) > 20:
            print(f"   ... and {len(filled_fields) - 20} more")
        print("")
        
        # Show empty fields
        if empty_fields:
            print(f"⚠️  Empty Fields ({len(empty_fields)}):")
            for field in empty_fields[:15]:
                print(f"   - {field}")
            if len(empty_fields) > 15:
                print(f"   ... and {len(empty_fields) - 15} more")
            print("")
        
        # Check for key fields
        key_fields = ['customer_id', 'full_name', 'phone_number', 'id_number', 'email', 
                     'monthly_income', 'employment_status', 'region', 'city']
        missing_key_fields = [f for f in key_fields if f in empty_fields]
        
        if missing_key_fields:
            print(f"⚠️  Missing Key Fields: {', '.join(missing_key_fields)}")
        else:
            print("✅ All key fields are present")
        
        print("=" * 60)
        
        cur.close()
        conn.close()
        
        return {
            'customer_id': customer_id,
            'completeness': completeness,
            'filled_count': filled_count,
            'total_fields': total_fields,
            'missing_key_fields': missing_key_fields
        }
        
    except Exception as e:
        print(f"❌ Database verification error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    # Check if customer_id provided as argument
    customer_id = sys.argv[1] if len(sys.argv) > 1 else None
    minutes_back = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    
    result = verify_submission(customer_id, minutes_back)
    
    if result:
        sys.exit(0)
    else:
        sys.exit(1)

