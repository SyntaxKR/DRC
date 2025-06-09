import time
import sys
import RPi.GPIO as GPIO
from datetime import datetime
from hx711 import HX711
import paho.mqtt.client as mqtt
import json
import tkinter as tk
from PIL import Image, ImageDraw, ImageFont, ImageTk, ImageOps
import threading
import pygame
from dotenv import load_dotenv
import obd
import random
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import pandas as pd
import os

import ssl
import base64
from mqtt_test import encrypt_sensor_data, INITIAL_SEED, TOPIC

load_dotenv()
SERVER_IP   = os.getenv("IP")
BROKER_HOST  = os.getenv("BROKER_HOST")
CA_CERT_PATH = os.getenv("MQTT_CA_CERT")
SERVER_PORT = os.getenv("PORT")
if SERVER_PORT is None:
    raise RuntimeError(".env에 PORT가 설정되지 않았습니다.")
SERVER_PORT = int(SERVER_PORT)
# SERVER_IP   = os.getenv("IP", "")               
# SERVER_PORT = os.getenv("PORT", "0")            

df = pd.read_csv("/home/drc/project/DRC/raspberrypi/audi_s1.csv", sep=',')

url = f"http://{SERVER_IP}:{SERVER_PORT}/data"

data = {
    "carId":     "01가1234",  # 차량 ID 설정
    "aclPedal":  0,
    "brkPedal":  0,
    "createDate": 0,
    "driveState": " ",
    "speed":      0,
    "rpm":        0,
    "speedChange": 0
}

def cleanAndExit():
    print("Cleaning...")
    GPIO.cleanup()  # GPIO 핀 해제
    print("Bye!")
    sys.exit()

# 첫 번째 HX711 - 엑셀(Accelerator)
hx1 = HX711(20, 16)
# 두 번째 HX711 - 브레이크(Brake)
hx2 = HX711(6, 5)

# MSB 순서로 설정
hx1.set_reading_format("MSB", "MSB")
hx2.set_reading_format("MSB", "MSB")

# 참조 단위 설정 (로드셀 보정값)
referenceUnit = 96
hx1.set_reference_unit(referenceUnit)
hx2.set_reference_unit(referenceUnit)

# 초기화 및 영점 설정
hx1.reset()
hx2.reset()
hx1.tare()
hx2.tare()

# Tkinter 창생성
root = tk.Tk()
root.title("Car Driving Display")
root.geometry("1000x600")
root.configure(bg="black")

# 폰트 설정
font_large = ("Arial", 35, "bold")

# 이미지 파일이 있는 'image' 폴더에서 로드
accel_img_normal = ImageTk.PhotoImage(Image.open("image/accel_normal.png").resize((430, 560)))
accel_img_dark = ImageTk.PhotoImage(Image.open("image/accel_dark.png").resize((430, 560)))
brake_img_normal = ImageTk.PhotoImage(Image.open("image/brake_normal.png").resize((430, 560)))
brake_img_dark = ImageTk.PhotoImage(Image.open("image/brake_dark.png").resize((430, 560)))

# 이미지 레이블 생성
accel_label = tk.Label(root, image=accel_img_dark, bg="black")
accel_label.config(width=accel_img_normal.width(), height=accel_img_normal.height())  # 이미지 크기에 맞게 레이블 크기 설정
accel_label.place(relx=1, rely=0.5, anchor="e")  # 윈도우 중앙에 배치

brake_label = tk.Label(root, image=brake_img_dark, bg="black")
brake_label.config(width=brake_img_normal.width(), height=brake_img_normal.height())  # 이미지 크기에 맞게 레이블 크기 설정
brake_label.place(relx=-0.04, rely=0.5, anchor="w")  # 왼쪽 중앙에 배치


#data부분을 나중에 속도 데이터로 넣으면될꺼같음 아마도? 
text_label = tk.Label(root, text=f"현재 속도", font=font_large, bg="black", fg="white", padx=2, pady=10, width=11)
text_label.place(relx=0.5, rely=0.3, anchor='center')

rpm_label = tk.Label(root, text=f"현재 RPM", font=font_large, bg="black", fg="white", padx=2, pady=10, width=11)
rpm_label.place(relx=0.5, rely=0.5, anchor='center')


# pygame 초기화
pygame.mixer.init()

# 음성 재생 시간 기록
is_accelerating = False

# MQTT 설정
client = mqtt.Client()
client.tls_set(
    ca_certs=CA_CERT_PATH,
    tls_version=ssl.PROTOCOL_TLSv1_2
)

try:
    client.connect(BROKER_HOST, int(SERVER_PORT), 60)
    client.loop_start()
    print(f"MQTT Broker에 연결됨: {BROKER_HOST}:{SERVER_PORT}") 
except Exception as e:
    print("MQTT 연결 실패:", e)

