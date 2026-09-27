#!/usr/bin/env python3
"""Render the three original, offline Thaheen lesson animations.

Requires Pillow with libraqm support and FFmpeg with libx264. Voiceover is
intentionally muxed as a separate final step so the visuals can be reviewed
without sending the narration text to a service.
"""

from __future__ import annotations

import math
import subprocess
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/assets/videos"
WIDTH, HEIGHT, FPS = 1280, 720, 15
SCENE_SECONDS = 19
SCENE_FRAMES = FPS * SCENE_SECONDS
FRAMES_PER_VIDEO = SCENE_FRAMES * 5
FONT_PATH = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
FONT_BOLD_PATH = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

PALETTE = {
    "ink": "#32243A",
    "ivory": "#F7F5EF",
    "white": "#FFFEFA",
    "lime": "#D5E889",
    "lime_dark": "#84994E",
    "terra": "#C77B67",
    "terra_dark": "#995849",
    "blue": "#507E97",
    "blue_soft": "#DCE9ED",
    "line": "#E7E1D8",
    "muted": "#817982",
    "body": "#554A58",
    "red": "#CF645B",
    "red_soft": "#F4DEDA",
    "purple": "#79658D",
    "purple_soft": "#EAE4EF",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD_PATH if bold else FONT_PATH), size)


def txt(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, size: int,
        color: str = PALETTE["ink"], bold: bool = False,
        anchor: str = "mm", direction: str = "rtl") -> None:
    draw.text(xy, text, font=font(size, bold), fill=color, anchor=anchor,
              direction=direction, language="ar" if direction == "rtl" else "en")


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int,
            fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int],
          color: str, width: int = 8) -> None:
    draw.line((start, end), fill=color, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    length = 22
    left = (end[0] - length * math.cos(angle - 0.48),
            end[1] - length * math.sin(angle - 0.48))
    right = (end[0] - length * math.cos(angle + 0.48),
             end[1] - length * math.sin(angle + 0.48))
    draw.polygon((end, left, right), fill=color)


def gradient_background() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), PALETTE["ivory"])
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, WIDTH, 12), fill=PALETTE["lime"])
    draw.ellipse((980, -260, 1450, 210), fill="#F0ECE2")
    draw.ellipse((-220, 540, 180, 940), fill="#EEEAE2")
    rounded(draw, (42, 40, 1238, 680), 30, PALETTE["white"], PALETTE["line"], 2)
    rounded(draw, (72, 66, 360, 96), 15, PALETTE["ink"])
    txt(draw, (216, 81), "THAHEEN  •  HEALTH SCIENCES", 13,
        PALETTE["lime"], True, direction="ltr")
    txt(draw, (1195, 81), "رسم تعليمي مبسّط", 15, PALETTE["muted"], True)
    draw.line((84, 132, 1196, 132), fill=PALETTE["line"], width=2)
    return image


def label(draw: ImageDraw.ImageDraw, x: int, y: int, title: str,
          english: str = "", accent: str = PALETTE["terra"]) -> None:
    rounded(draw, (x - 118, y - 33, x + 118, y + 39), 18, PALETTE["white"], PALETTE["line"], 2)
    draw.ellipse((x + 88, y - 8, x + 104, y + 8), fill=accent)
    txt(draw, (x - 8, y - 7), title, 20, PALETTE["ink"], True)
    if english:
        txt(draw, (x - 8, y + 18), english, 11, PALETTE["muted"], False, direction="ltr")


def header_for(draw: ImageDraw.ImageDraw, title: str, index: int, total: int = 5) -> None:
    txt(draw, (640, 174), title, 31, PALETTE["ink"], True)
    txt(draw, (154, 171), f"{index:02d} / {total:02d}", 14,
        PALETTE["terra_dark"], True, direction="ltr")


