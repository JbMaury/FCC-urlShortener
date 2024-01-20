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
  urlShort: Number,
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
  if (urlObject) {
    dns.lookup(urlObject.hostname, async (err, address) => {
      if (err) {
        res.json({ error: "invalid url" });
      } else {
        const existingUrlQuery = urlModel.findOne({ url: urlInput });
        try {
          const existingUrl = await existingUrlQuery.exec();
          if (existingUrl) {
            console.log("url deja en db");
            console.log(existingUrl);
            res.json({
              original_url: existingUrl.url,
              short_url: existingUrl.urlShort,
            });
          } else {
            const urlId = Math.floor(Math.random() * 9999) + 1;
            console.log(urlId);
            while (await urlModel.findOne({ urlShort: urlId }).exec()) {
              urlId = Math.floor(Math.random() * 9999) + 1;
            }
            const newUrl = new urlModel({ url: urlInput, urlShort: urlId });
            newUrl.save();
            res.json({ original_url: newUrl.url, short_url: newUrl.urlShort });
          }
        } catch (error) {
          res.json({ error: "database error try/catch" });
        }
      }
    });
  }
});

app.get("/api/shorturl/:urlShort", async (req, res) => {
  const urlId = req.params.urlShort;
  const url = await urlModel.findOne({ urlShort: urlId }).exec();
  if (url) {
    res.redirect(url.url);
  } else {
    res.json({ error: "url not found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
