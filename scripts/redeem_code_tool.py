import csv
import random
import tkinter as tk
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from tkinter import filedialog, messagebox, ttk


ALPHABET = "Q7W5ER8TY2UP4AS6DF9GH3JKLZXCVBNM"
CODE_LENGTH = 16
VERSION_CURRENT = 3
PAYLOAD_MASK = (1 << 60) - 1
TAG_MASK = (1 << 20) - 1
HALF_MASK = (1 << 40) - 1
MASK_64 = (1 << 64) - 1
SECRET_A = 0x9E3779B97F4A7C15
SECRET_B = 0xBF58476D1CE4E5B9
SECRET_C = 0x94D049BB133111EB
ROUND_KEYS = [
    0x243F6A8885,
    0x13198A2E03,
    0xA409382229,
    0x082EFA98EC,
    0x452821E638,
    0xD01377BE54,
    0xBE5466CF34,
    0xE90C6C7D90,
]
ITEM_TYPES = {
    "zhuYue": 0,
    "unlockLevels": 1,
}
MAX_REDEEM_AMOUNT = 1_048_575
MAX_NONCE = 4095
BASE_EPOCH_MINUTE = int(datetime(2025, 1, 1, tzinfo=timezone.utc).timestamp() // 60)
MAX_EXPIRY_OFFSET = 16_777_215


def to_base32(value: int) -> str:
    remaining = int(value)
    output = []
    for _ in range(CODE_LENGTH):
        output.append(ALPHABET[remaining & 31])
        remaining >>= 5
    return "".join(reversed(output))


def mix64(value: int) -> int:
    cursor = value & MASK_64
    cursor = ((cursor ^ (cursor >> 30)) * SECRET_B) & MASK_64
    cursor = ((cursor ^ (cursor >> 27)) * SECRET_C) & MASK_64
    cursor ^= cursor >> 31
    return cursor & MASK_64


def compute_tag(payload: int) -> int:
    normalized = payload & PAYLOAD_MASK
    a = mix64(normalized ^ SECRET_A)
    b = mix64(((normalized << 1) ^ SECRET_B) & MASK_64)
    c = mix64((normalized >> 1) ^ SECRET_C)
    return (a ^ b ^ c) & TAG_MASK


def feistel_round(right_half: int, round_index: int) -> int:
    round_key = ROUND_KEYS[round_index % len(ROUND_KEYS)]
    mixed = mix64((right_half ^ round_key ^ SECRET_A) + SECRET_C + round_index)
    return mixed & HALF_MASK


def encrypt_block(block: int) -> int:
    left = (block >> 40) & HALF_MASK
    right = block & HALF_MASK
    for round_index in range(10):
        next_half = (left ^ feistel_round(right, round_index)) & HALF_MASK
        left = right
        right = next_half
    return (left << 40) | right


def format_code(raw_code: str) -> str:
    return f"{raw_code[:4]}-{raw_code[4:8]}-{raw_code[8:12]}-{raw_code[12:]}"


def minute_timestamp(dt: datetime) -> int:
    return int(dt.timestamp() // 60)


def encode_redeem_code(reward_type: str, amount: int, expiry_minute: int, nonce: int) -> str:
    if reward_type not in ITEM_TYPES:
        raise ValueError("奖励类型无效。")
    if amount <= 0 or amount > MAX_REDEEM_AMOUNT:
        raise ValueError(f"奖励数量必须在 1 到 {MAX_REDEEM_AMOUNT} 之间。")
    if nonce < 0 or nonce > MAX_NONCE:
        raise ValueError(f"随机因子必须在 0 到 {MAX_NONCE} 之间。")

    expiry_offset = int(expiry_minute) - BASE_EPOCH_MINUTE
    if expiry_offset < 0 or expiry_offset > MAX_EXPIRY_OFFSET:
        raise ValueError("截止时间超出新版兑换码可表示范围，请使用 2025-01-01 之后且约 31 年内的时间。")

    payload = VERSION_CURRENT
    payload = (payload << 2) | ITEM_TYPES[reward_type]
    payload = (payload << 20) | int(amount)
    payload = (payload << 24) | expiry_offset
    payload = (payload << 12) | int(nonce)
    payload &= PAYLOAD_MASK
    tag = compute_tag(payload)
    raw_value = encrypt_block((payload << 20) | tag)
    return format_code(to_base32(raw_value))


@dataclass
class GeneratedCode:
    code: str
    reward_type: str
    amount: int
    expiry_text: str
    expiry_minute: int
    nonce: int


class RedeemCodeTool:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("啵啵小队出击 兑换码生成器")
        self.root.geometry("1080x720")

        self.reward_type_var = tk.StringVar(value="zhuYue")
        self.amount_var = tk.StringVar(value="30")
        self.count_var = tk.StringVar(value="10")
        self.expiry_var = tk.StringVar(value=datetime.now().strftime("%Y-%m-%d %H:%M"))
        self.generated_codes: list[GeneratedCode] = []

        self.build_ui()

    def build_ui(self) -> None:
        container = ttk.Frame(self.root, padding=18)
        container.pack(fill=tk.BOTH, expand=True)

        ttk.Label(container, text="啵啵小队出击 兑换码生成器", font=("Microsoft YaHei", 18, "bold")).pack(anchor=tk.W)
        ttk.Label(
            container,
            text="当前工具默认生成新版 v3 兑换码。新版支持更大数量的朱玥奖励，同时仍保持 16 位兑换码长度；游戏端兼容旧版兑换码。",
            wraplength=980,
        ).pack(anchor=tk.W, pady=(6, 16))

        form = ttk.Frame(container)
        form.pack(fill=tk.X)

        ttk.Label(form, text="奖励类型").grid(row=0, column=0, sticky="w", padx=(0, 8))
        reward_box = ttk.Combobox(
            form,
            textvariable=self.reward_type_var,
            values=["zhuYue", "unlockLevels"],
            state="readonly",
            width=16,
        )
        reward_box.grid(row=0, column=1, sticky="w", padx=(0, 18))
        reward_box.bind("<<ComboboxSelected>>", self.update_amount_hint)

        self.add_field(form, 1, "奖励数量", self.amount_var)
        self.add_field(form, 2, "生成数量", self.count_var)
        self.add_field(form, 3, "截止时间", self.expiry_var, width=22)

        self.amount_hint = ttk.Label(form, text="")
        self.amount_hint.grid(row=1, column=0, columnspan=8, sticky="w", pady=(8, 0))
        self.update_amount_hint()

        ttk.Label(
            form,
            text="时间格式：YYYY-MM-DD HH:MM，例如 2026-03-31 23:59",
        ).grid(row=2, column=0, columnspan=8, sticky="w", pady=(6, 0))

        actions = ttk.Frame(container)
        actions.pack(fill=tk.X, pady=(16, 12))

        ttk.Button(actions, text="生成兑换码", command=self.generate_codes).pack(side=tk.LEFT)
        ttk.Button(actions, text="复制全部", command=self.copy_all).pack(side=tk.LEFT, padx=(10, 0))
        ttk.Button(actions, text="导出 CSV", command=self.export_csv).pack(side=tk.LEFT, padx=(10, 0))
        ttk.Button(actions, text="清空结果", command=self.clear_results).pack(side=tk.LEFT, padx=(10, 0))

        columns = ("code", "reward_type", "amount", "expiry_text", "nonce")
        self.tree = ttk.Treeview(container, columns=columns, show="headings", height=20)
        self.tree.heading("code", text="兑换码")
        self.tree.heading("reward_type", text="奖励类型")
        self.tree.heading("amount", text="奖励数量")
        self.tree.heading("expiry_text", text="截止时间")
        self.tree.heading("nonce", text="随机因子")
        self.tree.column("code", width=280, anchor=tk.W)
        self.tree.column("reward_type", width=120, anchor=tk.CENTER)
        self.tree.column("amount", width=120, anchor=tk.CENTER)
        self.tree.column("expiry_text", width=220, anchor=tk.CENTER)
        self.tree.column("nonce", width=110, anchor=tk.CENTER)
        self.tree.pack(fill=tk.BOTH, expand=True)

        ttk.Label(
            container,
            text="提示：unlockLevels 类型中的“奖励数量 = n”表示兑换成功后直接解锁前 n 个关卡，例如 15 表示解锁第 1 关到第 15 关。",
            foreground="#7A645A",
        ).pack(anchor=tk.W, pady=(10, 0))

    def update_amount_hint(self, _event=None) -> None:
        reward_type = self.reward_type_var.get().strip()
        if reward_type == "unlockLevels":
            self.amount_hint.config(
                text=f"奖励数量含义：解锁前 n 个关卡。为了兼容新版大额格式，当前允许填写 1 到 {MAX_REDEEM_AMOUNT}，实际游戏会按现有关卡总数截断。"
            )
        else:
            self.amount_hint.config(
                text=f"奖励数量含义：发放朱玥数量。新版 v3 兑换码支持 1 到 {MAX_REDEEM_AMOUNT} 朱玥，不再静默截断。"
            )

    def add_field(self, parent: ttk.Frame, column: int, label: str, variable: tk.StringVar, width: int = 12) -> None:
        ttk.Label(parent, text=label).grid(row=0, column=column * 2, sticky="w", padx=(0, 8))
        ttk.Entry(parent, textvariable=variable, width=width).grid(
            row=0, column=column * 2 + 1, sticky="w", padx=(0, 18)
        )

    def parse_expiry(self) -> tuple[int, str]:
        try:
            dt = datetime.strptime(self.expiry_var.get().strip(), "%Y-%m-%d %H:%M")
        except ValueError as error:
            raise ValueError("截止时间格式不正确，请使用 YYYY-MM-DD HH:MM。") from error

        return minute_timestamp(dt), dt.strftime("%Y-%m-%d %H:%M")

    def generate_codes(self) -> None:
        try:
            reward_type = self.reward_type_var.get().strip()
            amount = int(self.amount_var.get().strip())
            count = int(self.count_var.get().strip())
            expiry_minute, expiry_text = self.parse_expiry()
        except ValueError as error:
            messagebox.showerror("参数错误", str(error))
            return

        if reward_type not in ITEM_TYPES:
            messagebox.showerror("参数错误", "奖励类型无效。")
            return
        if amount <= 0 or amount > MAX_REDEEM_AMOUNT:
            messagebox.showerror("参数错误", f"奖励数量必须在 1 到 {MAX_REDEEM_AMOUNT} 之间。")
            return
        if count <= 0 or count > 2000:
            messagebox.showerror("参数错误", "生成数量需要在 1 到 2000 之间。")
            return

        self.clear_results()
        seen = set()

        while len(self.generated_codes) < count:
            nonce = random.randint(0, MAX_NONCE)
            try:
              code = encode_redeem_code(reward_type=reward_type, amount=amount, expiry_minute=expiry_minute, nonce=nonce)
            except ValueError as error:
              messagebox.showerror("参数错误", str(error))
              self.clear_results()
              return
            if code in seen:
                continue

            seen.add(code)
            generated = GeneratedCode(
                code=code,
                reward_type=reward_type,
                amount=amount,
                expiry_text=expiry_text,
                expiry_minute=expiry_minute,
                nonce=nonce,
            )
            self.generated_codes.append(generated)
            self.tree.insert("", tk.END, values=(generated.code, generated.reward_type, generated.amount, generated.expiry_text, generated.nonce))

    def copy_all(self) -> None:
        if not self.generated_codes:
            messagebox.showinfo("暂无数据", "请先生成兑换码。")
            return

        self.root.clipboard_clear()
        self.root.clipboard_append("\n".join(code.code for code in self.generated_codes))
        self.root.update()
        messagebox.showinfo("复制成功", "已将全部兑换码复制到剪贴板。")

    def export_csv(self) -> None:
        if not self.generated_codes:
            messagebox.showinfo("暂无数据", "请先生成兑换码。")
            return

        default_name = f"bobo_codes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        target = filedialog.asksaveasfilename(
            title="导出兑换码",
            defaultextension=".csv",
            initialfile=default_name,
            filetypes=[("CSV 文件", "*.csv"), ("所有文件", "*.*")],
        )
        if not target:
            return

        with Path(target).open("w", newline="", encoding="utf-8-sig") as file:
            writer = csv.writer(file)
            writer.writerow(["code", "reward_type", "amount", "expiry_text", "expiry_minute", "nonce"])
            for item in self.generated_codes:
                writer.writerow([item.code, item.reward_type, item.amount, item.expiry_text, item.expiry_minute, item.nonce])

        messagebox.showinfo("导出完成", f"已导出到：\n{target}")

    def clear_results(self) -> None:
        self.generated_codes.clear()
        for item in self.tree.get_children():
            self.tree.delete(item)


def main() -> None:
    root = tk.Tk()
    app = RedeemCodeTool(root)
    root.mainloop()


if __name__ == "__main__":
    main()
