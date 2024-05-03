from json import dumps
from time import time
from flask import request, send_file
from hashlib import sha256
from datetime import datetime
from requests import get
from requests import post 
from json     import loads
import spacy
nlp = spacy.load("en_core_web_sm")
from collections import Counter
import os
import random
import string
import json
import nltk
nltk.download('stopwords')
from nltk.corpus import stopwords

class Backend_Api:
    def __init__(self, app, config: dict) -> None:
        self.app = app
        
        self.image_api = {
            "API_URL" : "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
            "headers" : {"Authorization": "Bearer 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"}
        }

        self.caption_api = {
            "API_URL" : "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
            "headers" : {"Authorization": "Bearer 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"}
        }

        self.routes = {
            "/backend-api/generate_image": {
                "function": self.generate_image,
                "methods": ["POST"]
            },
            "/backend-api/generate_personalized_image": {
                "function": self.generate_personalized_image,
                "methods": ["POST"]
            },
            "/backend-api/generate_out_of_preference_image": {
                "function": self.generate_out_of_preference_image,
                "methods": ["POST"]
            },
            "/backend-api/get_image/<img_id>": {
                "function": self.get_image,
                "methods": ["GET"]
            },
            "/backend-api/feedback/<img_id>": {
                "function": self.feedback,
                "methods": ["PUT"]
            }
            
        }

    def find_preferences(self, original_prompt):
        prompt_file =  "server/prompts.json"
        with open(prompt_file, "r") as file:
            data = json.load(file)

        prompts = data.get("prompts", [])

        if len(prompts) < 10:
            return (original_prompt, original_prompt, [])

        filler_set = set(["give", "show", "display", "please", "can", "need", "want", "i", "me", "you", "generate"])
        stop_words = set(stopwords.words('english'))

        all_keywords = []
        for prompt in prompts:
            adj_tokens = []
            doc = nlp(prompt.lower())
            for token in doc:
                if (token.text.isalnum()) and (token.text not in stop_words) and (token.text not in filler_set) and token.pos_ != "NOUN":
                    adj_tokens.append(token.text)
            all_keywords.extend(adj_tokens)

        keyword_freq = Counter(all_keywords)
        preferences = [pair[0] for pair in keyword_freq.most_common(5)]

        modified_prompt = original_prompt
        for pref in preferences:
            modified_prompt += (" " + pref)

        return (original_prompt, modified_prompt, preferences)

    def negate_preferences(self, inputs):
        opposite_preferences = {
            "long sleeves": "short sleeves",
            "short sleeves": "long sleeves",
            "orange": "light blue",
            "blue": "faded yellow",
            "striped": "solid",
            "solid": "striped",
            "black": "white",
            "white": "black",
            "long": "short",
            "short": "long",
            "formal": "casual",
            "casual": "formal",
            "bright": "neutral",
            "neutral": "bright",
            "plain": "patterned",
            "patterned": "plain",
            "loose": "tight",
            "tight": "loose",
            "high": "low",
            "low": "high"
        }

        negative_preferences = []
        for pref in inputs[2]:
            if pref in opposite_preferences:
                negative_preferences.append(opposite_preferences[pref])

        modified_prompt = inputs[0]
        for pref in negative_preferences:
            modified_prompt += (" " + pref)

        return (inputs[0], modified_prompt)

    def generate_image(self, inputs=None):
        files = os.listdir("server/generations")
        if len(files) > 0:

            for file in files:
                file_path = os.path.join("server/generations", file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        
        prompt = None
        if(inputs != None):
            prompt = inputs[1]
        else:
            prompt = request.json["meta"]["content"]["parts"][0]["content"]

        api_res = post(url = self.image_api["API_URL"], 
        headers = self.image_api["headers"],
        json = {
            "inputs": prompt
        })

        image_id = ''.join(random.choices(string.ascii_uppercase, k=6))

        with open("server/generations/"+image_id+".png", 'wb') as f:
            f.write(api_res.content)

        res = {
            "status_code": api_res.status_code,
            "ok": api_res.ok,
            "image_id": image_id
        }

        prompt_file =  "server/prompts.json"

        if(inputs != None):
            prompt = inputs[0]
        # Read the existing JSON file
        with open(prompt_file, "r") as file:
            data = json.load(file)

        # Get the list of prompts from the JSON data
        prompts = data.get("prompts", [])

        # Add the new prompt to the list
        prompts.insert(0, prompt)

        # To get the recent 10 prompts only
        if len(prompts) > 10:
            prompts.pop()

        # Update the JSON data with the new list of prompts
        data["prompts"] = prompts

        # Write the updated JSON data back to the file
        with open(prompt_file, "w") as file:
            json.dump(data, file)

        return res

    def generate_personalized_image(self):
        prompt = request.json["meta"]["content"]["parts"][0]["content"]
        inputs = self.find_preferences(prompt)
        return self.generate_image(inputs=inputs)

    def generate_out_of_preference_image(self):
        prompt = request.json["meta"]["content"]["parts"][0]["content"]
        inputs = self.find_preferences(prompt)
        negated_inputs = self.negate_preferences(inputs)
        return self.generate_image(inputs=negated_inputs)
    
    def feedback(self, img_id):
        prompt_file =  "server/prompts.json"
        with open(prompt_file, "r") as file:
            prompt_data = json.load(file)

        prompts = prompt_data.get("prompts", [])

        filename = "server/generations/"+img_id+".png"
        
        with open(filename, "rb") as f:
            img_data = f.read()
            
        api_res = post(url = self.caption_api["API_URL"], 
        headers = self.caption_api["headers"],
        data = img_data
        )

        caption = (api_res.json())[0]["generated_text"]

        prompts.insert(0, caption)
        prompt_data["prompts"] = prompts

        with open(prompt_file, "w") as file:
            json.dump(prompt_data, file)

        res = {
            "status_code": api_res.status_code,
            "ok": api_res.ok,
        }

        return res

    def get_image(self, img_id):
        return send_file("generations\\"+img_id+".png")


