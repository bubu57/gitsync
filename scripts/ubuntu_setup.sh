apt update -y
apt upgrade -y
apt install python3 -y
apt install pip -y
apt install git -y
pip3 install Gitpython
pip3 install threaded

echo "ok"

cd /gitsync/scripts && python3 gitsync.py