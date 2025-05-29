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

# 서버 URL 설정
url = f'http://{ip()}:{port()}/data'

# 데이터 구조 정의
data = {
    "carId": "01가1234",  # 차량 ID 설정
    "aclPedal": 0,
    "brkPedal": 0,
    "createDate": 0,
    "driveState": " ",
    "speed" : 50,
    "rpm" : 2000,
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
font_large = ("Arial", 40, "bold")

# 이미지 로드
accel_img_normal = ImageTk.PhotoImage(Image.open("accel_normal.png").resize((430, 560)))
accel_img_dark = ImageTk.PhotoImage(Image.open("accel_dark.png").resize((430, 560)))
brake_img_normal = ImageTk.PhotoImage(Image.open("brake_normal.png").resize((430, 560)))
brake_img_dark = ImageTk.PhotoImage(Image.open("brake_dark.png").resize((430, 560)))

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

#OBD 연결 및 데이터 요청 
#connection = obd.OBD()

#테스트 출력 확인
#print("Speed:", speed_response.value)  # km/h 단위
#print("RPM:", rpm_response.value)      # RPM 단위

# 음성 재생 시간 기록
last_accel_time = 0
is_accelerating = False
last_brake_time = 0
last_both_time = 0
last_speed_time = 0

# MQTT 설정
client = mqtt.Client()
client.connect(ip(), 1222, 60)

# 테스트 예시 
def generate_random_speed(min_speed=0, max_speed=200):
    """
    랜덤 속도를 생성하는 함수
    
    Parameters:
    min_speed (int): 최소 속도 (기본값 0 km/h)
    max_speed (int): 최대 속도 (기본값 120 km/h)
    
    Returns:
    int: 랜덤하게 생성된 속도 (km/h)
    """
    return random.randint(min_speed, max_speed)


# 상태 업데이트 및 이미지 전환 함수
def update_display_state(accel_value, brake_value, state):
    global data # driveState를 초기화하려면 필요한 코드
    # 엑셀 이미지 상태 업데이트
    if accel_value <= 30:
        if accel_label.cget("image") != str(accel_img_dark):  # 같은 이미지라면 업데이트 안함
            accel_label.config(image=accel_img_dark)

    else:
        if accel_label.cget("image") != str(accel_img_normal):
            accel_label.config(image=accel_img_normal)

    # 브레이크 이미지 상태 업데이트
    if brake_value <= 30:
        if brake_label.cget("image") != str(brake_img_dark):
            brake_label.config(image=brake_img_dark)

    else:
        if brake_label.cget("image") != str(brake_img_normal):
            brake_label.config(image=brake_img_normal)

#급발진 음성
rapidspeed_1_sound = pygame.mixer.Sound("rapidspeed_1.wav")
rapidspeed_2_sound = pygame.mixer.Sound("rapidspeed_2.wav")
rapidspeed_3_sound = pygame.mixer.Sound("rapidspeed_3.wav")
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
                print("음성 재생 중단")
                is_playing_sounds = False  # 재생 상태 플래그 해제
                return
            time.sleep(0.1)  # 비차단 대기
        time.sleep(3)  # 음성 간 3초 간격

    is_playing_sounds = False  # 모든 음성 재생 완료 후 플래그 해제

#전역 변수로 안전 상태 저장
prev_mqtt_state = None

# 로드셀 데이터와 상태를 업데이트하는 함수    # 급발진 조건을 수정하자 accel_value < 2000 and brake_value > 3000 and speed >= 40 and rpm > 2000:
def check_info(accel_value, brake_value):
    global last_accel_time, is_accelerating, stop_sounds, is_playing_sounds, prev_mqtt_state, last_brake_time, last_both_time, last_speed_time
    mqtt_state = None
    state = "Normal Driving"
    # Unintended Acceleration
    if 200 < accel_value < 1000 and brake_value <= 30:    
        state = "Unintended Acceleration"
        update_display_state(accel_value, brake_value, state)
        if not is_accelerating:
            last_accel_time = time.time()
            is_accelerating = True
        else:
            elapsed_time = time.time() - last_accel_time
            if elapsed_time >= 4 and not is_playing_sounds:
                stop_sounds = True  
                time.sleep(0.2)
                sounds = [
                    rapidspeed_1_sound, rapidspeed_2_sound, rapidspeed_3_sound,
                    nobrake_1_sound, nobrake_2_sound, nobrake_3_sound,
                    speedless_1_sound, speedless_2_sound,
                    carstop_1_sound, carstop_2_sound
                ]
                threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
                last_accel_time = time.time()

    # Rapid Acceleration
    elif accel_value > 1000 and brake_value <= 30:   # accel_value > 1000 and brake_value <= 100 and speed >= 6 and speed     and rpm :
        state = "Rapid Acceleration"
        update_display_state(accel_value, brake_value, state)
        mqtt_state = 1
        if not is_accelerating:
            last_speed_time = time.time()
            is_accelerating = True
        else:
            elapsed_time = time.time() - last_speed_time
            if elapsed_time >= 3 and not is_playing_sounds:
                stop_sounds = True
                time.sleep(0.2)
                sounds = [accelaccel_sound]
                print("Rapid Acceleration 음성 재생 시작")
                threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
                last_speed_time = time.time()

    # Rapid Braking
    elif brake_value > 200 and accel_value <= 30:
        state = "Rapid Braking"
        update_display_state(accel_value, brake_value, state)
        mqtt_state = 2
        if not is_accelerating:
            last_brake_time = time.time()
            is_accelerating = True
        else:
            elapsed_time = time.time() - last_brake_time
            if elapsed_time >= 3 and not is_playing_sounds:
                stop_sounds = True
                time.sleep(0.2)
                sounds = [brakebrake_sound]
                print("Rapid Braking 음성 재생 시작")
                threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
                last_brake_time = time.time()

    # Both Feet Driving
    elif accel_value > 100 and brake_value > 100:
        state = "Both Feet Driving"
        update_display_state(accel_value, brake_value, state)
        mqtt_state = 3
        if not is_accelerating:
            last_both_time = time.time()
            is_accelerating = True
        else:
            elapsed_time = time.time() - last_both_time
            if elapsed_time >= 3 and not is_playing_sounds:
                stop_sounds = True
                time.sleep(0.2)
                sounds = [bothdrive_sound]
                print("Both Feet Driving 음성 재생 시작")
                threading.Thread(target=play_sounds_in_sequence, args=(sounds,), daemon=True).start()
                last_both_time = time.time()
    else:
        state = "Normal Driving"
        update_display_state(accel_value, brake_value, state)
        is_accelerating = False
        stop_sounds = True  # 일반 주행일 때 음성 중단
        
    data["driveState"] = state
        
    # 상태가 변경되고 mqtt_state가 None이 아    닐 때만 MQTT 전송    
    if mqtt_state is not None and mqtt_state != prev_mqtt_state:
        alert_data = {
            "carId": "01가1234",
            "state": mqtt_state
        }
        print(alert_data)
        client.publish('AbnormalDriving', json.dumps(alert_data), 0, retain=False)
        #이전 상태  갱신
        prev_mqtt_state = mqtt_state

# 초기 값 설정
previous_speed = 0  # 이전 속도 (km/h)
previous_time = time.time()

# 예시문 
def calculate_acceleration_kmh2(current_speed):
    global previous_speed, previous_time

    current_time = time.time()
    delta_speed = current_speed - previous_speed  # 속도 변화 (km/h)
    delta_time = current_time - previous_time  # 시간 변화 (초)

    if delta_time > 0:
        # 가속도 계산 (m/s² -> km/h² 변환)
        acceleration = (delta_speed / delta_time)  # km/h² 단위
    else:
        acceleration = 0  # 시간 간격이 0일 경우 가속도 0

    # 이전 속도와 시간 업데이트
    previous_speed = current_speed
    previous_time = current_time

    return acceleration

""" #1초마다 KM/H계산 툴
def delta_speed(current_speed):
    global previous_speed, previous_time

    current_time = time.time()
    kmh = current_speed - previous_speed  # 속도 변화 (km/h)
    
    # 이전 속도와 시간 업데이트
    previous_speed = current_speed
    previous_time = current_time

    return kmh
 """

rpm_value = 461

# 속도 예시 입력
current_speeds = [0, 20, 40, 60, 80]  # 속도를 순차적으로 증가시킴 (km/h)

# 가속도 출력
for speed in current_speeds:
    time.sleep(1)  # 1초 간격으로 속도 변경
    acceleration = calculate_acceleration_kmh2(speed)
    data["speedChange"] = acceleration
    #print(f"속도: {speed} km/h, 가속도: {acceleration:.2f} km/h²")
""" def speed_image(): """
    


# 로드셀에서 데이터를 읽고 주행 상태를 확인하는 함수
def run_code():
    while True:
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
        
            random_speed = generate_random_speed()
            print(f"랜덤 속도: {random_speed} km/h")            
            
            
            """ speed_cmd = obd.commands.speed
            rpm_cmd = obd.commands.RPM

            #데이터 요청 및 출력
            speed_response = connection.query(speed_cmd)
            rpm_response = connection.query(rpm_cmd)
                          
             # 속도 및 RPM 데이터 추가
            if speed_response.value is not None:
                #현재속도("km/h")
                speed_kmh = speed_response.value.to("km/h")
                data["speed"] = float(speed_kmh)
                
                text_label.config(text=f"현재 속도: {int(speed_kmh)} km/h") #이거 쓰면 될꺼같네 
                speed_change = delta_speed(current_speed)
                data["speedChange"] = speed_change  # 속도 변화 저장
                
            if rpm_response.value is not None:
                data["rpm"] = int(rpm_response.value) 
                
                
                """

            
            # 현재 시간 추가
            now = datetime.now()
            data.update({
                "carId": "01가1234",  # 차량 ID 유지
                "aclPedal": int(val_accelerator),
                "brkPedal": int(val_brake),
                "createDate": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
                "driveState": data["driveState"],  # 기존 driveState 유지
                "speed" : 40, #40 대신에 들어갈 값 : data["speed"]
                "rpm" : 2000,  #2000 대신에 들어갈 값 : data["rpm"]
                "speedChange" : 20.0 #speedChange data["kmh"]
            })             
            print(data)
            #레이블 업데이트 (정수 형식)
            text_label.config(text=f"속도: {random_speed}")    
            rpm_label.config(text=f"RPM : {rpm_value}")
            client.publish('pedal', json.dumps(data), 0, retain=False)
            check_info(val_accelerator, val_brake)

            time.sleep(0.8)

        except Exception as error:
            print(error)
            continue

# 쓰레드로 run_code 실행
threading.Thread(target=run_code, daemon=True).start()

# Tkinter 창 실행
root.mainloop()
