def tent_map(x, mu=2.0, epsilon=1e-10):
    if x < 0.5:
        return max(epsilon, mu * x)
    else:
        return max(epsilon, mu * (1 - x))

def generate_chaotic_sequence(seed, length, mu=2.0):
    if not (0 < seed < 1):
        raise ValueError("Seed는 0과 1 사이의 실수여야 합니다.")

    sequence = []
    x = seed
    for _ in range(length):
        x = tent_map(x, mu)
        sequence.append(x)
    return sequence

if __name__ == "__main__":
    seed = 0.123456    # 시드 값 (0 < seed < 1)
    length = 1024      # 생성할 신호의 길이
    signal = generate_chaotic_sequence(seed, length)

    # 출력
    for i, val in enumerate(signal[:1024    ]):
        print(f"{i}: {val:.6f}")
