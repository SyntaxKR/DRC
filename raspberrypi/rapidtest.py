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
from server import ip, port
import obd
import random
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import pandas as pd


df = pd.read_csv("/home/drc/DRC/DRC/audi_s1.csv", sep=',')


# 서버 URL 설정
url = f'http://{ip()}:{port()}/data'

# 데이터 구조 정의
data = {
    "carId": "01가1234",  # 차량 ID 설정
    "aclPedal": 0,
    "brkPedal": 0,
    "createDate": 0,
    "driveState": " ",
    "speed" : 0,
    "rpm" : 0,
    "speedChange" : 0
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


#data부분을 나중에 속도 데이터로 넣으면될꺼같음 
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
client.connect(ip(), 1222, 60)

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
    global stop_sounds, is_playing_sounds, prev_mqtt_state, prev_rpm, last_played_state, rpm_reached_5000, is_accelerating, last_accel_time, last_sound_time
    mqtt_state = None
    
    # 기본 상태 설정
    state = "Normal Driving" if not rpm_reached_5000 else "Unintended Acceleration"
    current_time = time.time()  # 현재 시간 기록

    # Unintended Acceleration + 5000 RPM 조건 결합
    if brake_value >= 1000 and rpm_value >= 5000:
        state = "Unintended Acceleration"
        update_display_state(accel_value, brake_value, state)

        # 가속 상태 체크 및 시간 계산
        if not is_accelerating:
            last_accel_time = current_time
            is_accelerating = True

        elapsed_time = current_time - last_sound_time.get(state, 0)
        if (state != last_played_state) and elapsed_time >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            stop_sounds = True  # 음성을 중단
            last_played_state = state
            is_playing_sounds = True
            rpm_reached_5000 = True  # 5000 RPM 도달 시 플래그 설정
            print("RPM 도달 상태:", rpm_reached_5000)
            sounds = [rapidspeed_1_sound, rapidspeed_2_sound, rapidspeed_3_sound, rapidspeed_4_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
            # 3초 후 플래그 초기화
            threading.Timer(3, reset_playing_state).start()

    # RPM 감소 구간에 따른 음성 출력
    if rpm_reached_5000:
        elapsed_time = current_time - last_sound_time.get(state, 0)
        
        # 4000 RPM 이상에서 노브레이크 음성 처리
        if rpm_value < 5000 and rpm_value >= 4000 and not is_playing_sounds:
            print("노브레이크 상황", rpm_value, prev_rpm)
            sounds = [nobrake_1_sound, nobrake_2_sound, nobrake_3_sound]
            
            if not is_playing_sounds:
                is_playing_sounds = True
                threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
                threading.Timer(150, reset_playing_state).start()

        # 3000 RPM 이상에서 스피드 감소 음성 처리
        elif rpm_value < 4000 and rpm_value >= 3000 and not is_playing_sounds:
            print("점점 스피드가 줄어드는 상황", rpm_value, prev_rpm)
            sounds = [speedless_1_sound, speedless_2_sound]
            
            if not is_playing_sounds:
                is_playing_sounds = True
                threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
                threading.Timer(150, reset_playing_state).start()

        # 2000 RPM 이하에서 차가 멈추는 상황 음성 처리
        elif rpm_value < 3000 and rpm_value >= 2000 and not is_playing_sounds:
            print("차가 점점 멈추는 상황", rpm_value, prev_rpm)
            sounds = [carstop_1_sound, carstop_2_sound]
            
            if not is_playing_sounds:
                is_playing_sounds = True
                threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
                #rpm_reached_5000 = False  # 2000 RPM 이하로 떨어지면 플래그 초기화
                threading.Timer(150, reset_playing_state).start()
            
            # 조건을 벗어나면 rpm_reached_5000 초기화
            if rpm_value < 2000:
                print("3000~2000 RPM 구간을 벗어남, 플래그 초기화")
                rpm_reached_5000 = False
            
        prev_rpm = rpm_value





    # Rapid Acceleration 조건
    elif accel_value > 2000 and brake_value < 100 and rpm_value >= 2000:
        state = "Rapid Acceleration"
        update_display_state(accel_value, brake_value, state)
        mqtt_state = 1

        elapsed_time = current_time - last_sound_time.get(state, 0)
        if (state != last_played_state) and elapsed_time >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            stop_sounds = False
            sounds = [accel_rapid_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
            last_sound_time[state] = current_time
            last_played_state = state
            is_playing_sounds = True
            threading.Timer(3, reset_playing_state).start()

    # Rapid Braking 조건
    elif brake_value > 3000 and accel_value <= 100:
        state = "Rapid Braking"
        update_display_state(accel_value, brake_value, state)
        mqtt_state = 2

        elapsed_time = current_time - last_sound_time.get(state, 0)
        if (state != last_played_state) and elapsed_time >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            stop_sounds = False
            sounds = [rapidbraking_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
            last_sound_time[state] = current_time
            last_played_state = state
            is_playing_sounds = True
            threading.Timer(3, reset_playing_state).start()

    # Both Feet Driving 조건
    elif accel_value > 500 and brake_value > 500:
        state = "Both Feet Driving"
        update_display_state(accel_value, brake_value, state)
        mqtt_state = 3

        elapsed_time = current_time - last_sound_time.get(state, 0)
        if (state != last_played_state) and elapsed_time >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            stop_sounds = False
            sounds = [bothdrive_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
            last_sound_time[state] = current_time
            last_played_state = state
            is_playing_sounds = True
            threading.Timer(3, reset_playing_state).start()

    # 상태가 Normal로 돌아왔을 때
    else:
        state = "Normal Driving"
        update_display_state(accel_value, brake_value, state)
        is_accelerating = False
        stop_sounds = True
        last_played_state = None
        is_playing_sounds = False
    
    data["driveState"] = state
    
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


# 데이터 수집 및 업데이트 함수
def run_code():
    i = 0
    state = "Normal Driving"
    global previous_speed, previous_time  # 전역 변수로 초기화 필요
    previous_speed = 0  # 이전 속도 초기값 설정
    previous_time = time.time()  # 이전 시간 초기값 설정
    
    while i < len(df):  # 데이터프레임의 길이에 따라 반복
        try:
            # 첫 번째 로드셀 (엑셀)
            val_accelerator = hx1.get_weight(5)
            print(f"현재상태 : 액셀(Accelerator)  무게: {val_accelerator} g")

            # 두 번째 로드셀 (브레이크)
            val_brake = hx2.get_weight(5)
            print(f"현재상태 : 브레이크(Brake) 무게: {val_brake} g")
            
            hx1.power_down()
            hx2.power_down()
            hx1.power_up()
            hx2.power_up()
            
            # 상태 업데이트 및 UI 갱신
            update_display_state(val_accelerator, val_brake, state)
            
            rpm_value = df.iloc[i]['Engine RPM']  # Engine RPM 칼럼 값
            speed_value = df.iloc[i]['Ground Speed']  # Ground Speed 칼럼 값
            if pd.isna(speed_value):
                speed_value = 0  # 기본값 설정

            print("rpm : ", rpm_value, "speed : ", speed_value)
            # 속도 변화 계산
            speed_change = delta_speed(speed_value)  # 속도 변화(kmh) 계산
            speed_change = round(speed_change, 1)
            
            # check_info 호출하여 음성 상태 평가 및 재생
            check_info(val_accelerator, val_brake, rpm_value)
            
            # 현재 시간 추가
            now = datetime.now()
            data.update({
                "carId": "01가1234",  # 차량 ID 유지
                "aclPedal": int(val_accelerator),
                "brkPedal": int(val_brake),
                "createDate": now.strftime('%Y-%m-%dT%H:%M:%S'),
                "driveState": data["driveState"],  # 기존 driveState 유지
                "speed": int(speed_value),
                "rpm": int(rpm_value),
                "speedChange":speed_change  # speedChange data["kmh"]
            })             
            print(data)
            # 레이블 업데이트 (정수 형식)
            text_label.config(text=f"현재 : {int(speed_value)}")    
            rpm_label.config(text=f"RPM : {int(rpm_value)}")
            client.publish('DriveLog', json.dumps(data), 0, retain=False)
            i += 1
            time.sleep(1)

        except Exception as error:
            print(error)
            continue

# 쓰레드로 run_code 실행
threading.Thread(target=run_code, daemon=True).start()

# Tkinter 메인 루프 시작
root.mainloop()
