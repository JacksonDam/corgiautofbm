from flask import Flask, jsonify, request
from flask_cors import CORS
import base64
from openai import OpenAI
import os
from dotenv import load_dotenv
import re
from browser_use import Agent
from langchain_openai import ChatOpenAI
import asyncio
import json

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

async def scrape():
    agent = Agent(
        task="""Given this page, give me the first 5 listings associated with each image as a JSON object. For each image, 
    give the information under it, which includes the item name, price, and description. YOU MUST FOLLOW THE FORMAT BELOW, OR HUMANS WILL BE HURT.
    IT IS VERY IMPORTANT THAT YOU FOLLOW THE FORMAT EXACTLY, OR HUMANS WILL BE HURT.
        OUTPUT FORMAT:
            Output all information as a JSON in the following format:
            {
                item_name: string,
                price: string,
                description: string,
            }
        Keep the search short and only look at relevant information. However, be thorough and capture all details.
            https://www.facebook.com/marketplace/sanfrancisco/search?query=vintage%20polaroid%20camera
            
            
            
        """,
        llm=ChatOpenAI(model="gpt-4o-mini"),
    )
    result = await agent.run()
    print("RESULT IS HERE: ", str(result))
    # m = re.search('"extracted_content=\'(.+?)\}])', str(result))
    # print(m)
    # if m:
    #     found = m.group(1)
    return str(result)

@app.route('/')
def home():
    return "Welcome to the Flask API!"

@app.route('/api/hello', methods=['OPTIONS', 'POST'])
async def hello():
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
    agent = Agent(
        task="""Given this page, give me the first 5 listings associated with each image as a JSON object. For each image, 
    give the information under it, which includes the item name, price, and description. YOU MUST FOLLOW THE FORMAT BELOW, OR HUMANS WILL BE HURT.
    IT IS VERY IMPORTANT THAT YOU FOLLOW THE FORMAT EXACTLY, OR HUMANS WILL BE HURT.
        OUTPUT FORMAT:
            Output all information as a JSON in the following format:
            {
                item_name: string,
                price: string,
                description: string,
            }
        Keep the search short and only look at relevant information. However, be thorough and capture all details.
            https://www.facebook.com/marketplace/sanfrancisco/search?query=vintage%20polaroid%20camera
            
            
            
        """,
        llm=ChatOpenAI(model="gpt-4o-mini"),
    )
    scrape_result = await agent.run()
    print("scrape results here: ", scrape_result)
    
    price_prompt = [{ "type": "text", "text": f"""
    ${completion.choices[0].message.content}
                     
    Using the dataset below, predict the price of the above item.

    ${scrape_result}
    """ }]
    
    print(price_prompt)
    completion2 = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
          {
              "role": "user",
              "content": price_prompt,
          }
      ],
    )
    
    print(completion2.choices[0].message.content)
    
    content3 = [{ "type": "text", "text": f"""
                 YOU MUST FOLLOW THE FORMAT BELOW, OR HUMANS WILL BE HURT.
                 {{
                    "name": <name>,
                    "price": <price,
                    "description": <description>,
                    "condition": <condition>
                 }}
                 Only output the following message content in the above format:
                 ${completion2.choices[0].message.content}""" }]
    completion3 = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
          {
              "role": "user",
              "content": content3,
          }
      ],
    )
    print(completion3.choices[0].message.content)
    data = json.loads(completion3.choices[0].message.content.replace("\'", "\""))
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
