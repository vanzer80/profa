#!/usr/bin/env python3
"""
Comprehensive Backend Testing for ProfAI Educational AI Assistant
Tests all critical backend functionality including authentication, chat, profiles, and dashboard
"""

import requests
import json
import time
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Load backend URL from frontend .env
def load_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = load_backend_url()
API_URL = f"{BASE_URL}/api"

class ProfAITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.conversation_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, files: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{API_URL}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
            
        if headers:
            request_headers.update(headers)
            
        if files:
            # Remove content-type for file uploads
            request_headers.pop("Content-Type", None)
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == "POST":
                if files:
                    response = self.session.post(url, data=data, files=files, headers=request_headers)
                else:
                    response = self.session.post(url, json=data, headers=request_headers)
            elif method.upper() == "PUT":
                if files:
                    response = self.session.put(url, data=data, files=files, headers=request_headers)
                else:
                    response = self.session.put(url, json=data, headers=request_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            raise

    def test_health_check(self):
        """Test basic health check endpoint"""
        try:
            response = self.make_request("GET", "/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Server is healthy, timestamp: {data.get('timestamp')}", data)
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            # Use a unique timestamp to avoid duplicate registrations
            timestamp = int(time.time())
            user_data = {
                "email": f"joao.santos{timestamp}@escola.com",
                "username": f"joao_santos_{timestamp}",
                "password": "MinhaSenh@123",
                "full_name": "João Santos Silva",
                "grade": "7º EF",
                "school": "Escola Municipal João da Silva",
                "ai_style": "paciente"
            }
            
            response = self.make_request("POST", "/auth/register", user_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user_id" in data:
                    self.auth_token = data["access_token"]
                    self.user_id = data["user_id"]
                    self.log_test("User Registration", True, f"User registered successfully, ID: {self.user_id}", data)
                else:
                    self.log_test("User Registration", False, "Missing access_token or user_id in response", data)
            else:
                error_msg = response.text
                self.log_test("User Registration", False, f"Status: {response.status_code}, Error: {error_msg}")
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")

    def test_user_login(self):
        """Test user login endpoint"""
        try:
            login_data = {
                "email": "maria.silva@escola.com",
                "password": "MinhaSenh@123"
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    self.user_id = data.get("user_id")
                    self.log_test("User Login", True, f"Login successful, token received", data)
                else:
                    self.log_test("User Login", False, "Missing access_token in response", data)
            else:
                error_msg = response.text
                self.log_test("User Login", False, f"Status: {response.status_code}, Error: {error_msg}")
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")

    def test_get_current_user(self):
        """Test get current user profile endpoint"""
        if not self.auth_token:
            self.log_test("Get Current User", False, "No auth token available")
            return
            
        try:
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "username", "full_name", "grade", "ai_style", "xp", "coins", "level"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get Current User", True, f"Profile retrieved: {data['full_name']}, Grade: {data['grade']}", data)
                else:
                    self.log_test("Get Current User", False, f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Get Current User", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")

    def test_profile_update(self):
        """Test profile update endpoint"""
        if not self.auth_token:
            self.log_test("Profile Update", False, "No auth token available")
            return
            
        try:
            update_data = {
                "full_name": "Maria Silva Santos Updated",
                "grade": "8º EF",
                "school": "Escola Estadual Nova",
                "ai_style": "motivacional"
            }
            
            response = self.make_request("PUT", "/auth/profile", update_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Profile Update", True, "Profile updated successfully", data)
            else:
                self.log_test("Profile Update", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Profile Update", False, f"Exception: {str(e)}")

    def test_create_conversation(self):
        """Test conversation creation endpoint"""
        if not self.auth_token:
            self.log_test("Create Conversation", False, "No auth token available")
            return
            
        try:
            conversation_data = {
                "title": "Equações do 2º Grau - Dúvidas",
                "subject": "Matemática"
            }
            
            response = self.make_request("POST", "/conversations", conversation_data)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.conversation_id = data["id"]
                    self.log_test("Create Conversation", True, f"Conversation created: {data['title']}, ID: {self.conversation_id}", data)
                else:
                    self.log_test("Create Conversation", False, "Missing conversation ID in response", data)
            else:
                self.log_test("Create Conversation", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Create Conversation", False, f"Exception: {str(e)}")

    def test_get_conversations(self):
        """Test get conversations endpoint"""
        if not self.auth_token:
            self.log_test("Get Conversations", False, "No auth token available")
            return
            
        try:
            response = self.make_request("GET", "/conversations")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Conversations", True, f"Retrieved {len(data)} conversations", data)
                else:
                    self.log_test("Get Conversations", False, "Response is not a list", data)
            else:
                self.log_test("Get Conversations", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Get Conversations", False, f"Exception: {str(e)}")

    def test_chat_help_request(self):
        """Test chat endpoint with help request type"""
        if not self.auth_token or not self.conversation_id:
            self.log_test("Chat Help Request", False, "No auth token or conversation ID available")
            return
            
        try:
            chat_data = {
                "conversation_id": self.conversation_id,
                "message": "Como resolver a equação x² - 5x + 6 = 0?",
                "request_type": "help",
                "subject": "Matemática"
            }
            
            response = self.make_request("POST", "/chat", chat_data)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["content", "role", "ai_response", "xp_earned", "coins_earned"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get("role") == "assistant":
                    ai_response = data.get("ai_response", {})
                    if ai_response.get("type") == "help" and "steps" in ai_response:
                        self.log_test("Chat Help Request", True, f"Help response received, XP: {data['xp_earned']}, Coins: {data['coins_earned']}", data)
                    else:
                        self.log_test("Chat Help Request", False, "Invalid AI response format", data)
                else:
                    self.log_test("Chat Help Request", False, f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Chat Help Request", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Chat Help Request", False, f"Exception: {str(e)}")

    def test_chat_hint_request(self):
        """Test chat endpoint with hint request type"""
        if not self.auth_token or not self.conversation_id:
            self.log_test("Chat Hint Request", False, "No auth token or conversation ID available")
            return
            
        try:
            chat_data = {
                "conversation_id": self.conversation_id,
                "message": "Preciso de uma dica para resolver x² - 5x + 6 = 0",
                "request_type": "hint",
                "subject": "Matemática"
            }
            
            response = self.make_request("POST", "/chat", chat_data)
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get("ai_response", {})
                if ai_response.get("type") == "hint" and data.get("xp_earned", 0) > 0:
                    self.log_test("Chat Hint Request", True, f"Hint response received, XP: {data['xp_earned']}", data)
                else:
                    self.log_test("Chat Hint Request", False, "Invalid hint response", data)
            else:
                self.log_test("Chat Hint Request", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Chat Hint Request", False, f"Exception: {str(e)}")

    def test_chat_answer_request(self):
        """Test chat endpoint with answer request type"""
        if not self.auth_token or not self.conversation_id:
            self.log_test("Chat Answer Request", False, "No auth token or conversation ID available")
            return
            
        try:
            chat_data = {
                "conversation_id": self.conversation_id,
                "message": "Qual é a resposta completa para x² - 5x + 6 = 0?",
                "request_type": "answer",
                "subject": "Matemática"
            }
            
            response = self.make_request("POST", "/chat", chat_data)
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get("ai_response", {})
                if (ai_response.get("type") == "answer" and 
                    "final_answer" in ai_response and 
                    data.get("xp_earned", 0) > 0):
                    self.log_test("Chat Answer Request", True, f"Answer response received, XP: {data['xp_earned']}", data)
                else:
                    self.log_test("Chat Answer Request", False, "Invalid answer response", data)
            else:
                self.log_test("Chat Answer Request", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Chat Answer Request", False, f"Exception: {str(e)}")

    def test_get_messages(self):
        """Test get messages endpoint"""
        if not self.auth_token or not self.conversation_id:
            self.log_test("Get Messages", False, "No auth token or conversation ID available")
            return
            
        try:
            response = self.make_request("GET", f"/conversations/{self.conversation_id}/messages")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Messages", True, f"Retrieved {len(data)} messages", data)
                else:
                    self.log_test("Get Messages", True, "No messages found (expected for new conversation)", data)
            else:
                self.log_test("Get Messages", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Get Messages", False, f"Exception: {str(e)}")

    def test_dashboard(self):
        """Test dashboard endpoint"""
        if not self.auth_token:
            self.log_test("Dashboard", False, "No auth token available")
            return
            
        try:
            response = self.make_request("GET", "/dashboard")
            
            if response.status_code == 200:
                data = response.json()
                required_sections = ["user", "stats", "recent_conversations", "achievements"]
                missing_sections = [section for section in required_sections if section not in data]
                
                if not missing_sections:
                    user_data = data["user"]
                    stats_data = data["stats"]
                    self.log_test("Dashboard", True, 
                                f"Dashboard loaded - Level: {user_data.get('level')}, XP: {user_data.get('xp')}, "
                                f"Conversations: {stats_data.get('total_conversations')}", data)
                else:
                    self.log_test("Dashboard", False, f"Missing sections: {missing_sections}", data)
            else:
                self.log_test("Dashboard", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Dashboard", False, f"Exception: {str(e)}")

    def test_grades_endpoint(self):
        """Test grades endpoint"""
        try:
            response = self.make_request("GET", "/grades")
            
            if response.status_code == 200:
                data = response.json()
                if "grades" in data and isinstance(data["grades"], list):
                    expected_grades = ["1º EF", "2º EF", "3º EF", "4º EF", "5º EF", "6º EF", "7º EF", "8º EF", "9º EF"]
                    if all(grade in data["grades"] for grade in expected_grades):
                        self.log_test("Grades Endpoint", True, f"All {len(data['grades'])} grades available", data)
                    else:
                        self.log_test("Grades Endpoint", False, "Missing expected grades", data)
                else:
                    self.log_test("Grades Endpoint", False, "Invalid grades response format", data)
            else:
                self.log_test("Grades Endpoint", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Grades Endpoint", False, f"Exception: {str(e)}")

    def test_subjects_endpoint(self):
        """Test subjects endpoint"""
        try:
            response = self.make_request("GET", "/subjects")
            
            if response.status_code == 200:
                data = response.json()
                if "subjects" in data and isinstance(data["subjects"], list):
                    expected_subjects = ["Matemática", "Português", "Ciências", "História"]
                    if any(subject in data["subjects"] for subject in expected_subjects):
                        self.log_test("Subjects Endpoint", True, f"{len(data['subjects'])} subjects available", data)
                    else:
                        self.log_test("Subjects Endpoint", False, "Missing expected subjects", data)
                else:
                    self.log_test("Subjects Endpoint", False, "Invalid subjects response format", data)
            else:
                self.log_test("Subjects Endpoint", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("Subjects Endpoint", False, f"Exception: {str(e)}")

    def test_ai_styles_endpoint(self):
        """Test AI styles endpoint"""
        try:
            response = self.make_request("GET", "/ai-styles")
            
            if response.status_code == 200:
                data = response.json()
                if "styles" in data and isinstance(data["styles"], list):
                    expected_styles = ["paciente", "direto", "poético", "motivacional"]
                    available_keys = [style.get("key") for style in data["styles"]]
                    if all(style in available_keys for style in expected_styles):
                        self.log_test("AI Styles Endpoint", True, f"All {len(data['styles'])} AI styles available", data)
                    else:
                        self.log_test("AI Styles Endpoint", False, "Missing expected AI styles", data)
                else:
                    self.log_test("AI Styles Endpoint", False, "Invalid AI styles response format", data)
            else:
                self.log_test("AI Styles Endpoint", False, f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as e:
            self.log_test("AI Styles Endpoint", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"\n🚀 Starting ProfAI Backend Testing")
        print(f"📍 Backend URL: {BASE_URL}")
        print(f"📍 API URL: {API_URL}")
        print("=" * 60)
        
        # Basic connectivity tests
        self.test_health_check()
        self.test_grades_endpoint()
        self.test_subjects_endpoint()
        self.test_ai_styles_endpoint()
        
        # Authentication flow tests
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_profile_update()
        
        # Conversation and chat tests
        self.test_create_conversation()
        self.test_get_conversations()
        self.test_chat_help_request()
        self.test_chat_hint_request()
        self.test_chat_answer_request()
        self.test_get_messages()
        
        # Dashboard test
        self.test_dashboard()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🔗 Backend URL: {BASE_URL}")
        print(f"🕐 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    tester = ProfAITester()
    tester.run_all_tests()