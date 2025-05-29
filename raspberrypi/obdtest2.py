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
import pint

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

# COM 포트 설정 및 타임아웃 증가
connection = obd.OBD("/dev/rfcomm0", fast=False)

# 연결 상태 확인
if connection.is_connected():
    print("OBD-II 연결 성공!")
else:
    print("OBD-II 연결 실패!")
    exit()


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

# 이미지 로드
accel_img_normal = ImageTk.PhotoImage(Image.open("accel_normal.png").resize((365, 500)))
accel_img_dark = ImageTk.PhotoImage(Image.open("accel_dark.png").resize((365, 500)))
brake_img_normal = ImageTk.PhotoImage(Image.open("brake_normal.png").resize((365, 500)))
brake_img_dark = ImageTk.PhotoImage(Image.open("brake_dark.png").resize((365, 500)))

# 이미지 레이블 생성
accel_label = tk.Label(root, image=accel_img_dark, bg="black")
accel_label.config(width=accel_img_normal.width(), height=accel_img_normal.height())  # 이미지 크기에 맞게 레이블 크기 설정
accel_label.place(relx=0.42, rely=0.5, anchor="center")  # 윈도우 중앙에 배치

brake_label = tk.Label(root, image=brake_img_dark, bg="black")
brake_label.config(width=brake_img_normal.width(), height=brake_img_normal.height())  # 이미지 크기에 맞게 레이블 크기 설정
brake_label.place(relx=-0.04, rely=0.5, anchor="w")  # 왼쪽 중앙에 배치


#data부분을 나중에 속도 데이터로 넣으면될꺼같음 
text_label = tk.Label(root, text=f"현재 ", font=font_large, bg="black", fg="white", padx=2, pady=10, width=9)
text_label.place(relx=0.85, rely=0.05, anchor='ne')


# pygame 초기화
pygame.mixer.init()

# 음성 재생 시간 기록
is_accelerating = False
last_sound_time = {
    "Unintended Acceleration": 0,
    "Rapid Acceleration": 0,
    "Rapid Braking": 0,
    "Both Feet Driving": 0
}

sound_delay = 3  # 음성 재생 간격
state_hold_time = 3  # 상태 유지 시간

# MQTT 설정
client = mqtt.Client()
client.connect(ip(), 1222, 60)

# 상태 업데이트 및 이미지 전환 함수
def update_display_state(accel_value, brake_value, state):
    global data # driveState를 초기화하려면 필요한 코드
    # 엑셀 이미지 상태 업데이트
    if accel_value <= 100:
        if accel_label.cget("image") != str(accel_img_dark):  # 같은 이미지라면 업데이트 안함
            accel_label.config(image=accel_img_dark)

    else:
        if accel_label.cget("image") != str(accel_img_normal):
            accel_label.config(image=accel_img_normal)

    # 브레이크 이미지 상태 업데이트
    if brake_value <= 100:
        if brake_label.cget("image") != str(brake_img_dark):
            brake_label.config(image=brake_img_dark)

    else:
        if brake_label.cget("image") != str(brake_img_normal):
            brake_label.config(image=brake_img_normal)

#급발진 음성
rapidspeed_1_sound = pygame.mixer.Sound("rapidspeed_1.wav")
rapidspeed_2_sound = pygame.mixer.Sound("rapidspeed_2.wav")
rapidspeed_3_sound = pygame.mixer.Sound("rapidspeed_3.wav")
rapidspeed_4_sound = pygame.mixer.Sound("rapidspeed_4.wav")
nobrake_1_sound = pygame.mixer.Sound("nobrake_1.wav")
nobrake_2_sound = pygame.mixer.Sound("nobrake_2.wav")
nobrake_3_sound = pygame.mixer.Sound("nobrake_3.wav")
speedless_1_sound = pygame.mixer.Sound("speedless_1.wav")
speedless_2_sound = pygame.mixer.Sound("speedless_2.wav")
carstop_1_sound = pygame.mixer.Sound("carstop_1.wav")
carstop_2_sound = pygame.mixer.Sound("carstop_2.wav")

#급가속 음성
accelaccel_sound = pygame.mixer.Sound("accelaccel.wav")

#급감속 음성
brakebrake_sound = pygame.mixer.Sound("brakebrake.wav")

#양발운전 
bothdrive_sound = pygame.mixer.Sound("bothdrive.wav")


# 전역 변수
stop_sounds = False
is_playing_sounds = False  # 음성 재생 중 여부 확인 플래그

def play_sounds_in_sequence(sounds):
    global stop_sounds, is_playing_sounds
    stop_sounds = False
    is_playing_sounds = True  # 재생 시작 플래그 설정

    for sound in sounds:
        if stop_sounds:  # 플래그가 True이면 즉시 중단
            pygame.mixer.music.stop()  # 현재 재생 중인 음성 중단
            is_playing_sounds = False  # 상태 플래그 초기화
            return

        sound.play()
        while pygame.mixer.music.get_busy():  # 현재 음성이 재생 중일 때
            if stop_sounds:  # 중단 플래그 확인
                pygame.mixer.music.stop()  # 현재 음성 중단
                is_playing_sounds = False
                return
            time.sleep(0.1)  # 비차단 대기
        time.sleep(3) # 음성간 3초대기 

    is_playing_sounds = False  # 모든 음성 재생 완료 후 플래그 초기화



#전역 변수로 안전 상태 저장
prev_mqtt_state = None

# 마지막으로 재생된 상태를 저장하는 변수
last_played_state = None  # 전역 변수로 설정

rpm_reached_5000 = False

