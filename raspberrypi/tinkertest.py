import tkinter as tk
from PIL import Image, ImageTk
import os

print("=== TEST START ===")

root = tk.Tk()
root.title("Test Window")
root.geometry("600x400")

img_path = "image/accel_normal.png"
if not os.path.exists(img_path):
    print(f"[ERROR] 파일 없음: {img_path}")
    exit()

img = Image.open(img_path).resize((300, 300))
tk_img = ImageTk.PhotoImage(img)

label = tk.Label(root, image=tk_img)
label.pack()

print("=== GUI READY ===")
root.mainloop()
