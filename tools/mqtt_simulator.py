"""Send the twin's four-node telemetry as MQTT messages, like the real chamber gateway would.

    python tools/mqtt_simulator.py                         # print the messages (no broker needed)
    python tools/mqtt_simulator.py --broker localhost      # publish to a local mosquitto (pip install paho-mqtt)
    python tools/mqtt_simulator.py --scenario door_seal --speed 60 --count 24

Topic: coldtrust/{chamberId}/telemetry  (JSON, docs/schemas/telemetry.schema.json). Values are the digital
twin's (S) with simulated sensor noise, from web/trust/data/trust_data.js (python -m twin.trust_nodes).
A real gateway uses TLS on port 8883 with an X.509 device certificate; this simulator uses plain 1883
on localhost only, for testing.
"""
import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "trust" / "data" / "trust_data.js"


def load_data():
    txt = DATA.read_text(encoding="utf-8")
    return json.loads(txt[txt.index("{"):txt.rstrip().rstrip(";").rindex("}") + 1])


def messages(data, scenario="normal", chamber="VSKP-01", start=None, count=None):
    s = data["scenarios"][scenario]
    t0 = datetime.fromisoformat(s["t0"]).replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
    n = len(s["phi"])
    start = s["checkin_step"] if start is None else start
    stop = n if count is None else min(n, start + count)
    for i in range(start, stop):
        ts = (t0 + timedelta(seconds=i * s["dt_s"])).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        yield f"coldtrust/{chamber}/telemetry", {
            "chamberId": chamber, "ts": ts, "step": i,
            "N1": {"T_s": s["N1"]["T_s"][i], "RH_s": s["N1"]["RH_s"][i], "v_m_s": s["N1"]["v_s"][i]},
            "N2": {"T_core": s["N2"]["T_core"][i]},
            "N3": {"open": s["N3"]["open"][i], "angle_deg": s["N3"]["angle_deg"][i], "Q_door_W": round(s["N3"]["Q_door_kW"][i] * 1000, 1)},
            "N4": {"T_r": s["N4"]["T_r"][i], "RH_r": s["N4"]["RH_r"][i]},
            "out": {"T_out": s["out"]["T_out"][i], "RH_out": s["out"]["RH_out"][i]},
            "P_el_W": round(s["ctl"]["P_el_kW"][i] * 1000, 1),
            "ctl": {k: s["ctl"][k][i] for k in ("P_fan_kW", "cop", "Q_wax_branch_kW", "Q_int_kW", "G_wax_kW_K", "T_pcm", "load_event")},
            "source": "S – digital twin + simulated sensor noise (not measured)",
        }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--broker", help="MQTT broker host (e.g. localhost). Without it the messages are printed.")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--scenario", default="normal", help="normal | door_seal | overcool | power_cut")
    ap.add_argument("--chamber", default="VSKP-01")
    ap.add_argument("--count", type=int, default=12, help="how many 5-minute messages (default 12 = 1 h)")
    ap.add_argument("--speed", type=float, default=0, help="seconds between messages (0 = as fast as possible)")
    a = ap.parse_args(argv)
    data = load_data()
    client = None
    if a.broker:
        try:
            import paho.mqtt.client as mqtt
        except ImportError:
            sys.exit("paho-mqtt is not installed: pip install paho-mqtt  (or run without --broker to print)")
        client = mqtt.Client()
        client.connect(a.broker, a.port, 60)
        client.loop_start()
    for topic, msg in messages(data, a.scenario, a.chamber, count=a.count):
        body = json.dumps(msg, separators=(",", ":"))
        if client:
            client.publish(topic, body, qos=1)
        print(topic, body)
        if a.speed:
            time.sleep(a.speed)
    if client:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
