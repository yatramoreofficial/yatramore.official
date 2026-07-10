from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8555/collaborator")
        
        # Scroll to form
        page.evaluate("document.getElementById('lucky-draw-form').scrollIntoView()")
        time.sleep(1)
        
        # Fill form
        page.fill('#ld-name', 'Test')
        page.fill('#ld-email', 'test_py@example.com')
        page.fill('#ld-country', 'TestLand')
        
        # Stub the Turnstile response so validation passes
        page.evaluate('() => { const input = document.createElement("input"); input.type = "hidden"; input.name = "cf-turnstile-response"; input.value = "dummy"; document.getElementById("lucky-draw-form").appendChild(input); }')
        
        # Click submit
        page.click('#ld-submit-btn')
        
        # Wait 3 seconds for fireworks
        time.sleep(3)
        
        # Take screenshot
        page.screenshot(path="fireworks_test.png")
        
        # Check if canvas exists
        has_canvas = page.evaluate("document.querySelectorAll('canvas').length > 0")
        print("Has canvas:", has_canvas)
        
        browser.close()

run()
