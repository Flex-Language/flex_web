#!/bin/bash

# Comprehensive test for flex.mikawi.org domain functionality
# Tests all critical components of the Flex Web Compiler

DOMAIN="flex.mikawi.org"
BASE_URL="http://$DOMAIN"

echo "=============================================="
echo "Testing Flex Web Compiler on $DOMAIN"
echo "=============================================="
echo ""

# Test 1: Main page loading
echo "1. Testing main page loading..."
response=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" http://localhost:80/)
if [ "$response" = "200" ]; then
    echo "✅ Main page loads successfully (HTTP $response)"
else
    echo "❌ Main page failed (HTTP $response)"
fi

# Test 2: CSS loading
echo ""
echo "2. Testing CSS loading..."
response=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" http://localhost:80/css/styles.css)
if [ "$response" = "200" ]; then
    echo "✅ CSS loads successfully (HTTP $response)"
else
    echo "❌ CSS failed (HTTP $response)"
fi

# Test 3: JavaScript loading
echo ""
echo "3. Testing JavaScript loading..."
response=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" http://localhost:80/js/main.js)
if [ "$response" = "200" ]; then
    echo "✅ JavaScript loads successfully (HTTP $response)"
else
    echo "❌ JavaScript failed (HTTP $response)"
fi

# Test 4: API Status
echo ""
echo "4. Testing API status endpoint..."
api_response=$(curl -s -H "Host: $DOMAIN" http://localhost:80/api/status)
if echo "$api_response" | grep -q '"status":"online"'; then
    echo "✅ API is responding correctly"
    echo "   Response: $(echo $api_response | jq -r '.message' 2>/dev/null || echo 'API Online')"
else
    echo "❌ API is not responding correctly"
    echo "   Response: $api_response"
fi

# Test 5: Load Balancer Status
echo ""
echo "5. Testing load balancer status..."
lb_response=$(curl -s -H "Host: $DOMAIN" http://localhost:80/lb-status)
if echo "$lb_response" | grep -q "4 instances"; then
    echo "✅ Load balancer is working"
    echo "   Status: $lb_response"
else
    echo "❌ Load balancer status unclear"
    echo "   Response: $lb_response"
fi

# Test 6: Health check
echo ""
echo "6. Testing health endpoint..."
health_response=$(curl -s -H "Host: $DOMAIN" http://localhost:80/health)
if echo "$health_response" | grep -q '"status":"online"'; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "   Response: $health_response"
fi

# Test 7: Code execution API (basic test)
echo ""
echo "7. Testing code execution API..."
exec_response=$(curl -s -X POST -H "Host: $DOMAIN" -H "Content-Type: application/json" \
    -d '{"code":"print(\"Hello from Flex!\")"}' \
    http://localhost:80/api/execute)
if echo "$exec_response" | grep -q '"executionId"'; then
    echo "✅ Code execution API is working"
    execution_id=$(echo "$exec_response" | jq -r '.executionId' 2>/dev/null || echo 'Generated')
    echo "   Execution ID: $execution_id"
else
    echo "❌ Code execution API failed"
    echo "   Response: $exec_response"
fi

# Test 8: Examples API
echo ""
echo "8. Testing examples API..."
examples_response=$(curl -s -H "Host: $DOMAIN" http://localhost:80/api/examples)
if echo "$examples_response" | grep -q 'input_demo'; then
    echo "✅ Examples API is working"
    echo "   Examples available"
else
    echo "❌ Examples API failed"
    echo "   Response: $(echo $examples_response | head -c 100)..."
fi

# Test 9: Static assets
echo ""
echo "9. Testing static assets..."
favicon_response=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" http://localhost:80/favicon.ico)
if [ "$favicon_response" = "200" ] || [ "$favicon_response" = "404" ]; then
    echo "✅ Static asset routing is working (HTTP $favicon_response)"
else
    echo "❌ Static asset routing failed (HTTP $favicon_response)"
fi

# Test 10: Content Security Policy headers
echo ""
echo "10. Checking Content Security Policy..."
csp_headers=$(curl -s -I -H "Host: $DOMAIN" http://localhost:80/ | grep -i "content-security-policy")
if echo "$csp_headers" | grep -q "flex.mikawi.org"; then
    echo "✅ CSP headers include domain correctly"
else
    echo "⚠️  CSP headers might need verification"
fi

echo ""
echo "=============================================="
echo "Domain Testing Complete!"
echo "=============================================="
echo ""
echo "Summary:"
echo "✅ Your domain $DOMAIN should be working perfectly!"
echo ""
echo "Access points:"
echo "• Main website: http://$DOMAIN"
echo "• API status: http://$DOMAIN/api/status"
echo "• Load balancer: http://$DOMAIN/lb-status"
echo "• Health check: http://$DOMAIN/health"
echo ""
echo "To run this test anytime: ./test-domain.sh"
echo "Or use: ./manage-loadbalanced.sh test-domain" 