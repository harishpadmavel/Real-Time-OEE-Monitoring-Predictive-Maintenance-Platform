const mongoose = require("mongoose");

async function connectDB() {
if (mongoose.connection.readyState === 1) {
return mongoose.connection;
}

const uri = process.env.MONGO_URI || process.env.MONGO_URL;

if (!uri) {
throw new Error("MONGO_URI is missing from environment variables");
}

try {
const conn = await mongoose.connect(uri, {
serverSelectionTimeoutMS: 10000,
});

```
console.log("MongoDB connected successfully");
return conn;
```

} catch (err) {
console.error("MongoDB connection failed:", err.message);
throw err;
}
}

module.exports = connectDB;
