#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for CaseSage Legal Case Summarization Engine
Tests all endpoints: auth, upload, summarization, citations, search, feedback
"""

import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path

class CaseSageAPITester:
    def __init__(self, base_url="https://casesage.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.document_id = None
        
        # Test user credentials
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "full_name": f"Test User {timestamp}"
        }

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details and success:
            print(f"   Details: {details}")

    def make_request(self, method, endpoint, data=None, files=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            return success, response
            
        except Exception as e:
            return False, str(e)

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, response = self.make_request('GET', '/')
        if success:
            data = response.json()
            self.log_test("Root endpoint", True, f"Status: {data.get('status', 'N/A')}")
        else:
            self.log_test("Root endpoint", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        
        # Test health endpoint
        success, response = self.make_request('GET', '/health')
        if success:
            data = response.json()
            self.log_test("Health check", True, f"Status: {data.get('status', 'N/A')}")
        else:
            self.log_test("Health check", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        success, response = self.make_request('POST', '/auth/register', self.test_user, expected_status=200)
        
        if success:
            data = response.json()
            self.token = data.get('access_token')
            self.user_data = data.get('user')
            self.log_test("User registration", True, f"User: {self.user_data.get('email', 'N/A')}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
            self.log_test("User registration", False, error_msg)

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        success, response = self.make_request('POST', '/auth/login', login_data, expected_status=200)
        
        if success:
            data = response.json()
            self.token = data.get('access_token')
            self.user_data = data.get('user')
            self.log_test("User login", True, f"Token received: {bool(self.token)}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
            self.log_test("User login", False, error_msg)

    def test_get_user_profile(self):
        """Test getting current user profile"""
        print("\n🔍 Testing User Profile...")
        
        if not self.token:
            self.log_test("Get user profile", False, "No authentication token")
            return
        
        success, response = self.make_request('GET', '/auth/me', expected_status=200)
        
        if success:
            data = response.json()
            self.log_test("Get user profile", True, f"Email: {data.get('email', 'N/A')}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
            self.log_test("Get user profile", False, error_msg)

    def test_document_upload(self):
        """Test document upload with sample legal case"""
        print("\n🔍 Testing Document Upload...")
        
        if not self.token:
            self.log_test("Document upload", False, "No authentication token")
            return
        
        # Use the sample legal case file
        sample_file_path = Path("/app/backend/sample_legal_case.txt")
        
        if not sample_file_path.exists():
            self.log_test("Document upload", False, "Sample file not found")
            return
        
        try:
            with open(sample_file_path, 'rb') as f:
                files = {'file': ('sample_legal_case.txt', f, 'text/plain')}
                success, response = self.make_request('POST', '/upload', files=files, expected_status=200)
            
            if success:
                data = response.json()
                self.document_id = data.get('document_id')
                extracted_length = len(data.get('extracted_text', ''))
                self.log_test("Document upload", True, f"Document ID: {self.document_id}, Text length: {extracted_length}")
            else:
                error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
                self.log_test("Document upload", False, error_msg)
                
        except Exception as e:
            self.log_test("Document upload", False, str(e))

    def test_document_summarization(self):
        """Test AI-powered document summarization"""
        print("\n🔍 Testing Document Summarization...")
        
        if not self.token or not self.document_id:
            self.log_test("Document summarization", False, "No token or document ID")
            return
        
        # Test different summary types
        summary_types = ['executive', 'detailed', 'risk-focused']
        
        for summary_type in summary_types:
            print(f"  Testing {summary_type} summary...")
            
            summary_data = {
                "document_id": self.document_id,
                "summary_type": summary_type
            }
            
            success, response = self.make_request('POST', '/summarize', summary_data, expected_status=200)
            
            if success:
                data = response.json()
                facts_length = len(data.get('facts', ''))
                issues_length = len(data.get('issues', ''))
                arguments_length = len(data.get('arguments', ''))
                verdict_length = len(data.get('verdict', ''))
                citations_count = len(data.get('citations', []))
                timeline_count = len(data.get('timeline', []))
                
                self.log_test(f"Summarization ({summary_type})", True, 
                            f"Facts: {facts_length}chars, Issues: {issues_length}chars, "
                            f"Arguments: {arguments_length}chars, Verdict: {verdict_length}chars, "
                            f"Citations: {citations_count}, Timeline: {timeline_count}")
            else:
                error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
                self.log_test(f"Summarization ({summary_type})", False, error_msg)

    def test_citation_detection(self):
        """Test citation detection endpoint"""
        print("\n🔍 Testing Citation Detection...")
        
        if not self.token or not self.document_id:
            self.log_test("Citation detection", False, "No token or document ID")
            return
        
        success, response = self.make_request('GET', f'/citations/{self.document_id}', expected_status=200)
        
        if success:
            data = response.json()
            citations_count = len(data.get('citations', []))
            self.log_test("Citation detection", True, f"Found {citations_count} citations")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
            self.log_test("Citation detection", False, error_msg)

    def test_case_search(self):
        """Test semantic case search"""
        print("\n🔍 Testing Case Search...")
        
        if not self.token:
            self.log_test("Case search", False, "No authentication token")
            return
        
        search_queries = [
            "contract breach force majeure",
            "COVID-19 pandemic construction delay",
            "bank guarantee forfeiture"
        ]
        
        for query in search_queries:
            print(f"  Searching for: {query}")
            
            search_data = {
                "query": query,
                "top_k": 3
            }
            
            success, response = self.make_request('POST', '/search', search_data, expected_status=200)
            
            if success:
                data = response.json()
                cases_count = len(data.get('cases', []))
                self.log_test(f"Search: '{query[:30]}...'", True, f"Found {cases_count} cases")
            else:
                error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
                self.log_test(f"Search: '{query[:30]}...'", False, error_msg)

    def test_feedback_submission(self):
        """Test feedback submission"""
        print("\n🔍 Testing Feedback Submission...")
        
        if not self.token or not self.document_id:
            self.log_test("Feedback submission", False, "No token or document ID")
            return
        
        # Test positive feedback
        feedback_data = {
            "document_id": self.document_id,
            "rating": 5,
            "comment": "Excellent summary quality and accuracy!"
        }
        
        success, response = self.make_request('POST', '/feedback', feedback_data, expected_status=200)
        
        if success:
            data = response.json()
            self.log_test("Feedback submission (positive)", True, data.get('message', 'Success'))
        else:
            error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
            self.log_test("Feedback submission (positive)", False, error_msg)
        
        # Test negative feedback
        feedback_data = {
            "document_id": self.document_id,
            "rating": 1,
            "comment": "Summary could be more detailed"
        }
        
        success, response = self.make_request('POST', '/feedback', feedback_data, expected_status=200)
        
        if success:
            data = response.json()
            self.log_test("Feedback submission (negative)", True, data.get('message', 'Success'))
        else:
            error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
            self.log_test("Feedback submission (negative)", False, error_msg)

    def test_get_user_documents(self):
        """Test getting user documents"""
        print("\n🔍 Testing Get User Documents...")
        
        if not self.token:
            self.log_test("Get user documents", False, "No authentication token")
            return
        
        success, response = self.make_request('GET', '/documents', expected_status=200)
        
        if success:
            data = response.json()
            documents_count = len(data.get('documents', []))
            self.log_test("Get user documents", True, f"Found {documents_count} documents")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if hasattr(response, 'json') else str(response)
            self.log_test("Get user documents", False, error_msg)

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting CaseSage Backend API Testing...")
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        
        # Test sequence
        self.test_health_check()
        self.test_user_registration()
        self.test_user_login()
        self.test_get_user_profile()
        self.test_document_upload()
        self.test_document_summarization()
        self.test_citation_detection()
        self.test_case_search()
        self.test_feedback_submission()
        self.test_get_user_documents()
        
        # Print final results
        print(f"\n📊 Test Results Summary:")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = CaseSageAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())