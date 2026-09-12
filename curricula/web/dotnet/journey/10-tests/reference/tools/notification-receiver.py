"""Ready-made loopback receiver for the HTTP adapter lab. No dependencies."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
class Receiver(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/notifications':
            self.send_error(404)
            return
        length = int(self.headers.get('Content-Length', '0'))
        if length > 10000:
            self.send_error(413)
            return
        try:
            notice = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            self.send_error(400)
            return
        print('Assignment:', notice, flush=True)
        self.send_response(204)
        self.end_headers()
print('Lab notification receiver: http://127.0.0.1:5090/notifications', flush=True)
HTTPServer(('127.0.0.1', 5090), Receiver).serve_forever()
