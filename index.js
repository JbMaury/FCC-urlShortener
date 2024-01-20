require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");

// MongoDB connection
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
});
// Checking connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", console.log.bind(console, "connected to mongoDB"));

// Schema
const UrlShortenerSchema = new mongoose.Schema({
  url: String,
});

// Model
const urlModel = mongoose.model("url", UrlShortenerSchema);

// Cross-Origin Resource Sharing middleware
app.use(cors());

// Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Static files access middleware
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// Url Shortener API endpoint
app.post("/api/shorturl/", (req, res) => {
  const urlInput = req.body.url;
  let urlObject;
  try {
    urlObject = new URL(urlInput);
  } catch (error) {
    res.json({ error: "invalid url" });
  }
  dns.lookup(urlObject.hostname, (err, address) => {
    if (err) {
      res.json({ error: "hostname error" });
    } else {
      const existingUrlQuery = UrlModel.findOne({ url: urlObject.href });
      console.log("test 1");
      try {
        console.log("test 2");
        const existingUrl = existingUrlQuery.exec();
        console.log("test 3");
        if (existingUrl) {
          console.log("url en db");
          console.log(existingUrl);
          res.json({
            original_url: existingUrl.url,
            short_url: existingUrl._id,
          });
        } else {
          console.log("création nouvelle url");
          const newUrl = new urlModel({ url: urlInput });
          newUrl.save();
          res.json({ original_url: newUrl.url, short_url: newUrl._id });
        }
      } catch (error) {
        res.json({ error: "database error try/catch" });
      }
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
