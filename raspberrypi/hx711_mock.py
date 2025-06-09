# hx711_mock.py

class HX711:
    def __init__(self, dout, pd_sck):
        print(f"[MOCK] HX711 초기화 (DOUT={dout}, SCK={pd_sck})")

    def set_reading_format(self, a, b):
        print("[MOCK] set_reading_format() 호출됨")

    def set_reference_unit(self, val):
        print(f"[MOCK] set_reference_unit({val}) 호출됨")

    def reset(self):
        print("[MOCK] reset() 호출됨")

    def tare(self):
        print("[MOCK] tare() 호출됨")

    def power_down(self):
        print("[MOCK] power_down() 호출됨")

    def power_up(self):
        print("[MOCK] power_up() 호출됨")

    def get_weight(self, times=5):
        print("[MOCK] get_weight() 호출됨")
        # 🎲 시뮬레이션용 랜덤 값 넣을 수도 있음
        import random
        return random.randint(0, 3000)
