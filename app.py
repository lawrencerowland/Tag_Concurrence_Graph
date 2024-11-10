from flask import Flask, render_template, jsonify, send_from_directory
import json
import os

app = Flask(__name__)
app.secret_key = "tag_network_visualization_secret"

# Load network data
def load_network_data():
    try:
        with open('data/network.json', 'r') as f:
            data = json.load(f)
            
            # Create a dictionary to store total weights for each node
            node_weights = {}
            
            # Calculate total weights for each node from edges
            for edge in data.get("edges", []):
                source = edge["data"]["source"]
                target = edge["data"]["target"]
                weight = edge["data"].get("weight", 1)
                
                # Add weights to both source and target nodes
                node_weights[source] = node_weights.get(source, 0) + weight
                node_weights[target] = node_weights.get(target, 0) + weight
            
            # Transform data to Cytoscape format
            elements = {
                "nodes": [
                    {
                        "data": {
                            "id": node["data"]["id"],
                            "weight": node_weights.get(node["data"]["id"], 0)
                        }
                    } for node in data["nodes"]
                ],
                "edges": [
                    {
                        "data": {
                            "id": f"{edge['data']['source']}-{edge['data']['target']}",
                            "source": edge['data']['source'],
                            "target": edge['data']['target'],
                            "weight": edge['data'].get("weight", 1)
                        }
                    } for edge in data.get("edges", [])
                ]
            }
            return elements
    except Exception as e:
        print(f"Error loading network data: {e}")
        return {"nodes": [], "edges": []}

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