def draw_skeleton(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0) -> None:
    w = max(4, int(8 * scale))
    bone = "#C9C2B6"
    bright = "#8C8091"
    # Skull, spine, shoulder and pelvis.
    draw.ellipse((cx - 28 * scale, cy - 175 * scale, cx + 28 * scale, cy - 119 * scale),
                 fill=PALETTE["lime"], outline=PALETTE["ink"], width=3)
    draw.line((cx, cy - 112 * scale, cx, cy + 22 * scale), fill=bright, width=w)
    for offset in range(7):
        y = cy - 99 * scale + offset * 17 * scale
        draw.ellipse((cx - 8 * scale, y - 5 * scale, cx + 8 * scale, y + 5 * scale),
                     fill=bone, outline=PALETTE["ink"], width=1)
    draw.arc((cx - 86 * scale, cy - 112 * scale, cx + 86 * scale, cy + 25 * scale),
             0, 180, fill=PALETTE["terra"], width=max(3, int(5 * scale)))
    draw.line((cx - 75 * scale, cy - 100 * scale, cx - 112 * scale, cy + 8 * scale),
              fill=bright, width=w)
    draw.line((cx + 75 * scale, cy - 100 * scale, cx + 112 * scale, cy + 8 * scale),
              fill=bright, width=w)
    draw.ellipse((cx - 61 * scale, cy + 10 * scale, cx + 61 * scale, cy + 62 * scale),
                 outline=PALETTE["blue"], width=w)
    draw.line((cx - 40 * scale, cy + 42 * scale, cx - 60 * scale, cy + 155 * scale),
              fill=bright, width=w)
    draw.line((cx + 40 * scale, cy + 42 * scale, cx + 60 * scale, cy + 155 * scale),
              fill=bright, width=w)
    for side in (-1, 1):
        draw.ellipse((cx + side * 105 * scale - 9, cy + 0, cx + side * 105 * scale + 9,
                      cy + 20 * scale), fill=PALETTE["terra"])


def draw_bone(draw: ImageDraw.ImageDraw, center: tuple[int, int], angle: float,
              length: int = 250, color: str = PALETTE["terra"]) -> None:
    x, y = center
    dx, dy = math.cos(angle) * length / 2, math.sin(angle) * length / 2
    a, b = (int(x - dx), int(y - dy)), (int(x + dx), int(y + dy))
    draw.line((a, b), fill=color, width=25)
    for px, py in (a, b):
        draw.ellipse((px - 22, py - 22, px + 22, py + 22), fill=color,
                     outline=PALETTE["ink"], width=3)
    draw.line((a, b), fill="#F5D7CF", width=7)


def draw_sphere(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int,
                fill: str, core: str | None = None) -> None:
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill,
                 outline=PALETTE["ink"], width=3)
    if core:
        draw.ellipse((cx - r * 0.42, cy - r * 0.42, cx + r * 0.42, cy + r * 0.42),
                     fill=core)