sound_delay = 3  # 음성 재생 간격
state_hold_time = 3  # 상태 유지 시간

# 상태 업데이트 및 이미지 전환 함수
def update_display_state(accel_value, brake_value, state):
    global data # driveState를 초기화하려면 필요한 코드
    # 엑셀 이미지 상태 업데이트
    if accel_value <= 200:
        if accel_label.cget("image") != str(accel_img_dark):  # 같은 이미지라면 업데이트 안함
            accel_label.config(image=accel_img_dark)

    else:
        if accel_label.cget("image") != str(accel_img_normal):
            accel_label.config(image=accel_img_normal)

    # 브레이크 이미지 상태 업데이트
    if brake_value <= 200:
        if brake_label.cget("image") != str(brake_img_dark):
            brake_label.config(image=brake_img_dark)

    else:
        if brake_label.cget("image") != str(brake_img_normal):
            brake_label.config(image=brake_img_normal)
# 디렉토리 경로 설정
sound_dir = "sound"

# 급발진 음성
rapidspeed_1_sound = pygame.mixer.Sound(f"{sound_dir}/rapidspeed_1.wav")
rapidspeed_2_sound = pygame.mixer.Sound(f"{sound_dir}/rapidspeed_2.wav")
rapidspeed_3_sound = pygame.mixer.Sound(f"{sound_dir}/rapidspeed_3.wav")
rapidspeed_4_sound = pygame.mixer.Sound(f"{sound_dir}/rapidspeed_4.wav")
nobrake_1_sound = pygame.mixer.Sound(f"{sound_dir}/nobrake_1.wav")
nobrake_2_sound = pygame.mixer.Sound(f"{sound_dir}/nobrake_2.wav")
nobrake_3_sound = pygame.mixer.Sound(f"{sound_dir}/nobrake_3.wav")
speedless_1_sound = pygame.mixer.Sound(f"{sound_dir}/speedless_1.wav")
speedless_2_sound = pygame.mixer.Sound(f"{sound_dir}/speedless_2.wav")
carstop_1_sound = pygame.mixer.Sound(f"{sound_dir}/carstop_1.wav")
carstop_2_sound = pygame.mixer.Sound(f"{sound_dir}/carstop_2.wav")

# 급가속 음성
accelaccel_sound = pygame.mixer.Sound(f"{sound_dir}/accelaccel.wav")
accel_rapid_sound = pygame.mixer.Sound(f"{sound_dir}/accel_rapid.wav")

# 급감속 음성
brakebrake_sound = pygame.mixer.Sound(f"{sound_dir}/brakebrake.wav")
rapidbraking_sound = pygame.mixer.Sound(f"{sound_dir}/rapidbraking.wav")

# 양발운전
bothdrive_sound = pygame.mixer.Sound(f"{sound_dir}/bothdrive.wav")


# 전역 변수
stop_sounds = False
is_playing_sounds = False  # 음성 재생 중 여부 확인 플래그

# 음성을 비차단 방식으로 재생하는 함수
def play_sounds_in_sequence(sounds):
    global stop_sounds, is_playing_sounds
    stop_sounds = False
    is_playing_sounds = True  # 재생 시작 플래그 설정

    for sound in sounds:
        # 조건이 변경되면 음성 재생 중단
        if stop_sounds:
            print("음성 재생 중단")
            break

        sound.play()
        while pygame.mixer.music.get_busy():  # 현재 음성이 재생 중일 때 대기
            if stop_sounds:  # 중단 플래그 확인
                pygame.mixer.music.stop()  # 현재 재생 중인 음성도 중단
                is_playing_sounds = False  # 재생 상태 플래그 해제
                return
            time.sleep(0.1)  # 비차단 대기
        time.sleep(5)  # 음성 간 3초 간격

    is_playing_sounds = False  # 모든 음성 재생 완료 후 플래그 해제


#전역 변수로 안전 상태 저장
prev_mqtt_state = None

# 마지막으로 재생된 상태를 저장하는 변수
last_played_state = None  # 전역 변수로 설정

rpm_reached_5000 = False


# 유지 시간 설정 (상태가 3초 이상 유지되어야 음성 재생)
MIN_STATE_HOLD_TIME = 3  # 상태 유지 최소 시간 
RESET_PLAYING_STATE_TIME = {  # 상태별 재생 가능 시간 설정
    "Unintended Acceleration": 27,
    "nobrake": 22,
    "speedless": 22,
    "carstop": 22,
    "Rapid Acceleration": 14,
    "Rapid Braking": 14,
    "Both Feet Driving": 14
}

