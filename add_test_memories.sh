#!/bin/bash

# Add test memories to Valora
echo "Adding test memories..."

curl -X POST http://localhost:3000/memory \
-H "Content-Type: application/json" \
-H "Authorization: Bearer test-key" \
-d '{
  "content": "JWT authentication uses digitally signed tokens for secure user sessions in web applications.",
  "source": "test",
  "tags": ["authentication", "security", "jwt"]
}'

echo -e "\nMemory 1 added!"

curl -X POST http://localhost:3000/memory \
-H "Content-Type: application/json" \
-H "Authorization: Bearer test-key" \
-d '{
  "content": "React hooks like useState and useEffect help manage component state and lifecycle in functional components.",
  "source": "test",
  "tags": ["react", "javascript", "frontend"]
}'

echo -e "\nMemory 2 added!"

curl -X POST http://localhost:3000/memory \
-H "Content-Type: application/json" \
-H "Authorization: Bearer test-key" \
-d '{
  "content": "Docker containers provide isolated environments for applications with consistent deployment across different systems.",
  "source": "test",
  "tags": ["docker", "devops", "deployment"]
}'

echo -e "\nMemory 3 added!"

echo "Test memories added successfully!"
