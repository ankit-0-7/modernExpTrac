import os
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import pandas as pd
from prophet import Prophet
from dotenv import load_dotenv
from datetime import datetime, timedelta
from bson import ObjectId # <--- NEW: Import this tool

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) # Allow Node.js to talk to this server

# --- DATABASE CONNECTION ---
# We use the same Mongo URI as your backend
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client['test']# Auto-selects the database from the URI
expenses_collection = db.expenses

@app.route('/predict/<user_id>', methods=['GET'])
def predict_expenses(user_id):
    try:
        # --- FIX: Convert string ID to MongoDB ObjectId ---
        try:
            user_obj_id = ObjectId(user_id)
        except:
            return jsonify({"error": "Invalid User ID format"}), 400

        # 1. Fetch Data using the ObjectId
        data = list(expenses_collection.find(
            {"user": user_obj_id}, # <--- Use the converted ID here
            {"amount": 1, "date": 1, "_id": 0}
        ))
        
        print(f"Found {len(data)} expenses for user {user_id}") # Debugging line

        if not data or len(data) < 5:
            return jsonify({"error": f"Not enough data. Found {len(data)} items. Need 5."}), 400

        # 2. Prepare Data for Prophet
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        
        # Group by day
        daily_sales = df.groupby('date')['amount'].sum().reset_index()
        daily_sales.columns = ['ds', 'y']

        # 3. Train Model
        m = Prophet(daily_seasonality=True)
        m.add_country_holidays(country_name='IN')
        m.fit(daily_sales)
        # Optional: Print holidays to seeing what it found (Check your terminal!)
        print("Holidays found:", m.train_holiday_names)

        # 4. Predict Future (30 Days)
        future = m.make_future_dataframe(periods=30)
        forecast = m.predict(future)

        # 5. Format Result
        future_forecast = forecast.tail(30)
        
        result = []
        for index, row in future_forecast.iterrows():
            result.append({
                "date": row['ds'].strftime('%Y-%m-%d'),
                "predicted_amount": round(row['yhat'], 2),
                "lower_bound": round(row['yhat_lower'], 2),
                "upper_bound": round(row['yhat_upper'], 2)
            })

        return jsonify({
            "forecast": result,
            "total_predicted_spend": round(sum(item['predicted_amount'] for item in result), 2)
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 so it doesn't clash with Node.js (5000)
    app.run(host='0.0.0.0', port=5001)