is_accelerating = False
last_sound_time = {
    "Unintended Acceleration": 0,
    "Rapid Acceleration": 0,
    "Rapid Braking": 0,
    "Both Feet Driving": 0
}
# 현재 상태 유지 시작 시간 저장
state_start_times = {}
prev_rpm = 0
def reset_playing_state():
    global is_playing_sounds, stop_sounds
    is_playing_sounds = False
    stop_sounds = False
    print("플래그 초기화 완료: is_playing_sounds=False, stop_sounds=False")

def check_info(accel_value, brake_value, rpm_value):
    global stop_sounds, is_playing_sounds, prev_mqtt_state, prev_rpm, last_played_state
    global rpm_reached_5000, is_accelerating, last_accel_time, last_sound_time

    mqtt_state = None
    state = "Normal Driving" if not rpm_reached_5000 else "Unintended Acceleration"
    current_time = time.time()

    # Unintended Acceleration + 5000 RPM
    if brake_value >= 1000 and rpm_value >= 5000:
        state = "Unintended Acceleration"
        root.after(0, update_display_state, accel_value, brake_value, state)

        if not is_accelerating:
            last_accel_time = current_time
            is_accelerating = True

        elapsed = current_time - last_sound_time.get(state, 0)
        if state != last_played_state and elapsed >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            stop_sounds = True
            last_played_state = state
            is_playing_sounds = True
            rpm_reached_5000 = True
            print("RPM 도달 상태:", rpm_reached_5000)
            threading.Thread(target=play_sounds_in_sequence,
                             args=([rapidspeed_1_sound, rapidspeed_2_sound,
                                    rapidspeed_3_sound, rapidspeed_4_sound],),
                             daemon=True).start()
            threading.Timer(3, reset_playing_state).start()

    # RPM 감소 구간
    if rpm_reached_5000:
        elapsed = current_time - last_sound_time.get(state, 0)

        if 4000 <= rpm_value < 5000 and not is_playing_sounds:
            print("노브레이크 상황", rpm_value, prev_rpm)
            threading.Thread(target=play_sounds_in_sequence,
                             args=([nobrake_1_sound, nobrake_2_sound, nobrake_3_sound],),
                             daemon=True).start()
            threading.Timer(150, reset_playing_state).start()

        elif 3000 <= rpm_value < 4000 and not is_playing_sounds:
            print("점점 스피드가 줄어드는 상황", rpm_value, prev_rpm)
            threading.Thread(target=play_sounds_in_sequence,
                             args=([speedless_1_sound, speedless_2_sound],),
                             daemon=True).start()
            threading.Timer(150, reset_playing_state).start()

        elif 2000 <= rpm_value < 3000 and not is_playing_sounds:
            print("차가 점점 멈추는 상황", rpm_value, prev_rpm)
            threading.Thread(target=play_sounds_in_sequence,
                             args=([carstop_1_sound, carstop_2_sound],),
                             daemon=True).start()
            threading.Timer(150, reset_playing_state).start()
            if rpm_value < 2000:
                rpm_reached_5000 = False

        prev_rpm = rpm_value

    # Rapid Acceleration
    elif accel_value > 2000 and brake_value < 100 and rpm_value >= 2000:
        state = "Rapid Acceleration"
        root.after(0, update_display_state, accel_value, brake_value, state)
        mqtt_state = 1

        elapsed = current_time - last_sound_time.get(state, 0)
        if state != last_played_state and elapsed >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            threading.Thread(target=play_sounds_in_sequence,
                             args=([accel_rapid_sound],),
                             daemon=True).start()
            last_sound_time[state] = current_time
            last_played_state = state
            threading.Timer(3, reset_playing_state).start()

    # Rapid Braking
    elif brake_value > 3000 and accel_value <= 100:
        state = "Rapid Braking"
        root.after(0, update_display_state, accel_value, brake_value, state)
        mqtt_state = 2

        elapsed = current_time - last_sound_time.get(state, 0)
        if state != last_played_state and elapsed >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            threading.Thread(target=play_sounds_in_sequence,
                             args=([rapidbraking_sound],),
                             daemon=True).start()
            last_sound_time[state] = current_time
            last_played_state = state
            threading.Timer(3, reset_playing_state).start()

    # Both Feet Driving
    elif accel_value > 500 and brake_value > 500:
        state = "Both Feet Driving"
        root.after(0, update_display_state, accel_value, brake_value, state)
        mqtt_state = 3

        elapsed = current_time - last_sound_time.get(state, 0)
        if state != last_played_state and elapsed >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            threading.Thread(target=play_sounds_in_sequence,
                             args=([bothdrive_sound],),
                             daemon=True).start()
            last_sound_time[state] = current_time
            last_played_state = state
            threading.Timer(3, reset_playing_state).start()

    # Normal Driving
    else:
        state = "Normal Driving"
        root.after(0, update_display_state, accel_value, brake_value, state)
        is_accelerating = False
        stop_sounds = True
        last_played_state = None
        is_playing_sounds = False

    data["driveState"] = state

    # MQTT 상태 전송
    if mqtt_state is not None and mqtt_state != prev_mqtt_state:
        alert_data = {"carId": "01가1234", "state": mqtt_state}
        print(alert_data)
        client.publish('AbnormalDriving', json.dumps(alert_data), 0, retain=False)
        prev_mqtt_state = mqtt_state

    
    # MQTT 상태 전송
    if mqtt_state is not None and mqtt_state != prev_mqtt_state:
        alert_data = {
            "carId": "01가1234",
            "state": mqtt_state
        }
        print(alert_data)
        client.publish('AbnormalDriving', json.dumps(alert_data), 0, retain=False)
        prev_mqtt_state = mqtt_state

