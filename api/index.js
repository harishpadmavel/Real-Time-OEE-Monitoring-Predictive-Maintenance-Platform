const connectDB = require("../03-backend-code/config/db");
const { app } = require("../03-backend-code/server");

module.exports = async (req, res) => {
  try {
    const hasMongo = process.env.MONGO_URI || process.env.MONGO_URL;
    if (hasMongo) {
      await connectDB();
    } else {
      console.warn("⚠️ Neither MONGO_URI nor MONGO_URL is set in Vercel environment variables.");
    }
  } catch (dbErr) {
    console.error("Database connection error in serverless handler:", dbErr.message);
  }

  return app(req, res);
};
