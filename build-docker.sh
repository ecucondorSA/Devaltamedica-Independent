#!/bin/bash

echo "🐳 Building AltaMedica Docker image..."
echo "📁 Using Dockerfile.optimized"
echo ""

# Build the Docker image
sudo docker builder build -f Dockerfile.optimized -t altamedica-independent .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker build completed successfully!"
    echo "📦 Image: altamedica-independent"
    echo ""
    echo "To run the container:"
    echo "sudo docker run -p 3000:3000 altamedica-independent"
else
    echo ""
    echo "❌ Docker build failed. Check the output above for errors."
    exit 1
fi