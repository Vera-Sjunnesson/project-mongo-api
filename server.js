import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import a24MoviesList from './data/a24movies.json';

dotenv.config()

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/project-mongo'
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());
const listEndPoints = require('express-list-endpoints');

const { Schema } = mongoose;

/* const userSchema = new Schema ({
  name: String,
  age: Number,
  alive: Boolean
});

const User = mongoose.model("User", userSchema);
 */
const a24MoviesSchema = new Schema({
  id: Number,
  title: String,
  Directed_by: [String],
  Written_by: [String],
  Produced_by: [String],
  Starring: [String],
  Cinematography: [String],
  Edited_by: [String],
  Music_by: [String],
  Production_companies: [String],
  Distributed_by: [String],
  Country: String,
  Language: String,
  Running_time: Number,
  Budget: Number,
  Box_office: Number,
  Release_dates: String,
  imdb_score: Number,
  metascore: Number,
  rotten_tomatoes: String,
  Screenplay_by: [String],
  Based_on: [String]
})

const A24Movies = mongoose.model("A24Movies", a24MoviesSchema);

if(process.env.RESET_DB) {
  const resetDatabase = async () => {
    await A24Movies.deleteMany()
    a24MoviesList.forEach((singleMovie) => {
      const newMovie = new A24Movies(singleMovie);
      newMovie.save();
    })
  }
  resetDatabase();
}

app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailable' })
  }
}
)

// Start defining your routes here
app.get("/", (req, res) => {
  res.json(listEndPoints(app));
});

app.get("/a24movies", async (req, res) => {
  const { director, imdb } = req.query;
  const response = {
    success: true,
    body: {}
  }
  const directorRegex = new RegExp(director, 'i')
  const imdbScorequery = { $gt: imdb ? imdb : 0 }
  try {
    const searchResultFromDB = await A24Movies.find({ Directed_by: { $all: [directorRegex] }, imdb_score: imdbScorequery })
    if (searchResultFromDB.length > 0) {
      response.body = searchResultFromDB
      res.status(200).json(response)
    } else {
      response.success = false,
      res.status(500).json(response)
    }
  } catch(err) {
    response.success = false,
    res.status(500).json(response)
  }
  });

app.get("/a24movies/id/:id", async (req, res) => {
try {
  const singleMovie = await A24Movies.findById(req.params.id);
  if (singleMovie) {
    res.status(200).json({
      success: true,
      body: singleMovie
    })
  } else {
    res.status(404).json({
      success: false,
      body: {
        message: "Movie not found"
      }
    })
  }
} catch(err) {
  res.status(500).json({
    success: false,
    body: {
      message: "Invalid movie id"
    }
  })
}
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
