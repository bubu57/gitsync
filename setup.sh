echo "create data folder and files..."
mkdir data
touch data/token.json
touch data/repos.json

echo `{"token":""}` > data/token.json
echo `{"repos":[]}` > data/repos.json