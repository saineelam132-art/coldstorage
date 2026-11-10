"""One-command start:   python run.py      then open http://localhost:8000

Judges' phones on the laptop's Wi-Fi hotspot can open http://<laptop-IP>:8000 .
"""
import socket
import sys
import threading
import webbrowser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"


if __name__ == "__main__":
    import uvicorn
    port = 8000
    print(f"\n  KoolKisaan starting ...\n  On this laptop:   http://localhost:{port}\n"
          f"  From a phone on the same Wi-Fi:   http://{lan_ip()}:{port}\n")
    if "--no-browser" not in sys.argv:
        threading.Timer(3.0, lambda: webbrowser.open(f"http://localhost:{port}")).start()
    uvicorn.run("server.app:app", host="0.0.0.0", port=port, log_level="warning")
