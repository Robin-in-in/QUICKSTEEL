from flask import Flask, send_from_directory, render_template
import os

app = Flask(__name__, static_folder='public')

@app.route('/')
def index():
    return send_from_directory('src/client/html', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True)