def check_info(accel_value, brake_value, rpm_value, speed_value):
    global stop_sounds, is_playing_sounds, prev_mqtt_state, prev_rpm, last_played_state, rpm_reached_5000, is_accelerating, last_accel_time, last_sound_time
    mqtt_state = None

    # 기본 상태 설정
    state = "Normal Driving" if not rpm_reached_5000 else "Unintended Acceleration"
    current_time = time.time()  # 현재 시간 기록

    # Unintended Acceleration + 5000 RPM 조건 결합
    if 700 < accel_value < 2000 and brake_value <= 100 and rpm_value >= 5000 and speed_value >= 40:
        state = "Unintended Acceleration"
        update_display_state(accel_value, brake_value, state)

        # 가속 상태 체크 및 시간 계산
        if not is_accelerating:
            last_accel_time = current_time
            is_accelerating = True

        elapsed_time = current_time - last_sound_time.get(state, 0)
        if (state != last_played_state) and elapsed_time >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            stop_sounds = True
            last_played_state = state
            is_playing_sounds = True
            rpm_reached_5000 = True  # 5000 RPM 도달 시 플래그 설정
            print("RPM 도달 상태:", rpm_reached_5000)
            sounds = [rapidspeed_1_sound, rapidspeed_2_sound, rapidspeed_3_sound, rapidspeed_4_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()

            # 3초 후 플래그 초기화
            threading.Timer(3, reset_playing_state).start()

    # 이후 RPM 감소 구간에 따른 음성 출력
    if rpm_reached_5000:
        elapsed_time = current_time - last_sound_time.get(state, 0)
        if rpm_value < 5000 and rpm_value >= 4000 and not is_playing_sounds:
            print("2번 케이스", rpm_value, prev_rpm)
            sounds = [nobrake_1_sound, nobrake_2_sound, nobrake_3_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
            is_playing_sounds = True
            threading.Timer(3, reset_playing_state).start()
        elif rpm_value < 4000 and rpm_value >= 3000 and not is_playing_sounds:
            print("3번 케이스", rpm_value, prev_rpm)
            sounds = [speedless_1_sound, speedless_2_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
            is_playing_sounds = True
            threading.Timer(3, reset_playing_state).start()
        elif rpm_value < 3000 and rpm_value >= 2000 and not is_playing_sounds:
            print("4번 케이스", rpm_value, prev_rpm)
            sounds = [carstop_1_sound, carstop_2_sound]
            threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
            is_playing_sounds = True
            rpm_reached_5000 = False  # 2000 RPM 이하로 떨어지면 플래그 초기화
            threading.Timer(3, reset_playing_state).start()

        prev_rpm = rpm_value

    # Rapid Acceleration 조건
    elif accel_value > 3000 and brake_value < 100 and rpm_value >= 2000:
        state = "Rapid Acceleration"
        update_display_state(accel_value, brake_value, state)
        mqtt_state = 1

        elapsed_time = current_time - last_sound_time.get(state, 0)
        if (state != last_played_state) and elapsed_time >= max(state_hold_time, sound_delay) and not is_playing_sounds:
            stop_sounds = False
            sounds = [accelaccel_sound]
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
            sounds = [brakebrake_sound]
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

def reset_playing_state():
    global is_playing_sounds, stop_sounds
    is_playing_sounds = False
    stop_sounds = False
    print("플래그 초기화 완료: is_playing_sounds=False, stop_sounds=False")





# 초기 값 설정
previous_speed = 0  # 이전 속도 (km/h)
previous_time = time.time()

def delta_speed(current_speed):
    global previous_speed, previous_time
    now_time = time.time()
    speed_change = current_speed - previous_speed
    time_elapsed = now_time - previous_time
    previous_speed = current_speed
    previous_time = now_time
    return speed_change / max(time_elapsed, 1)  # 속도 변화율 (초 단위)


# 데이터 수집 및 업데이트 함수
def run_code():
    state = "Normal Driving"
    global previous_speed, previous_time  # 전역 변수로 초기화 필요
    previous_speed = 0  # 이전 속도 초기값 설정
    previous_time = time.time()  # 이전 시간 초기값 설정

    while True:  # 데이터프레임의 길이에 따라 반복
        try:
            # 현재 시간 추가
            now = datetime.now()
            print("시작시간", now)
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

            # RPM 데이터 요청
            rpm_cmd = obd.commands.RPM
            rpm_response = connection.query(rpm_cmd)

            # 속도 데이터 요청
            speed_cmd = obd.commands.SPEED
            speed_response = connection.query(speed_cmd)


             # 속도 및 RPM 데이터 추가
            if speed_response.value is not None:
                #현재속도("km/h")
                speed_value = speed_response.value.magnitude
                print(speed_value)

            if rpm_response.value is not None:
                rpm_value = rpm_response.value.magnitude

            #print("rpm : ", rpm_value, "speed : ", speed_value)
            # 속도 변화 계산
            speed_change = delta_speed(speed_value)  # 속도 변화(kmh) 계산
            speed_change = round(speed_change, 1)

            # check_info 호출하여 음성 상태 평가 및 재생
            check_info(val_accelerator, val_brake, rpm_value, speed_value)


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

            client.publish('DriveLog', json.dumps(data), 0, retain=False)
            now2 = datetime.now()
            print("종료시간", now2)
            print("걸린시간 : ", now2-now)

        except Exception as error:
            print(error)
            continue

# 쓰레드로 run_code 실행
threading.Thread(target=run_code, daemon=True).start()

# Tkinter 메인 루프 시작
root.mainloop()