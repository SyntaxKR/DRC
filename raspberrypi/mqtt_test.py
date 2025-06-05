import os
import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime
from dotenv import load_dotenv

# .env에서 IP, PORT를 불러오거나 없으면 직접 문자열/숫자로 대체하세요
load_dotenv()
SERVER_IP = os.getenv("IP")
SERVER_PORT = os.getenv("PORT")

TOPIC = "DriveLog"
CLIENT_ID = f"fake_publisher_{random.randint(0,9999)}"

# MQTT 연결
client = mqtt.Client(client_id=CLIENT_ID)
try:
    client.connect(SERVER_IP, SERVER_PORT, keepalive=60)
    print(f"[Connected] MQTT 브로커 → {SERVER_IP}:{SERVER_PORT}, client_id={CLIENT_ID}")
except Exception as e:
    print("MQTT 연결 실패:", e)
    exit(1)

def generate_fake_data(prev_speed):
    """
    임의의 센서값을 만들어서 dict로 반환.
    prev_speed: 이전 루프의 속도(km/h) - 간단하게 변화량 계산하려고 전달받음.
    """
    # 가속 페달(0~5000), 브레이크 페달(0~5000) 범위 내에서 랜덤
    acl_pedal = random.randint(0, 5000)
    brk_pedal = random.randint(0, 5000)

    # 속도, RPM: 예를 들어 0~200 km/h, 0~6000 RPM 사이에서 랜덤
    speed = random.randint(0, 200)
    rpm = random.randint(0, 6000)

    # 속도 변화: 현재 속도 - 이전 속도
    speed_change = round(speed - prev_speed, 1)

    # driveState는 간단히 Normal Driving으로 고정하거나, 원하는 로직으로 바꿔도 됩니다.
    drive_state = "Normal Driving"

    now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

    payload = {
        "carId": "01가1234",
        "aclPedal": acl_pedal,
        "brkPedal": brk_pedal,
        "createDate": now,
        "driveState": drive_state,
        "speed": speed,
        "rpm": rpm,
        "speedChange": speed_change
    }
    return payload, speed

def main():
    prev_speed = 0
    try:
        while True:
            data, prev_speed = generate_fake_data(prev_speed)
            msg = json.dumps(data, ensure_ascii=False)
            client.publish(TOPIC, msg, qos=0, retain=False)
            print(f"[Published] {TOPIC} → {msg}")
            time.sleep(1)  # 1초 간격으로 전송
    except KeyboardInterrupt:
        print("중단 요청 받음, 종료합니다.")
    finally:
        client.disconnect()
        print("MQTT 연결 해제 완료.")

if __name__ == "__main__":
    main()