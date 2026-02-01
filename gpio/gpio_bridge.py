#!/usr/bin/env python3
import time
import requests
from gpiozero import Button

SERVER = "http://127.0.0.1:3000"

# BCM pin -> triggerId (1:1)
PIN_TO_TRIGGER = {
    17: "P1",
    27: "P2",
    22: "P3",
    23: "P4",
    24: "P5",
    25: "P6",
    5:  "P7",
    6:  "P8",
    12: "P9",
    13: "P10",
    16: "P11",
    26: "P12",
}

BOUNCE_TIME_SEC = 0.08

def post_event(trigger_id: str, pin: int, state: int):
    # state: 1 = pressed/active, 0 = released/inactive
    payload = {
        "triggerId": trigger_id,
        "pin": pin,
        "state": state,
        "ts": int(time.time() * 1000),
    }
    try:
        requests.post(f"{SERVER}/api/gpio", json=payload, timeout=0.4)
    except Exception as e:
        print(f"[gpio] POST failed: {e}")

def make_handlers(pin: int, trigger_id: str, btn: Button):
    def on_pressed():
        # For pull_up=True, pressed means pin pulled to GND (active)
        print(f"[gpio] GPIO{pin} -> ACTIVE (pressed)  trigger={trigger_id}")
        post_event(trigger_id, pin, 1)

    def on_released():
        print(f"[gpio] GPIO{pin} -> INACTIVE (released) trigger={trigger_id}")
        post_event(trigger_id, pin, 0)

    btn.when_pressed = on_pressed
    btn.when_released = on_released

def main():
    buttons = []
    for pin, trigger_id in PIN_TO_TRIGGER.items():
        b = Button(pin, pull_up=True, bounce_time=BOUNCE_TIME_SEC)
        make_handlers(pin, trigger_id, b)
        buttons.append(b)
        print(f"[gpio] watching GPIO{pin} -> {trigger_id}")

    print("[gpio] diagnostics running. Move magnet around and watch logs.")
    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
