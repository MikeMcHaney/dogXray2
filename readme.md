
Dog X-Ray Exhibit
System Overview & Operations

Purpose
This Raspberry Pi runs the Dog X-Ray Exhibit, an interactive children’s museum installation.
When a magnetic camera is placed near sensors inside a stuffed dog, the screen displays corresponding x-ray images.

Hardware Components
- Raspberry Pi with HDMI display
- Magnetic sensors inside the stuffed dog
- Display running Chromium in kiosk mode
- Stable power supply

Software Architecture
1. Node.js web server (UI + API)
2. Python GPIO bridge
3. Chromium kiosk browser

Auto-Start Behavior
The system boots, auto-logs in, starts services, and launches the exhibit automatically.

Maintenance Mode
Create /boot/nokiosk to disable kiosk on next boot.
Remove the file to re-enable kiosk mode.

Common Commands
Restart services:
sudo systemctl restart dogxray-server dogxray-gpio dogxray-kiosk

Check logs:
journalctl -u dogxray-gpio -f

Intent for Future Maintainers
This system favors maintainability, resilience, and simplicity.


Command to watch over the GPIO switches.
journalctl -u dogxray-gpio -f
