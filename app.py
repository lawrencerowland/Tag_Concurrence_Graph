from flask import Flask, render_template, jsonify, send_from_directory
import json
import os

app = Flask(__name__)
app.secret_key = "tag_network_visualization_secret"

# Load network data
def load_network_data():
    with open('tag_concurrence_graph.json', 'r') as f:
        data = json.load(f)
        
        # Transform data to Cytoscape format
        elements = {
            "nodes": [
                {
                    "data": {
                        "id": node["id"],
                        "weight": node["weight"]  # Use weight directly from node data
                    }
                } for node in data["nodes"]
            ],
            "edges": [
                {
                    "data": {
                        "id": f"{edge['source']}-{edge['target']}",
                        "source": edge["source"],
                        "target": edge["target"],
                        "weight": edge.get("weight", 1)
                    }
                } for edge in data.get("edges", [])
            ]
        }
        return elements

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/network')
def get_network():
    return jsonify(load_network_data())

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')