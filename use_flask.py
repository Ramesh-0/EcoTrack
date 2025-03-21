"""
A simple Flask app to test if we can run web servers with your current Python setup.
This is only for testing purposes.
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Flask server is running!"})

@app.route('/test')
def test():
    return jsonify({"message": "This is a test endpoint"})

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=8000, debug=True) 