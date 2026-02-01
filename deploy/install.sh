#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/pi/dogxray2"

echo "[1/6] Installing packages..."
sudo apt-get update
sudo apt-get install -y nodejs npm python3 python3-pip chromium-browser

echo "[2/6] Installing server deps..."
cd "$APP_DIR/server"
npm install

echo "[3/6] Installing gpio deps..."
cd "$APP_DIR/gpio"
python3 -m pip install --break-system-packages -r requirements.txt

echo "[4/6] Installing systemd units..."
sudo cp "$APP_DIR/deploy/dogxray-server.service" /etc/systemd/system/
sudo cp "$APP_DIR/deploy/dogxray-gpio.service" /etc/systemd/system/
sudo cp "$APP_DIR/deploy/dogxray-kiosk.service" /etc/systemd/system/ || true

sudo systemctl daemon-reload

echo "[5/6] Enabling services..."
sudo systemctl enable dogxray-server.service
sudo systemctl enable dogxray-gpio.service

# Enable kiosk only if you want it:
# sudo systemctl enable dogxray-kiosk.service

echo "[6/6] Starting services..."
sudo systemctl restart dogxray-server.service
sudo systemctl restart dogxray-gpio.service

echo "Done. Test: http://127.0.0.1:3000"