# 초기 값 설정
previous_speed = 0  # 이전 속도 (km/h)
previous_time = time.time()

#1초마다 KM/H계산 툴
def delta_speed(current_speed):
    global previous_speed, previous_time

    current_time = time.time()
    kmh = current_speed - previous_speed  # 속도 변화 (km/h)
    
    # 이전 속도와 시간 업데이트
    previous_speed = current_speed
    previous_time = current_time

    return kmh

def get_safe_weight(hx, label):
    try:
        print(f"[GET_WEIGHT] {label} 측정 시작")
        weight = hx.get_weight(5)
        print(f"[GET_WEIGHT] {label} = {weight}g")
        return weight
    except Exception as e:
        print(f"[ERROR] {label} 로드셀 읽기 실패: {e}")
        return 0


def run_code():
    print("🚀 run_code() 시작됨")
    i = 0
    global previous_speed, previous_time
    previous_speed = 0
    previous_time = time.time()

    # CSV 유효성 검사
    if df is None or df.empty:
        print("❌ CSV 데이터가 비어있습니다. 종료.")
        return

    while i < len(df):
        try:
            print(f"\n[🔁 LOOP {i}]")

            # 👉 센서 데이터 안전하게 읽기
            val_accel = get_safe_weight(hx1, "엑셀")
            val_brake = get_safe_weight(hx2, "브레이크")

            # 전원 주기적 리셋 (필수)
            try:
                hx1.power_down()
                hx2.power_down()
                hx1.power_up()
                hx2.power_up()
            except Exception as pwr_err:
                print(f"[WARNING] 센서 전원 리셋 실패: {pwr_err}")

            # 👉 CSV 데이터 읽기
            try:
                rpm_value = df.iloc[i].get('Engine RPM', 0)
                speed_value = df.iloc[i].get('Ground Speed', 0)
                speed_value = 0 if pd.isna(speed_value) else speed_value
                print(f"[CSV] RPM={rpm_value}, SPEED={speed_value}")
            except Exception as e:
                print(f"[ERROR] CSV 로딩 실패: {e}")
                i += 1
                continue

            # 속도 변화 계산
            speed_change = round(delta_speed(speed_value), 1)

            # 상태 판단 + UI 업데이트
            root.after(0, update_display_state, val_accel, val_brake, data["driveState"])
            check_info(val_accel, val_brake, rpm_value)

            now = datetime.now()
            data.update({
                "carId": "01가1234",
                "aclPedal": int(val_accel),
                "brkPedal": int(val_brake),
                "createDate": now.strftime('%Y-%m-%dT%H:%M:%S'),
                "driveState": data["driveState"],
                "speed": int(speed_value),
                "rpm": int(rpm_value),
                "speedChange": speed_change
            })

            print(f"[📦 MQTT 전송 DATA] {data}")

            # UI 텍스트 업데이트
            root.after(0, lambda v=speed_value: text_label.config(text=f"현재 : {int(v)}"))
            root.after(0, lambda r=rpm_value: rpm_label.config(text=f"RPM : {int(r)}"))

            # MQTT 전송
            try:
                json_str = json.dumps(data, ensure_ascii=False)
                sensor_bytes = json_str.encode('utf-8')
                packet = encrypt_sensor_data(sensor_bytes, INITIAL_SEED)
                b64_str = base64.b64encode(packet).decode('utf-8')
                client.publish(TOPIC, b64_str, qos=0, retain=False)
            except Exception as mqtt_error:
                print(f"[MQTT ERROR] {mqtt_error}")

            i += 1
            time.sleep(1)

        except Exception as e:
            print(f"[🔥 LOOP ERROR] {e}")
            import traceback
            traceback.print_exc()
            time.sleep(1)
            continue


if __name__ == "__main__":
    print("📡 MQTT 연결 시도 중...")
    client.loop_start()

    print("🧵 백그라운드 run_code 쓰레드 실행")
    threading.Thread(target=run_code, daemon=True).start()

    print("🖼️ Tkinter 메인 루프 실행 시작")
    root.mainloop()
    

