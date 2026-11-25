"""Render Midnight Ramen's screenshots with headless Chrome, straight from game/index.html.

The bounty's rules are explicit: screenshots must be real renders of the game's own code in a
browser, never edited or composited. So this does exactly one thing per shot — open the page at
?shot=<scene>&seed=1 in a 1280x720 viewport and screenshot the canvas element.
"""
import http.server
import os
import socketserver
import sys
import threading
import pathlib

REPO = pathlib.Path("/home/ubuntu/makefun/work/repos/best-cooking-game-20261125-0137")
GAME = REPO / "game"
OUT = REPO / "screenshots"
PORT = 8731


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(GAME), **kw)

    def log_message(self, *a):
        pass


def serve():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), Quiet)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


SHOTS = [
    ("1-service.jpg", "play", 1),
    ("2-ready.jpg", "ready", 1),
    ("3-title.jpg", "start", 1),
    ("4-closing.jpg", "end", 1),
]


def main():
    from playwright.sync_api import sync_playwright

    OUT.mkdir(parents=True, exist_ok=True)
    httpd = serve()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
            page = browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            for name, scene, seed in SHOTS:
                page.goto(f"http://127.0.0.1:{PORT}/index.html?shot={scene}&seed={seed}", wait_until="load")
                page.wait_for_timeout(700)
                page.locator("#game").screenshot(path=str(OUT / name), type="jpeg", quality=90)
                size = (OUT / name).stat().st_size
                print(f"{name} {size} bytes")
            browser.close()
            if errors:
                print("PAGE ERRORS:", errors[:6])
                return 1
    finally:
        httpd.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
