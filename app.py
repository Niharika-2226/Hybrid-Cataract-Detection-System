from flask import Flask, render_template, request, jsonify
from model_utils import hybrid_predict

app = Flask(__name__)


# ================================
# HOME PAGE
# ================================

@app.route("/")
def home():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template('about.html')

# ================================
# PREDICT ROUTE
# ================================

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"})

        file = request.files["image"]

        # 👇 THIS IS IMPORTANT
        result = hybrid_predict(file)

        return jsonify(result)

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)})


# ================================
# RUN APP
# ================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)