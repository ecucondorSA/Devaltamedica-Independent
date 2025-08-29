#!/bin/bash

# K6 Test Runner Script for AltaMedica
# Run different test suites for the API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
API_URL=${API_URL:-"http://localhost:3001/api/v1"}
TEST_TYPE=${1:-"load"}

echo -e "${GREEN}🚀 AltaMedica K6 Test Runner${NC}"
echo -e "API URL: ${API_URL}"
echo -e "Test Type: ${TEST_TYPE}\n"

# Function to run a test
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${YELLOW}Running ${test_name}...${NC}"
    
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}Error: Test file ${test_file} not found${NC}"
        exit 1
    fi
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}Error: k6 is not installed${NC}"
        echo "Install k6 from: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    # Run the test
    k6 run \
        --env API_URL="${API_URL}" \
        --out json=results/${test_name}-$(date +%Y%m%d-%H%M%S).json \
        --summary-export=results/${test_name}-summary-$(date +%Y%m%d-%H%M%S).json \
        "$test_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${test_name} completed successfully${NC}\n"
    else
        echo -e "${RED}❌ ${test_name} failed${NC}\n"
        exit 1
    fi
}

# Create results directory if it doesn't exist
mkdir -p results

# Run tests based on type
case $TEST_TYPE in
    load)
        run_test "load-test.js" "Load Test"
        ;;
    stress)
        run_test "stress-test.js" "Stress Test"
        ;;
    hipaa)
        run_test "hipaa-compliance-test.js" "HIPAA Compliance Test"
        ;;
    all)
        echo -e "${GREEN}Running all tests...${NC}\n"
        run_test "load-test.js" "Load Test"
        run_test "stress-test.js" "Stress Test"
        run_test "hipaa-compliance-test.js" "HIPAA Compliance Test"
        echo -e "${GREEN}🎉 All tests completed!${NC}"
        ;;
    *)
        echo -e "${RED}Invalid test type: ${TEST_TYPE}${NC}"
        echo "Usage: ./run-tests.sh [load|stress|hipaa|all]"
        echo "  load   - Run load testing (default)"
        echo "  stress - Run stress testing"
        echo "  hipaa  - Run HIPAA compliance testing"
        echo "  all    - Run all tests"
        exit 1
        ;;
esac

# Generate HTML report if results exist
if [ -d "results" ] && [ "$(ls -A results)" ]; then
    echo -e "${YELLOW}Generating HTML report...${NC}"
    
    # Create a simple HTML report
    cat > results/report.html <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AltaMedica K6 Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .test-results { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; }
        .failure { color: red; }
        .info { color: #666; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🏥 AltaMedica K6 Test Results</h1>
    <div class="test-results">
        <h2>Test Execution Summary</h2>
        <p class="info">Generated on: $(date)</p>
        <p class="info">API URL: ${API_URL}</p>
        <p class="info">Test Type: ${TEST_TYPE}</p>
        <h3>Results:</h3>
        <pre>$(ls -la results/*.json 2>/dev/null || echo "No results found")</pre>
    </div>
    <div class="test-results">
        <h2>Next Steps:</h2>
        <ul>
            <li>Review individual JSON files for detailed metrics</li>
            <li>Import results into K6 Cloud for visualization</li>
            <li>Share results with the team</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}📊 HTML report generated: results/report.html${NC}"
fi

echo -e "${GREEN}✨ Test run complete!${NC}"