def make_movement_scene(index: int) -> tuple[Image.Image, Callable[[ImageDraw.ImageDraw, float], None], str]:
    image = gradient_background()
    draw = ImageDraw.Draw(image)
    titles = ["الحركة تعاون بين أجهزة الجسم", "هيكل البالغ يضم عادةً 206 عظام",
              "المفاصل تسمح بحركة بدرجات مختلفة", "فقرات تحمي وتمنح العمود مرونة",
              "العضلة تسحب العظم لتحريك المفصل"]
    english = ["Movement system", "Adult skeleton", "Joint types", "Vertebral column", "Muscle contraction"]
    header_for(draw, titles[index], index + 1)
    if index == 0:
        draw_skeleton(draw, 636, 425, 0.92)
        label(draw, 965, 306, "العظام", "Bones", PALETTE["terra"])
        label(draw, 965, 415, "المفاصل", "Joints", PALETTE["blue"])
        label(draw, 965, 526, "العضلات", "Muscles", PALETTE["purple"])
        arrow(draw, (844, 300), (900, 300), PALETTE["terra"], 4)
        arrow(draw, (844, 410), (900, 410), PALETTE["blue"], 4)
        arrow(draw, (844, 520), (900, 520), PALETTE["purple"], 4)
        motion = lambda d, t: d.ellipse((613, 392, 659, 438), outline=PALETTE["lime_dark"], width=4)
        takeaway = "دعم  •  حماية  •  حركة"
    elif index == 1:
        draw_bone(draw, (635, 420), -0.28, 300)
        rounded(draw, (838, 280, 1093, 362), 22, PALETTE["chartreuse"] if "chartreuse" in PALETTE else PALETTE["lime"])
        txt(draw, (966, 316), "206", 48, PALETTE["ink"], True, direction="ltr")
        label(draw, 957, 436, "رافعة للحركة", "Lever", PALETTE["terra"])
        label(draw, 957, 529, "مخزن للمعادن", "Mineral store", PALETTE["blue"])
        takeaway = "العظام تؤدي أكثر من وظيفة"
        motion = lambda d, t: d.ellipse((570, 355, 700, 485), outline=PALETTE["lime_dark"], width=3)
    elif index == 2:
        pivot = (605, 435)
        draw.ellipse((pivot[0] - 27, pivot[1] - 27, pivot[0] + 27, pivot[1] + 27),
                     fill=PALETTE["lime"], outline=PALETTE["ink"], width=4)
        draw_bone(draw, (498, 435), 0, 220, PALETTE["blue"])
        label(draw, 910, 315, "الركبة", "Hinge joint", PALETTE["blue"])
        label(draw, 910, 530, "الكتف", "Ball-and-socket", PALETTE["terra"])
        draw.ellipse((864, 370, 955, 462), outline=PALETTE["terra"], width=12)
        draw.ellipse((892, 398, 927, 433), fill=PALETTE["lime"])
        takeaway = "نوع المفصل يحدد مدى الحركة"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            ang = -0.48 + math.sin(t * 1.1) * 0.46
            draw_bone(d, (718, 435), ang, 230, PALETTE["terra"])
            d.arc((570, 345, 760, 525), 200, 332, fill=PALETTE["lime_dark"], width=5)
    elif index == 3:
        x = 630
        for i in range(8):
            y = 280 + i * 35
            rounded(draw, (x - 52, y - 12, x + 52, y + 12), 10,
                    PALETTE["blue_soft"], PALETTE["blue"], 3)
            rounded(draw, (x - 36, y + 11, x + 36, y + 22), 5, PALETTE["terra_soft"] if "terra_soft" in PALETTE else PALETTE["red_soft"])
        draw.line((x, 266, x, 575), fill=PALETTE["purple"], width=5)
        label(draw, 920, 326, "الفقرات", "Vertebrae", PALETTE["blue"])
        label(draw, 920, 436, "أقراص مرنة", "Discs", PALETTE["terra"])
        label(draw, 920, 546, "الحبل الشوكي", "Spinal cord", PALETTE["purple"])
        takeaway = "حماية  •  دعم  •  انحناء"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            offset = int(7 * math.sin(t * 1.1))
            d.line((x + offset, 266, x + offset, 575), fill=PALETTE["lime_dark"], width=3)
    else:
        pivot = (640, 436)
        draw.ellipse((pivot[0] - 28, pivot[1] - 28, pivot[0] + 28, pivot[1] + 28),
                     fill=PALETTE["lime"], outline=PALETTE["ink"], width=4)
        draw_bone(draw, (505, 436), 0, 245, PALETTE["blue"])
        label(draw, 930, 315, "عضلة هيكلية", "Skeletal muscle", PALETTE["terra"])
        label(draw, 930, 523, "وتر", "Tendon", PALETTE["purple"])
        takeaway = "انقباض  →  شدّ  →  حركة"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            squeeze = int(12 * (0.5 + 0.5 * math.sin(t * 2.2)))
            d.rounded_rectangle((565, 365, 618 + squeeze, 414), radius=22,
                                 fill=PALETTE["terra"], outline=PALETTE["ink"], width=3)
            arrow(d, (605, 388), (642, 425), PALETTE["terra"], 5)
            ang = math.sin(t * 1.1) * 0.23
            draw_bone(d, (752, 436), ang, 240, PALETTE["terra"])
    return image, motion, takeaway


def heart_outline(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: float,
                  color: str) -> None:
    points = []
    for step in range(100):
        t = step * 2 * math.pi / 100
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        points.append((cx + x * size / 32, cy - y * size / 32))
    draw.polygon(points, fill=color)


