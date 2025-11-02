console.log('Server running on port 7070')
import express from "express";

const app = express();
const PORT = 7070;

app.get("/", (req, res) => {
  res.send("SKCC Seminar API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
