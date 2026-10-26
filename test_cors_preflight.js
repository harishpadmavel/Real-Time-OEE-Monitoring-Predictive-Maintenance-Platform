const { app, server } = require("./03-backend-code/server");
const http = require("http");
const assert = require("assert");

const testServer = server.listen(0, async () => {
  const port = testServer.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    for (let i = 1; i <= 10; i++) {
      await new Promise((resolve, reject) => {
        const req = http.request(
          {
            port,
            method: "OPTIONS",
            path: "/api/auth/login",
            headers: {
              Origin: "https://real-time-oee-monitoring-predictive.vercel.app",
              "Access-Control-Request-Method": "POST",
              "Access-Control-Request-Headers": "content-type",
            },
          },
          (res) => {
            try {
              assert.strictEqual(res.statusCode, 200, `Expected status 200, got ${res.statusCode}`);
              assert.strictEqual(
                res.headers["access-control-allow-origin"],
                "https://real-time-oee-monitoring-predictive.vercel.app",
                "Expected Access-Control-Allow-Origin header"
              );
              assert.strictEqual(
                res.headers["access-control-allow-credentials"],
                "true",
                "Expected Access-Control-Allow-Credentials: true"
              );
              assert(
                (res.headers["access-control-allow-methods"] || "").includes("POST"),
                "Expected POST in Access-Control-Allow-Methods"
              );
              assert(
                (res.headers["access-control-allow-headers"] || "").toLowerCase().includes("content-type"),
                "Expected content-type in Access-Control-Allow-Headers"
              );
              console.log(
                `Iteration ${i}: PASS [${res.statusCode} OK] Origin: ${res.headers["access-control-allow-origin"]}`
              );
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
        req.on("error", reject);
        req.end();
      });
    }

    console.log("\n=================================================");
    console.log("🎉 ALL 10 REPEATABLE OPTIONS TESTS PASSED (100% SUCCESS)");
    console.log("=================================================");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    testServer.close(() => process.exit(0));
  }
});
