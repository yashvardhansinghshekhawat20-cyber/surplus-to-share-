#!/usr/bin/env bash
echo "========================================================"
echo "      Setting up FoodLink on your computer"
echo "========================================================"
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in PATH!"
    exit 1
fi

# Check Node / npm
if ! command -v npm &> /dev/null; then
    echo "[ERROR] Node.js / npm is not installed or not in PATH!"
    exit 1
fi

echo "Python 3 and Node.js detected!"
echo ""

echo "[1/2] Installing Backend Dependencies..."
cd "$ROOT_DIR/backend" || exit 1
pip3 install -r requirements.txt || pip install -r requirements.txt

echo ""
echo "[2/2] Installing Frontend Dependencies..."
cd "$ROOT_DIR/frontend" || exit 1
npm install

echo ""
echo "========================================================"
echo "SETUP COMPLETE!"
echo "Run ./start.sh anytime to launch the project!"
echo "========================================================"
