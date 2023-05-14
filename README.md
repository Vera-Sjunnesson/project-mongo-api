# Project Mongo API

This project is an API that provides data for 150 movies from A24 Studio. It was built using MongoDB, Mongoose, Node.js, Express.

## The problem

The problem was to set up MongoDB, store the data there and then to query that data from your API.

The main challenge was to learn all the new mongoose syntax and familiarize with the mongoose methods.

# Technologies used:
Node.js
Mongoose
Express
CORS
JSON
MongoDB
HomeBrew
Swagger
Express List Endpoints

# Features:
Retrieve data from all 150 movies
Limit the amount of pages and objects with page and limit query values
Filter out movies assciated with a specific director, producer or/and actor
Filter out movies with a imdb score and metascore greater than a specific value
Filter out movies with a specific rotten tomatoes score
Search for a movie by its title and director
Get a movie by its ID
Get a list of all the directors in the dataset
Get movie/movies with a specific director name

# Endpoints:
"/" - Defining the route with a welcome message and links

"/movies" - Get all movies in the dataset with paging, query values are page, limit, director, imdb, producer, starring

"/movies/score" - Get all movies by scores from imdb, metascore and rotten tomatoes in descending order (except rotten tomatoes which provides an exact match), default is top 5 movies from imdb

"/movies/:title" - Search for a movie by its title and director, query is director

"/movies/id/:id" - Get a movie by its ID

"/directors" - Get a list of all the directors in the dataset

"/directors/:name" - Get movies/movie by a specific director

# Data coming from:
https://www.kaggle.com/datasets/sebastiansuliborski/a24-studio-movies-dataset

## View it live

https://project-mongo-api-ozexcouyaq-lz.a.run.app/

https://project-mongo-api-ozexcouyaq-lz.a.run.app/api-docs