def make_heart_scene(index: int) -> tuple[Image.Image, Callable[[ImageDraw.ImageDraw, float], None], str]:
    image = gradient_background()
    draw = ImageDraw.Draw(image)
    titles = ["أربع حجرات تنظّم تدفق الدم", "القلب الأيمن يرسل الدم للرئتين",
              "القلب الأيسر يضخ الدم للجسم", "الصمامات تمنع رجوع الدم", "مسار الدم يتكرر مع كل دورة"]
    header_for(draw, titles[index], index + 1)
    if index == 0:
        x0, x1, y0, y1 = 502, 755, 282, 530
        chambers = [(x0, y0, "الأذين الأيمن", PALETTE["blue"]),
                    (x0, y0 + 127, "البطين الأيمن", PALETTE["blue"]),
                    (x1, y0, "الأذين الأيسر", PALETTE["red"]),
                    (x1, y0 + 127, "البطين الأيسر", PALETTE["red"])]
        for x, y, name, color in chambers:
            rounded(draw, (x, y, x + 215, y + 99), 25, PALETTE["white"], color, 5)
            txt(draw, (x + 108, y + 42), name, 20, PALETTE["ink"], True)
        arrow(draw, (718, 368), (744, 368), PALETTE["muted"], 4)
        arrow(draw, (610, 383), (610, 403), PALETTE["blue"], 5)
        arrow(draw, (862, 383), (862, 403), PALETTE["red"], 5)
        label(draw, 940, 573, "أذينان + بطينان", "2 atria + 2 ventricles", PALETTE["terra"])
        takeaway = "الأذينان يستقبلان  •  البطينان يضخان"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            pulse = int(9 + 5 * (0.5 + 0.5 * math.sin(t * 2.5)))
            d.ellipse((788 - pulse, 338 - pulse, 788 + pulse, 338 + pulse),
                      outline=PALETTE["lime_dark"], width=4)
    elif index == 1:
        nodes = [(420, 350, "الجسم"), (600, 350, "الأذين الأيمن"),
                 (780, 480, "البطين الأيمن"), (1000, 350, "الرئتان")]
        for x, y, name in nodes:
            draw.ellipse((x - 63, y - 63, x + 63, y + 63), fill=PALETTE["blue_soft"],
                         outline=PALETTE["blue"], width=5)
            txt(draw, (x, y), name, 17, PALETTE["ink"], True)
        arrow(draw, (488, 350), (528, 350), PALETTE["blue"], 6)
        arrow(draw, (650, 402), (720, 442), PALETTE["blue"], 6)
        arrow(draw, (842, 449), (938, 388), PALETTE["blue"], 6)
        takeaway = "دم أقل أكسجينًا  →  الرئتان"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            pts = [(485 + t * 90 % 42, 350),
                   (650 + t * 60 % 55, 402 + t * 32 % 32),
                   (842 + t * 75 % 70, 449 - t * 45 % 48)]
            for px, py in pts:
                draw_sphere(d, int(px), int(py), 9, PALETTE["lime_dark"])
    elif index == 2:
        nodes = [(360, 355, "الرئتان"), (565, 355, "الأذين الأيسر"),
                 (770, 480, "البطين الأيسر"), (1005, 355, "الجسم")]
        for x, y, name in nodes:
            draw.ellipse((x - 68, y - 68, x + 68, y + 68), fill=PALETTE["red_soft"],
                         outline=PALETTE["red"], width=5)
            txt(draw, (x, y), name, 17, PALETTE["ink"], True)
        arrow(draw, (432, 355), (490, 355), PALETTE["red"], 6)
        arrow(draw, (617, 405), (710, 444), PALETTE["red"], 6)
        arrow(draw, (838, 450), (929, 390), PALETTE["red"], 6)
        label(draw, 666, 575, "الشريان الأورطي", "Aorta", PALETTE["red"])
        takeaway = "دم غني بالأكسجين  →  الجسم"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            pts = [(432 + t * 80 % 52, 355),
                   (617 + t * 55 % 70, 405 + t * 28 % 33),
                   (838 + t * 73 % 65, 450 - t * 42 % 45)]
            for px, py in pts:
                draw_sphere(d, int(px), int(py), 9, PALETTE["red"])
    elif index == 3:
        rounded(draw, (400, 288, 610, 545), 30, PALETTE["blue_soft"], PALETTE["blue"], 5)
        rounded(draw, (670, 288, 880, 545), 30, PALETTE["red_soft"], PALETTE["red"], 5)
        txt(draw, (505, 322), "حجرة", 20, PALETTE["ink"], True)
        txt(draw, (775, 322), "حجرة", 20, PALETTE["ink"], True)
        takeaway = "يفتح الصمام  •  يمر الدم  •  يغلق الصمام"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            cx, cy = 640, 414
            openness = 0.5 + 0.5 * math.sin(t * 2.1)
            gap = int(32 * openness)
            color = PALETTE["lime_dark"] if openness > 0.55 else PALETTE["terra"]
            d.line((cx - 9, cy - 43, cx - 9 - gap // 2, cy), fill=color, width=13)
            d.line((cx + 9, cy - 43, cx + 9 + gap // 2, cy), fill=color, width=13)
            if openness > 0.65:
                draw_sphere(d, cx, cy + 42, 10, PALETTE["terra"])
    else:
        heart_outline(draw, 640, 418, 180, PALETTE["red_soft"])
        route = [(340, 420), (495, 318), (640, 495), (790, 318), (945, 420)]
        for a, b in zip(route, route[1:]):
            draw.line((*a, *b), fill=PALETTE["line"], width=19)
        for i, (x, y) in enumerate(route):
            color = PALETTE["blue"] if i < 2 else PALETTE["red"]
            draw.ellipse((x - 33, y - 33, x + 33, y + 33), fill=PALETTE["white"],
                         outline=color, width=5)
        for x, y, name in [(340, 490, "الجسم"), (495, 280, "الأذين الأيمن"),
                            (640, 542, "البطين الأيمن"), (790, 280, "الرئتان"),
                            (945, 490, "القلب الأيسر")]:
            txt(draw, (x, y), name, 16, PALETTE["muted"], True)
        takeaway = "الجسم  →  القلب الأيمن  →  الرئتان  →  القلب الأيسر  →  الجسم"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            pulse = int(8 + 5 * (0.5 + 0.5 * math.sin(t * 2.8)))
            d.ellipse((640 - pulse, 418 - pulse, 640 + pulse, 418 + pulse),
                      outline=PALETTE["red"], width=4)
    return image, motion, takeaway


def make_blood_scene(index: int) -> tuple[Image.Image, Callable[[ImageDraw.ImageDraw, float], None], str]:
    image = gradient_background()
    draw = ImageDraw.Draw(image)
    titles = ["الدم مكوّنات تعمل معًا", "كريات الدم الحمراء تنقل الأكسجين",
              "كريات الدم البيضاء تشارك في الدفاع", "الصفائح تساعد على إيقاف النزيف",
              "البلازما وسط النقل في الدم"]
    header_for(draw, titles[index], index + 1)
    vessel_box = (245, 298, 1035, 510)
    if index == 0:
        rounded(draw, vessel_box, 105, "#F8E9E4", "#E8D5D1", 3)
        for x, y in [(350, 375), (515, 440), (720, 365), (890, 435)]:
            draw_sphere(draw, x, y, 37, PALETTE["red"], PALETTE["red_soft"])
        draw_sphere(draw, 600, 360, 48, PALETTE["purple_soft"], PALETTE["purple"])
        for x, y in [(460, 480), (790, 475), (970, 350)]:
            draw.polygon([(x - 19, y), (x, y - 16), (x + 19, y), (x, y + 16)],
                         fill=PALETTE["lime_dark"])
        label(draw, 405, 267, "كريات حمراء", "Red blood cells", PALETTE["red"])
        label(draw, 660, 267, "كرية بيضاء", "White blood cell", PALETTE["purple"])
        label(draw, 920, 267, "صفائح", "Platelets", PALETTE["lime_dark"])
        takeaway = "بلازما + خلايا ومكوّنات خلوية"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            x = int(290 + (t * 85) % 680)
            draw_sphere(d, x, 405, 8, PALETTE["white"])
    elif index == 1:
        rounded(draw, vessel_box, 105, "#F8E9E4", "#E8D5D1", 3)
        label(draw, 650, 266, "الهيموغلوبين", "Hemoglobin", PALETTE["terra"])
        takeaway = "الرئتان  →  كريات الدم الحمراء  →  الأنسجة"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            drift = int(t * 28)
            for start in (350, 510, 670, 830):
                x = 280 + ((start - 280 + drift) % 720)
                draw_sphere(d, x, 405, 31, PALETTE["red"], PALETTE["red_soft"])
    elif index == 2:
        draw_sphere(draw, 642, 412, 112, PALETTE["purple_soft"], PALETTE["purple"])
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            x, y = 642 + int(136 * math.cos(rad)), 412 + int(136 * math.sin(rad))
            draw_sphere(draw, x, y, 10, PALETTE["terra"])
        label(draw, 964, 330, "جهاز المناعة", "Immune system", PALETTE["purple"])
        label(draw, 964, 478, "أنواع ووظائف مختلفة", "Different cell types", PALETTE["terra"])
        takeaway = "مقاومة الميكروبات جزء من دورها"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            pulse = int(108 + 7 * math.sin(t * 2.5))
            d.ellipse((642 - pulse, 412 - pulse, 642 + pulse, 412 + pulse),
                      outline=PALETTE["purple"], width=4)
    elif index == 3:
        rounded(draw, (265, 318, 1015, 495), 86, "#F8E9E4", "#E8D5D1", 3)
        draw.rectangle((620, 318, 675, 495), fill=PALETTE["white"])
        for x, y in [(558, 370), (589, 418), (555, 455), (731, 370),
                     (710, 438), (757, 461), (612, 350)]:
            draw.polygon([(x - 16, y), (x, y - 14), (x + 16, y), (x, y + 14)],
                         fill=PALETTE["terra"])
        label(draw, 460, 265, "وعاء دموي", "Blood vessel", PALETTE["blue"])
        label(draw, 800, 265, "صفائح دموية", "Platelets", PALETTE["terra"])
        takeaway = "تجمّع الصفائح + عوامل التخثّر"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            amount = int((t * 3) % 45)
            for step in range(4):
                x = 596 + ((amount + step * 15) % 80)
                d.line((x, 345, x + 25, 470), fill=PALETTE["lime_dark"], width=3)
    else:
        rounded(draw, vessel_box, 105, "#F8E9E4", "#E8D5D1", 3)
        for x, y, r, c in [(375, 403, 48, PALETTE["red"]),
                           (600, 403, 48, PALETTE["red"]),
                           (815, 403, 48, PALETTE["red"])]:
            draw_sphere(draw, x, y, r, c, PALETTE["red_soft"])
        rounded(draw, (250, 538, 1035, 591), 21, PALETTE["blue_soft"])
        txt(draw, (642, 564), "البلازما: الوسط السائل الناقل للمكوّنات والمواد", 19,
            PALETTE["blue"], True)
        takeaway = "الحمراء: أكسجين  •  البيضاء: دفاع  •  الصفائح: تخثّر"
        def motion(d: ImageDraw.ImageDraw, t: float) -> None:
            x = int(286 + (t * 92) % 710)
            draw_sphere(d, x, 403, 8, PALETTE["white"])
    return image, motion, takeaway


RENDERERS = {
    "bones.mp4": make_movement_scene,
    "heart.mp4": make_heart_scene,
    "blood.mp4": make_blood_scene,
}


def overlay_frame(base: Image.Image, motion: Callable[[ImageDraw.ImageDraw, float], None],
                  takeaway: str, scene_index: int, local_frame: int,
                  total_frame: int) -> Image.Image:
    frame = base.copy()
    draw = ImageDraw.Draw(frame)
    elapsed = local_frame / FPS
    motion(draw, elapsed)
    # Chapter progress is intentionally consistent with the app's 90% marker.
    progress = total_frame / max(1, FRAMES_PER_VIDEO - 1)
    draw.rounded_rectangle((84, 620, 1196, 628), radius=4, fill=PALETTE["line"])
    draw.rounded_rectangle((84, 620, int(84 + 1112 * progress), 628),
                           radius=4, fill=PALETTE["lime_dark"])
    for i in range(5):
        x = 84 + int(1112 * i / 4)
        radius = 8 if i == scene_index else 5
        draw.ellipse((x - radius, 624 - radius, x + radius, 624 + radius),
                     fill=PALETTE["terra"] if i == scene_index else PALETTE["white"],
                     outline=PALETTE["terra"] if i == scene_index else PALETTE["muted"], width=2)
    txt(draw, (640, 655), takeaway, 17, PALETTE["body"], True)
    return frame


def render_video(filename: str, scene_factory: Callable[[int], tuple[Image.Image,
                 Callable[[ImageDraw.ImageDraw, float], None], str]]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / filename
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size",
        f"{WIDTH}x{HEIGHT}", "-framerate", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "22",
        "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(target),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    cached = [scene_factory(i) for i in range(5)]
    previous = None
    fade_frames = 8
    try:
        for index in range(5):
            base, motion, takeaway = cached[index]
            for local_frame in range(SCENE_FRAMES):
                frame = overlay_frame(base, motion, takeaway, index, local_frame,
                                      index * SCENE_FRAMES + local_frame)
                if previous is not None and local_frame < fade_frames:
                    alpha = (local_frame + 1) / (fade_frames + 1)
                    frame = Image.blend(previous, frame, alpha)
                process.stdin.write(frame.tobytes())
                if local_frame == SCENE_FRAMES - 1:
                    previous = frame
    finally:
        process.stdin.close()
    return_code = process.wait()
    if return_code != 0:
        raise RuntimeError(f"ffmpeg failed for {filename}: {return_code}")
    print(f"Rendered {target} ({target.stat().st_size:,} bytes)")


def main() -> None:
    for filename, renderer in RENDERERS.items():
        render_video(filename, renderer)


if __name__ == "__main__":
    main()
