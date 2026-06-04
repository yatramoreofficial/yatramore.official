import http.server
import socketserver
import os

PORT = 8555
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Strip query parameters and anchors to find the true file path
        path = self.path.split('?')[0].split('#')[0]
        
        # If it has an extension or ends in a slash, handle standard SimpleHTTPRequestHandler logic
        _, ext = os.path.splitext(path)
        if ext or path.endswith('/'):
            return super().do_GET()
            
        # Check if the clean path + .html exists as a file
        html_path = os.path.join(DIRECTORY, path.lstrip('/')) + '.html'
        if os.path.exists(html_path):
            self.path = path + '.html'
            
        return super().do_GET()

    def end_headers(self):
        # Disable caching to ensure updates (like components.js) load instantly
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    # Allow port reuse immediately on restart
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CleanURLHandler) as httpd:
        print(f"==================================================")
        print(f"🚀 YatrAmore Local Testing Server Running!")
        print(f"🔗 URL: http://localhost:{PORT}")
        print(f"📂 Folder: {DIRECTORY}")
        print(f"🎯 Clean URLs enabled: /our-journey -> our-journey.html")
        print(f"==================================================")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
