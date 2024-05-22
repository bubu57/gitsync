echo "install frontend package..."
cd /gitsync/web/frontend
npm install > /dev/null

echo "build react frontend..."
npm run build > /dev/null

echo "install backend package..."
cd /gitsync/web/backend
npm install > /dev/null

echo "start server"
npm start