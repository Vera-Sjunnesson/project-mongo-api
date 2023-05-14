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

// Swagger for API documentation
const swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('./swagger.json');

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());
const listEndPoints = require('express-list-endpoints');

const { Schema } = mongoose;

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

  const welcomeText = "Top movies from A24 Studio, one of the best movie studios in the world";
  const apiDocumentation = "https://project-mongo-api-ozexcouyaq-lz.a.run.app";
  const endpoints = (listEndPoints(app))

  res.send({
    body: {
      welcomeText,
      apiDocumentation,
      endpoints
    }
  });
});

//Get all movies in the dataset with paging, query values are page, limit, director, imdb, producer, starring
// Example: https://project-mongo-api-ozexcouyaq-lz.a.run.app/movies?page=1&limit=2&director=coppola
app.get("/movies", async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 10, director, imdb, producer, starring } = req.query;

  const directorRegex = new RegExp(director, 'i')
  const producerRegex = new RegExp(producer, 'i')
  const starringRegex = new RegExp(starring, 'i')
  const imdbScorequery = { $gt: imdb ? imdb : 0 }
  try {

    // execute query with page, limit, director, imdb, producer, starring values
    const movieList = await A24Movies.find({ Directed_by: { $all: [directorRegex] }, Produced_by: { $all: [producerRegex] }, Starring: { $all: [starringRegex] }, imdb_score: imdbScorequery })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // get total documents in the Posts collection
    const count = await A24Movies.countDocuments();

     // return response with posts, total pages, and current page
    if (movieList.length > 0) {
      res.status(200).json({
        success: true,
        body: {
          movieList,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalMovies: count
        }
      });
    } else {
      res.status(404).json({
        success: false,
        body: {
          message: "No movies found in list"
        }
      })
    }
  } catch(err) {
    res.status(500).json({
      success: false,
      body: {
        message: "Internal Server Error"
      }
    })
  }
});

//Get all movies by scores from imdb, metascore and rotten tomatoes in descending order (except rotten tomatoes which provides an exact match), default is top 5 movies from imdb
// Example: https://project-mongo-api-ozexcouyaq-lz.a.run.app/movies/score?rottentomatoes=80
app.get("/movies/score", async (req, res) => {
  const { imdb, metascore, rottentomatoes } = req.query;
  const imdbScorequery = { $gt: imdb ? imdb : 0 }
  const metaScorequery = { $gt: metascore ? metascore : 0 }
  
  const pipeline = [
    {
      $match: {
        imdb_score: imdbScorequery,
        metascore: metaScorequery,
        rotten_tomatoes: { $regex: `^${rottentomatoes}` }
      }
    },
    {
      $addFields: {
        rotten_tomatoes_number: {
          $convert: { input: { $trim: { input: "$rotten_tomatoes", chars: "%" } }, to: "double" }
        }
      }
    },
    { $sort: { rotten_tomatoes_number: -1, imdb_score: -1, metascore: -1 } },
    { $limit: 5 }
  ];

  try {
    const scoredMovies = await A24Movies.aggregate(pipeline);
    const top5ImdbMovies = await A24Movies.find({}).sort({imdb_score: -1, metascore: -1 }).limit( 5 )
    if (scoredMovies.length > 0) {
      res.status(200).json({
        success: true,
        body: scoredMovies
      })
    } else if (top5ImdbMovies.length > 0) {
      res.status(202).json({
        success: true,
        body: top5ImdbMovies
      })
    } else {
      res.status(404).json({
        success: false,
        body: {
          message: "Score list not found"
        }
      })
    }
  } catch(err) {
    res.status(500).json({
      success: false,
      body: {
        message: "Internal Server Error"
      }
    })
  }
  });


// Get a movie by its title and director, query is director
// Example: https://project-mongo-api-ozexcouyaq-lz.a.run.app/movies/aftersun
app.get("/movies/:title", async (req, res) => {
  const singleTitle = req.params.title
  const { director } = req.query;
  
  const titleRegex = new RegExp(singleTitle, 'i')
  const directorRegex = new RegExp(director, 'i')
  try {
    const searchedTitle = await A24Movies.find({ title: titleRegex, Directed_by: { $all: [directorRegex] } })
    if (searchedTitle.length > 0) {
      res.status(200).json({
        success: true,
        body: searchedTitle
    })
    } else {
        res.status(404).json({
          success: false,
          body: {
            message: "Movie title not found"
          }
      })
    }
  } catch(err) {
      res.status(500).json({
        success: false,
        body: {
          message: "Internal Server Error"
        }
      })
  }
});

// Get a movie by its ID
// Example: https://project-mongo-api-ozexcouyaq-lz.a.run.app/movies/id/6460f888911f0284bb5abb93
app.get("/movies/id/:id", async (req, res) => {
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
          message: "No movie with that id"
        }
      })
    }
  } catch(err) {
    res.status(500).json({
      success: false,
      body: {
        message: "Internal Server Error"
      }
    })
  }
  });


//Get a list of all the directors in the dataset
// Example: https://project-mongo-api-ozexcouyaq-lz.a.run.app/directors
app.get("/directors", async (req, res) => {
  try {
    const directorList = await A24Movies.find({}, { Directed_by: 1, _id: 0 });
    const directorListExtracted = directorList.map(movie => movie.Directed_by).flat();

    const directorObjects = directorListExtracted.map((director, index) => {
      return {
        id: index,
        name: director
      };
    });

    if (directorListExtracted) {
      res.status(200).json({
        success: true,
        body: directorObjects
      })
    } else {
      res.status(404).json({
        success: false,
        body: {
          message: "List of directors not found"
        }
      })
    }
  } catch(err) {
    res.status(500).json({
      success: false,
      body: {
        message: "Internal Server Error"
      }
    })
  }
  });


//Get movies by a specific director name
// Example: https://project-mongo-api-ozexcouyaq-lz.a.run.app/directors/glazer
app.get("/directors/:name", async (req, res) => {
  const singleDirector = req.params.name;
  const directorRegex = new RegExp(singleDirector, 'i')
  try {
    const directorsMovies = await A24Movies.find({ Directed_by: { $regex: directorRegex } });
    const directorObjects = directorsMovies.reduce((result, movie) => {
      const directors = movie.Directed_by || [];
      directors.forEach(director => {
        if (!result[director]) {
          result[director] = {
            name: director,
            directed_movies: []
          };
        }
        result[director].directed_movies.push(movie);
      });
      return result;
    }, {});

    const directorArray = Object.values(directorObjects).map((director, index) => {
      return {
        id: index,
        name: director.name,
        directed_movies: director.directed_movies
      };
    });

    if (directorsMovies.length > 0) {
      res.status(200).json({
        success: true,
        body: directorArray
      })
    } else {
      res.status(404).json({
        success: false,
        body: {
          message: "No movies by director found"
        }
      })
    }
  } catch(err) {
    res.status(500).json({
      success: false,
      body: {
        message: "Internal Server Error"
      }
    })
  }
  });

app.use(
  '/api-docs',
  swaggerUi.serve, 
  swaggerUi.setup(swaggerDocument)
);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
