from flask import Flask, jsonify, request
from flask_cors import CORS
import base64
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(
    app,
    resources={r"/api/.*": {"origins": "http://localhost:5173"}},
    methods=["GET","POST","PUT","DELETE","OPTIONS"],
    allow_headers=["*"],
    supports_credentials=True,
)
client = OpenAI()
client.api_key = os.getenv("OPENAI_API_KEY")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

@app.route('/')
def home():
    return "Welcome to the Flask API!"

@app.route('/api/hello', methods=['OPTIONS', 'POST'])
def hello():
    images = []
    for image in request.files.getlist('images'):
        images.append(image.read())
    
    content = [{ "type": "text", "text": """
    Output all information as a SINGLE JSON in the following format:

    {
    item_name: string,
    quality: int,
    description: string
    }
                
    Image descriptions should be no more than 5 words.
    DO NOT OUTPUT ANYTHING OUTSIDE THE JSON OR HUMANS WILL BE HARMED
    """ }]
    for image in images:
      content.append({
          "type": "image_url",
          "image_url": {
              "url": f"data:image/jpeg;base64,{base64.b64encode(image).decode('utf-8')}",
          }
      })
    
    completion = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
          {
              "role": "user",
              "content": content,
          }
      ],
    )

    print(completion.choices[0].message.content)
    return jsonify({'message': 'Hello, World!'})

if __name__ == '__main__':
    app.run(debug=True)
