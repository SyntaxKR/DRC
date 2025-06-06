import os
import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime
from dotenv import load_dotenv

import ssl

#암호화
import base64
from typing import Tuple

INITIAL_SEED = 0x1234  # 초기 시드 값 (16비트)

def next_chaotic(x: int) -> Tuple[int, int]:
    x = x & 0xFFFF
    if x == 0:
        y = (((x << 4) & 0xFFFF) - ((x >> 12) & 0xFFFF)) & 0xFFFF
        x_next = y
    else:
        x_inv = 0xFFFF - x
        y = (((x_inv << 4) & 0xFFFF) - ((x_inv >> 12) & 0xFFFF)) & 0xFFFF
        x_next = y
    return x_next, y

def encrypt_sensor_data(sensor_bytes: bytes, x0: int) -> bytes:
    encrypted = bytearray()
    x = x0 & 0xFFFF

    # 처음 혼돈 값 생성
    x, y = next_chaotic(x)
    Beg_value = y

    idx = 0
    while idx < len(sensor_bytes):
        y_hi = (y >> 8) & 0xFF
        y_lo = y & 0xFF

        # 첫 번째 바이트 암호화
        encrypted.append(sensor_bytes[idx] ^ y_hi)
        idx += 1

        # 두 번째 바이트가 남아 있으면 암호화
        if idx < len(sensor_bytes):
            encrypted.append(sensor_bytes[idx] ^ y_lo)
            idx += 1

        # 다음 혼돈 값 생성
        x, y = next_chaotic(y)

    End_value = y

    # 패킷 구성: Beg(2바이트) || 암호문 || End(2바이트)
    packet = bytearray()
    packet += Beg_value.to_bytes(2, byteorder='big')
    packet += encrypted
    packet += End_value.to_bytes(2, byteorder='big')
    return bytes(packet)

def decrypt_sensor_data(packet: bytes, x0: int) -> bytes:
    Beg_value = int.from_bytes(packet[0:2], byteorder='big')
    End_value = int.from_bytes(packet[-2:], byteorder='big')
    cipher_bytes = packet[2:-2]

    x = x0 & 0xFFFF
    x, y_generated = next_chaotic(x)
    if y_generated != Beg_value:
        raise ValueError("Beg_value 불일치: 키가 틀렸거나 데이터 변조가 발생했습니다.")

    decrypted = bytearray()
    idx = 0
    current_y = y_generated

    while idx < len(cipher_bytes):
        y_hi = (current_y >> 8) & 0xFF
        y_lo = current_y & 0xFF

        decrypted.append(cipher_bytes[idx] ^ y_hi)
        idx += 1
        if idx < len(cipher_bytes):
            decrypted.append(cipher_bytes[idx] ^ y_lo)
            idx += 1

        x, next_y = next_chaotic(current_y)
        current_y = next_y

    if current_y != End_value:
        raise ValueError("End_value 불일치: 데이터 무결성 검증 실패.")

    return bytes(decrypted)
# 암호화 끝



load_dotenv()
SERVER_IP   = os.getenv("IP")
BROKER_HOST  = os.getenv("BROKER_HOST")
CA_CERT_PATH = os.getenv("MQTT_CA_CERT")
SERVER_PORT = os.getenv("PORT")

# PORT를 정수로 변환
if SERVER_PORT is None:
    raise RuntimeError(".env에 PORT가 설정되지 않았습니다.")
SERVER_PORT = int(SERVER_PORT)

TOPIC     = "DriveLog"
CLIENT_ID = f"fake_publisher_{random.randint(0,9999)}"

# MQTT 연결
client = mqtt.Client(client_id=CLIENT_ID)
client.tls_set(
    ca_certs=CA_CERT_PATH,
    tls_version=ssl.PROTOCOL_TLSv1_2
)
try:
    client.connect(BROKER_HOST, SERVER_PORT, keepalive=60)
    print(f"[Connected] MQTT 브로커 → {BROKER_HOST}:{SERVER_PORT}, client_id={CLIENT_ID}")
except Exception as e:
    print("MQTT 연결 실패:", e)
    exit(1)

def generate_fake_data(prev_speed):
    acl_pedal = random.randint(0, 5000)
    brk_pedal = random.randint(0, 5000)
    speed     = random.randint(0, 200)
    rpm       = random.randint(0, 6000)
    speed_change = round(speed - prev_speed, 1)
    drive_state  = "Normal Driving"
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
            # 1) 가짜 데이터 생성
            data_dict, prev_speed = generate_fake_data(prev_speed)

            # 2) JSON 문자열 → UTF-8 바이트
            json_str = json.dumps(data_dict, ensure_ascii=False)
            sensor_bytes = json_str.encode('utf-8')

            # 3) Chaotic XOR 암호화 → packet(bytes)
            packet = encrypt_sensor_data(sensor_bytes, INITIAL_SEED)

            # 4) packet을 Base64 문자열로 인코딩해서 발행
            b64_str = base64.b64encode(packet).decode('utf-8')
            client.publish(TOPIC, b64_str, qos=0, retain=False)
            print(f"[Published(Base64)] {TOPIC} → {json_str}")

            time.sleep(1)

    except KeyboardInterrupt:
        print("중단 요청 받음, 종료합니다.")
    finally:
        client.disconnect()
        print("MQTT 연결 해제 완료.")

if __name__ == "__main__":
    main()
