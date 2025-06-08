import os
import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime, timezone
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

# TOTP 생성
import hmac
import hashlib
import struct
from base64 import b64decode

SECRET_BASE64 = "JBSWY3DPEHPK3PXP"

def generate_totp(secret_base64: str, for_time: int = None, digits: int = 6, period: int = 60) -> int:
    """
    Base64로 인코딩된 공유 비밀 키를 이용해 TOTP 코드를 생성합니다.

    Args:
        secret_base64: Base64 인코딩된 shared secret 문자열
        for_time:      Unix timestamp (초 단위). None이면 현재 시각을 사용.
        digits:        출력할 OTP 자리수 (기본 6자리)
        period:        TOTP 유효 기간(초) (기본 60초)
    Returns:
        0 ~ (10^digits - 1) 범위의 정수형 TOTP 코드
    """
    if for_time is None:
        for_time = int(time.time())
    key = b64decode(secret_base64)
    counter = int(for_time // period)
    msg = struct.pack(">Q", counter)  # 8바이트 big-endian

    hmac_hash = hmac.new(key, msg, hashlib.sha1).digest()
    offset = hmac_hash[-1] & 0x0F
    code = (struct.unpack(">I", hmac_hash[offset:offset+4])[0] & 0x7FFFFFFF) % (10**digits)
    return code
# TOTP 끝

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

EXTRACTED_DATA = [
    {
        "aclPedal": 584,
        "brkPedal": 39,
        "createDate": "2024-12-10T01:27:10",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 991,
        "speedChange": -1.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 596,
        "brkPedal": 32,
        "createDate": "2024-12-10T01:27:11",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 978,
        "speedChange": -0.5,
        "carId": "01가1234"
    },
    {
        "aclPedal": 606,
        "brkPedal": 23,
        "createDate": "2024-12-10T01:27:13",
        "driveState": "Normal Driving",
        "speed": 7,
        "rpm": 941,
        "speedChange": -0.6,
        "carId": "01가1234"
    },
    {
        "aclPedal": 617,
        "brkPedal": 27,
        "createDate": "2024-12-10T01:27:15",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 985,
        "speedChange": 0.6,
        "carId": "01가1234"
    },
    {
        "aclPedal": 626,
        "brkPedal": 34,
        "createDate": "2024-12-10T01:27:17",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 1012,
        "speedChange": 0.1,
        "carId": "01가1234"
    },
    {
        "aclPedal": 633,
        "brkPedal": 75,
        "createDate": "2024-12-10T01:27:18",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 1004,
        "speedChange": -0.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 592,
        "brkPedal": 62,
        "createDate": "2024-12-10T01:27:20",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 990,
        "speedChange": 0.6,
        "carId": "01가1234"
    },
    {
        "aclPedal": 601,
        "brkPedal": 62,
        "createDate": "2024-12-10T01:27:22",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 946,
        "speedChange": -0.2,
        "carId": "01가1234"
    },
    {
        "aclPedal": 639,
        "brkPedal": 62,
        "createDate": "2024-12-10T01:27:23",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 930,
        "speedChange": -0.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 601,
        "brkPedal": 62,
        "createDate": "2024-12-10T01:27:25",
        "driveState": "Normal Driving",
        "speed": 8,
        "rpm": 912,
        "speedChange": 0.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 637,
        "brkPedal": 65,
        "createDate": "2024-12-10T01:27:27",
        "driveState": "Normal Driving",
        "speed": 9,
        "rpm": 916,
        "speedChange": 0.9,
        "carId": "01가1234"
    },
    {
        "aclPedal": -2003,
        "brkPedal": 2826,
        "createDate": "2024-12-10T01:27:28",
        "driveState": "Normal Driving",
        "speed": 9,
        "rpm": 900,
        "speedChange": 0.1,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2,
        "brkPedal": 3389,
        "createDate": "2024-12-10T01:27:30",
        "driveState": "Rapid Braking",
        "speed": 10,
        "rpm": 916,
        "speedChange": 0.5,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1,
        "brkPedal": 3466,
        "createDate": "2024-12-10T01:27:32",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 812,
        "speedChange": -10.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1,
        "brkPedal": 3465,
        "createDate": "2024-12-10T01:27:34",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 834,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 0,
        "brkPedal": 3481,
        "createDate": "2024-12-10T01:27:35",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 854,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1,
        "brkPedal": 3425,
        "createDate": "2024-12-10T01:27:37",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 867,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1,
        "brkPedal": 3165,
        "createDate": "2024-12-10T01:27:39",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 831,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 0,
        "brkPedal": 3170,
        "createDate": "2024-12-10T01:27:40",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 834,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 0,
        "brkPedal": 3051,
        "createDate": "2024-12-10T01:27:42",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 854,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 0,
        "brkPedal": 3047,
        "createDate": "2024-12-10T01:27:44",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 891,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1,
        "brkPedal": 3051,
        "createDate": "2024-12-10T01:27:45",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 842,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2,
        "brkPedal": 3010,
        "createDate": "2024-12-10T01:27:47",
        "driveState": "Rapid Braking",
        "speed": 0,
        "rpm": 813,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2,
        "brkPedal": 2093,
        "createDate": "2024-12-10T01:27:49",
        "driveState": "Normal Driving",
        "speed": 13,
        "rpm": 1156,
        "speedChange": 13.2,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2576,
        "brkPedal": 8,
        "createDate": "2024-12-10T01:27:51",
        "driveState": "Normal Driving",
        "speed": 27,
        "rpm": 1488,
        "speedChange": 14.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 3269,
        "brkPedal": 21,
        "createDate": "2024-12-10T01:27:52",
        "driveState": "Normal Driving",
        "speed": 39,
        "rpm": 1875,
        "speedChange": 11.8,
        "carId": "01가1234"
    },
    {
        "aclPedal": 3108,
        "brkPedal": 25,
        "createDate": "2024-12-10T01:27:54",
        "driveState": "Rapid Acceleration",
        "speed": 50,
        "rpm": 2196,
        "speedChange": 11.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 3034,
        "brkPedal": 25,
        "createDate": "2024-12-10T01:27:56",
        "driveState": "Rapid Acceleration",
        "speed": 61,
        "rpm": 2508,
        "speedChange": 11.1,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2892,
        "brkPedal": 25,
        "createDate": "2024-12-10T01:27:58",
        "driveState": "Rapid Acceleration",
        "speed": 73,
        "rpm": 2875,
        "speedChange": 12.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2604,
        "brkPedal": 23,
        "createDate": "2024-12-10T01:27:59",
        "driveState": "Rapid Acceleration",
        "speed": 85,
        "rpm": 3219,
        "speedChange": 11.2,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2543,
        "brkPedal": 31,
        "createDate": "2024-12-10T01:28:01",
        "driveState": "Rapid Acceleration",
        "speed": 98,
        "rpm": 3590,
        "speedChange": 13.8,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2632,
        "brkPedal": 19,
        "createDate": "2024-12-10T01:28:03",
        "driveState": "Rapid Acceleration",
        "speed": 113,
        "rpm": 3932,
        "speedChange": 14.7,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1363,
        "brkPedal": 10,
        "createDate": "2024-12-10T01:28:05",
        "driveState": "Normal Driving",
        "speed": 120,
        "rpm": 4123,
        "speedChange": 6.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1014,
        "brkPedal": 12,
        "createDate": "2024-12-10T01:28:06",
        "driveState": "Normal Driving",
        "speed": 119,
        "rpm": 4201,
        "speedChange": -0.8,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1087,
        "brkPedal": 22,
        "createDate": "2024-12-10T01:28:08",
        "driveState": "Normal Driving",
        "speed": 118,
        "rpm": 4102,
        "speedChange": -0.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1089,
        "brkPedal": 25,
        "createDate": "2024-12-10T01:28:10",
        "driveState": "Normal Driving",
        "speed": 118,
        "rpm": 3964,
        "speedChange": -0.1,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1171,
        "brkPedal": 23,
        "createDate": "2024-12-10T01:28:11",
        "driveState": "Normal Driving",
        "speed": 118,
        "rpm": 3916,
        "speedChange": -0.1,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1044,
        "brkPedal": 16,
        "createDate": "2024-12-10T01:28:13",
        "driveState": "Normal Driving",
        "speed": 119,
        "rpm": 3896,
        "speedChange": 0.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1260,
        "brkPedal": -28,
        "createDate": "2024-12-10T01:28:15",
        "driveState": "Normal Driving",
        "speed": 118,
        "rpm": 3877,
        "speedChange": -1.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1294,
        "brkPedal": -32,
        "createDate": "2024-12-10T01:28:17",
        "driveState": "Normal Driving",
        "speed": 118,
        "rpm": 3902,
        "speedChange": 0.0,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1337,
        "brkPedal": -37,
        "createDate": "2024-12-10T01:28:18",
        "driveState": "Normal Driving",
        "speed": 117,
        "rpm": 3866,
        "speedChange": -0.8,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2201,
        "brkPedal": -44,
        "createDate": "2024-12-10T01:28:20",
        "driveState": "Rapid Acceleration",
        "speed": 117,
        "rpm": 3899,
        "speedChange": 0.6,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2606,
        "brkPedal": -47,
        "createDate": "2024-12-10T01:28:22",
        "driveState": "Rapid Acceleration",
        "speed": 118,
        "rpm": 3944,
        "speedChange": 0.6,
        "carId": "01가1234"
    },
    {
        "aclPedal": 2249,
        "brkPedal": -47,
        "createDate": "2024-12-10T01:28:23",
        "driveState": "Rapid Acceleration",
        "speed": 119,
        "rpm": 3987,
        "speedChange": 0.6,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1123,
        "brkPedal": -54,
        "createDate": "2024-12-10T01:28:25",
        "driveState": "Normal Driving",
        "speed": 118,
        "rpm": 3987,
        "speedChange": -0.9,
        "carId": "01가1234"
    },
    {
        "aclPedal": 970,
        "brkPedal": -54,
        "createDate": "2024-12-10T01:28:27",
        "driveState": "Normal Driving",
        "speed": 117,
        "rpm": 3996,
        "speedChange": -0.2,
        "carId": "01가1234"
    },
    {
        "aclPedal": 916,
        "brkPedal": -4,
        "createDate": "2024-12-10T01:28:29",
        "driveState": "Normal Driving",
        "speed": 118,
        "rpm": 3997,
        "speedChange": 0.1,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1169,
        "brkPedal": -42,
        "createDate": "2024-12-10T01:28:31",
        "driveState": "Normal Driving",
        "speed": 117,
        "rpm": 4000,
        "speedChange": -0.5,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1175,
        "brkPedal": -52,
        "createDate": "2024-12-10T01:28:32",
        "driveState": "Normal Driving",
        "speed": 117,
        "rpm": 4000,
        "speedChange": -0.4,
        "carId": "01가1234"
    },
    {
        "aclPedal": 1105,
        "brkPedal": -50,
        "createDate": "2024-12-10T01:28:34",
        "driveState": "Normal Driving",
        "speed": 117,
        "rpm": 3999,
        "speedChange": 0.8,
        "carId": "01가1234"
    },
    {
        "aclPedal": 987,
        "brkPedal": -47,
        "createDate": "2024-12-10T01:28:36",
        "driveState": "Normal Driving",
        "speed": 117,
        "rpm": 4000,
        "speedChange": -0.8,
        "carId": "01가1234"
    },
]



def main():
    prev_speed = 0
    try:
        # 더미 데이터 보내기
        # for record in EXTRACTED_DATA:
        #     # 1) 원본 record를 건드리지 않기 위해 copy() 사용
        #     data_to_send = record.copy()

        #     # 2) 전송 시각으로 createDate 덮어쓰기
        #     data_to_send["createDate"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        #     # 3) JSON 직렬화 → bytes
        #     json_str = json.dumps(data_to_send, ensure_ascii=False)
        #     sensor_bytes = json_str.encode("utf-8")

        #     # 4) Chaotic 암호화 → packet
        #     packet = encrypt_sensor_data(sensor_bytes, INITIAL_SEED)

        #     # 5) Base64 인코딩 후 MQTT 발행
        #     b64_str = base64.b64encode(packet).decode("utf-8")
        #     client.publish(TOPIC, b64_str, qos=0, retain=False)
        #     print(f"[Published(Base64)] {TOPIC} → {json_str}")

        #     # 원하는 간격만큼 대기 (예: 1초)
        #     time.sleep(1)

        # client.disconnect()
        # print("모든 데이터 전송 완료, MQTT 연결 해제.")
        
        while True:
            
            # 1) 가짜 데이터 생성
            data_dict, prev_speed = generate_fake_data(prev_speed)

            # 2) JSON → bytes
            json_str = json.dumps(data_dict, ensure_ascii=False)
            sensor_bytes = json_str.encode('utf-8')

            # 3-1) 헤더 JSON
            header_dict  = {"createdAt": data_dict["createDate"]}

            # 3-2) TOTP seed 계산
            ts_str = header_dict["createdAt"]
            dt = datetime.strptime(ts_str, '%Y-%m-%dT%H:%M:%S')
            dt = dt.replace(tzinfo=timezone.utc)
            timestamp_totp = int(dt.timestamp())
            totp_code = generate_totp(SECRET_BASE64, timestamp_totp)

            # 3-3) 암호화
            encrypted_body = encrypt_sensor_data(sensor_bytes, totp_code)

            # 4) Base64 인코딩
            b64_body = base64.b64encode(encrypted_body).decode('utf-8')

            # 5) Envelope JSON 생성
            envelope = {
                "header": header_dict,
                "data": b64_body
            }
            envelope_str = json.dumps(envelope, ensure_ascii=False)

            # 6) 발행
            client.publish(TOPIC, envelope_str, qos=0, retain=False)
            print(f"[Published(Envelope) {totp_code}] {envelope_str}")

            time.sleep(1)

    except KeyboardInterrupt:
        print("중단 요청 받음, 종료합니다.")
    finally:
        client.disconnect()
        print("MQTT 연결 해제 완료.")

if __name__ == "__main__":
    main()
