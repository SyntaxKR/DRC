from typing import Tuple

def next_chaotic(x: int) -> Tuple[int, int]:
    """
    디지털 텐트 맵 유사 방식을 사용하여 다음 혼돈 값을 생성합니다.
    
    Args:
        x (int): 현재 16비트 값 (0 <= x <= 0xFFFF).
    Returns:
        Tuple[int, int]: (next_x, y) 형식의 16비트 값을 반환합니다.
    """
    x = x & 0xFFFF  # x가 16비트 범위를 유지하도록 합니다.
    
    if x == 0:
        # x가 0일 때의 텐트 맵 계산식
        y = (((x << 4) & 0xFFFF) - ((x >> 12) & 0xFFFF)) & 0xFFFF
        x_next = y
    else:
        # x가 0이 아닐 때의 텐트 맵 계산식
        x_inv = 0xFFFF - x
        y = (((x_inv << 4) & 0xFFFF) - ((x_inv >> 12) & 0xFFFF)) & 0xFFFF
        x_next = y

    return x_next, y


def encrypt_sensor_data(sensor_bytes: bytes, x0: int) -> bytes:
    """
    혼돈 XOR 방식을 사용하여 바이트 문자열을 암호화합니다.
    
    Args:
        sensor_bytes (bytes): 센서 데이터 원본 바이트 문자열.
        x0 (int): 송신자와 수신자가 공유하는 16비트 초기 시드 값.
    
    Returns:
        bytes: [Beg(2바이트) || 암호문 || End(2바이트)] 형식의 암호화된 패킷을 반환합니다.
    """
    encrypted = bytearray()
    x = x0 & 0xFFFF  # 초기 시드를 16비트로 제한
    
    # 첫 번째 혼돈 값(y1)을 생성하고 Beg_value로 저장
    x, y = next_chaotic(x)
    Beg_value = y  # 16비트 혼돈 출력값 저장
    
    idx = 0
    while idx < len(sensor_bytes):
        # 상위 바이트와 하위 바이트 분리
        y_hi = (y >> 8) & 0xFF
        y_lo = y & 0xFF

        # 첫 번째 바이트 암호화
        encrypted.append(sensor_bytes[idx] ^ y_hi)
        idx += 1
        
        # 두 번째 바이트(있으면) 암호화
        if idx < len(sensor_bytes):
            encrypted.append(sensor_bytes[idx] ^ y_lo)
            idx += 1

        # 다음 혼돈 값 생성
        x, y = next_chaotic(y)
    
    End_value = y  # 마지막으로 사용된 혼돈 출력값 저장
    
    # 패킷 구성: Beg_value(2바이트, big endian) + 암호문 + End_value(2바이트, big endian)
    packet = bytearray()
    packet += Beg_value.to_bytes(2, byteorder='big')
    packet += encrypted
    packet += End_value.to_bytes(2, byteorder='big')
    
    return bytes(packet)


def decrypt_sensor_data(packet: bytes, x0: int) -> bytes:
    """
    encrypt_sensor_data로 생성된 패킷을 복호화합니다.
    
    Args:
        packet (bytes): [Beg(2바이트) || 암호문 || End(2바이트)] 형식의 암호화된 패킷.
        x0 (int): 암호화 시 사용된 16비트 초기 시드 값.
    
    Returns:
        bytes: 복호화된 원본 센서 데이터 바이트열을 반환합니다.
    """
    # Beg와 End 2바이트 값 파싱
    Beg_value = int.from_bytes(packet[0:2], byteorder='big')
    End_value = int.from_bytes(packet[-2:], byteorder='big')
    cipher_bytes = packet[2:-2]
    
    # 혼돈 시퀀스 동기화
    x = x0 & 0xFFFF
    x, y_generated = next_chaotic(x)
    if y_generated != Beg_value:
        raise ValueError("Beg_value 불일치: 키가 틀렸거나 데이터 변조가 감지되었습니다.")
    
    decrypted = bytearray()
    idx = 0
    current_y = y_generated
    
    while idx < len(cipher_bytes):
        # 상위 바이트와 하위 바이트 분리
        y_hi = (current_y >> 8) & 0xFF
        y_lo = current_y & 0xFF

        # 복호화: XOR 수행
        decrypted.append(cipher_bytes[idx] ^ y_hi)
        idx += 1
        
        if idx < len(cipher_bytes):
            decrypted.append(cipher_bytes[idx] ^ y_lo)
            idx += 1

        # 다음 혼돈 값 생성
        x, next_y = next_chaotic(current_y)
        current_y = next_y
    
    # End_value 무결성 검증
    if current_y != End_value:
        raise ValueError("End_value 불일치: 데이터 무결성 검증 실패.")
    
    return bytes(decrypted)


# === 데모 실행부 ===
if __name__ == "__main__":
    # 예시 센서 데이터(바이트 문자열)
    sensor_data = b"Temperature:23.5"
    initial_seed = 0x1234  # 송신자/수신자가 공유해야 하는 초기 시드 값

    print("원본 센서 데이터          :", sensor_data)
    print("원본 데이터 (16진수)      :", sensor_data.hex())

    packet = encrypt_sensor_data(sensor_data, initial_seed)
    print("\n암호화된 패킷 (16진수)     :", packet.hex())

    decrypted = decrypt_sensor_data(packet, initial_seed)
    print("\n복호화된 센서 데이터      :", decrypted)
    print("복호화 데이터 (16진수)    :", decrypted.hex())

    assert decrypted == sensor_data, "복호화된 데이터가 원본과 일치하지 않습니다!"
