from flask import Flask, render_template, request
import requests


app = Flask(__name__, template_folder='./../client/html')

if __name__ == '__main__':
    app.run(debug=True)
