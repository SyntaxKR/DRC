import obd

# OBD 연결 설정
#connection = obd.OBD() 

# OBD 수동 연결 설정(위에 거 안되면 실행)
connection = obd.OBD("/dev/rfcomm0")

# 차량 시동 상태 확인 코드
# print(connection.protocol_name)

# 지원되는 명령어 확인 코드
# print(connection.supported_commands)

# 연결 상태 확인 코드
if connection.is_connected():
    print("OBD-II 연결 성공!")
else:
    print("OBD-II 연결 실패!")
    exit()
    
# 속도 데이터 요청
cmd = obd.commands.SPEED

# 응답 받기
response = connection.query(cmd)

# 응답 데이터 출력
if response.value:
    print(f"속도: {response.value} km/h")
    print(f"속도: {response.value.to('mph')} mph")
else:
    print("속도 데이터를 가져올 수 없습니다.")