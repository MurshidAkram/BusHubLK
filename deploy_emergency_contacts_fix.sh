#!/bin/bash

# Emergency Contacts Fix - Deployment Script
# This script will deploy all necessary files to fix the emergency contacts feature

echo "=========================================="
echo "Emergency Contacts Fix - Deployment"
echo "=========================================="

# Step 1: Upload files to AWS
echo ""
echo "Step 1: Uploading files to AWS..."
echo "-----------------------------------"

# Upload passengerModel.js (has setPrimaryContact method)
scp -i ~/.ssh/your-key.pem \
  backend/models/passengerModel.js \
  ubuntu@43.205.127.30:~/BusHubLK/backend/models/
echo "✅ Uploaded passengerModel.js"

# Upload passengerController.js (has setPrimaryContact controller)
scp -i ~/.ssh/your-key.pem \
  backend/controllers/passengerController.js \
  ubuntu@43.205.127.30:~/BusHubLK/backend/controllers/
echo "✅ Uploaded passengerController.js"

# Upload passengerRoutes.js (has setPrimaryContact route)
scp -i ~/.ssh/your-key.pem \
  backend/routes/passengerRoutes.js \
  ubuntu@43.205.127.30:~/BusHubLK/backend/routes/
echo "✅ Uploaded passengerRoutes.js"

# Upload server.js (has better error logging)
scp -i ~/.ssh/your-key.pem \
  backend/server.js \
  ubuntu@43.205.127.30:~/BusHubLK/backend/
echo "✅ Uploaded server.js"

# Upload SQL migration
scp -i ~/.ssh/your-key.pem \
  backend/sql/fix_emergency_contacts_foreign_key.sql \
  ubuntu@43.205.127.30:~/BusHubLK/backend/sql/
echo "✅ Uploaded SQL migration"

# Step 2: SSH into AWS and run commands
echo ""
echo "Step 2: Running commands on AWS..."
echo "-----------------------------------"

ssh -i ~/.ssh/your-key.pem ubuntu@43.205.127.30 << 'ENDSSH'
cd ~/BusHubLK

# Run SQL migration
echo "Running SQL migration..."
psql -U postgres -d bushublk < backend/sql/fix_emergency_contacts_foreign_key.sql
echo "✅ SQL migration completed"

# Restart backend
echo ""
echo "Restarting backend..."
pm2 restart backend

# Wait for restart
sleep 3

# Show logs
echo ""
echo "Backend logs:"
echo "-----------------------------------"
pm2 logs --lines 30 --nostream

echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="
echo ""
echo "Check the logs above for:"
echo "  ✅ passengerRoutes loaded"
echo "  ✅ setPrimaryContact route registered"
echo ""
echo "If you see errors, run: pm2 logs"
ENDSSH

echo ""
echo "Testing the API..."
echo "-----------------------------------"
curl -s http://43.205.127.30:5000/api/passengers/14/contacts
echo ""
echo ""
echo "If you see [] or [{...}], it works!"
echo "If you see 'Cannot GET', the routes still aren't loaded."
