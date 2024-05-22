echo "System update..."
apt update -y > /dev/null
apt upgrade -y > /dev/null

echo "Install required packages..."
apt install python3 -y > /dev/null
apt install pip -y > /dev/null
apt install git -y > /dev/null

echo "Install required python packages..."
pip3 install Gitpython > /dev/null
pip3 install threaded > /dev/null
pip3 install requests > /dev/null

cd /gitsync/scripts && python3 gitsync.py