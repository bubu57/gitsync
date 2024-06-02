cd web/frontend
npm run build

cd ../../

rm -fr ../tmp/*

mkdir -p ../tmp/web/
mkdir -p ../tmp/web/frontend

cp -fr web/backend ../tmp/web/ 
cp -fr web/frontend/build ../tmp/web/frontend
cp -fr scripts ../tmp
cp -fr docker-compose.yml ../tmp
cp -fr dockerfile.web ../tmp
cp -fr README.md ../tmp
cp -fr start.sh ../tmp

git add * 
git commit -m "update"
git push

git checkout main

cp -fr ../tmp/* .

git add * 
git commit -m "update"
git push

git checkout dev