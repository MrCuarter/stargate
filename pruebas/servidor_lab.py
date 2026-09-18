"""
El servidor de ficheros del laboratorio (18-sep-2026).

`python3 -m http.server` solo deja 5 conexiones en cola: una pantalla con decenas de avatares («Mi gente») las desborda
y el navegador recibe ERR_CONNECTION_RESET, que el laboratorio cuenta como error de la página (y no lo es). Este es el
mismo servidor con una cola de 256 y un hilo por petición. Uso:  python3 servidor_lab.py PUERTO   (sirve la carpeta actual)
"""
import http.server, sys

class Servidor(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True

class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

if __name__ == "__main__":
    Servidor(("127.0.0.1", int(sys.argv[1])), Silencioso).serve_forever()
