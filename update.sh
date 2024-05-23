cd web/frontend 
npm run build

cd ../../

rm -fr ../tmp/*

cp -fr web/backend ../tmp 
cp -fr web/frontend/build ../tmp
cp -fr scripts ../tmp
cp -fr docker-compose.yml ../tmp
cp -fr dockerfile.engine ../tmp
cp -fr dockerfile.web ../tmp
cp -fr README.md ../tmp
cp -fr start.sh ../tmp

git checkout main

cp -fr ../tmp/ .

git add * 
git commit -m "update"
git push

git checkout dev
