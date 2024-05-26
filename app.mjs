import express from 'express'
import movies from './movies.json' assert {type: 'json'}
import crypto from 'node:crypto'
import { validateMovie, validatePartialMovie } from './schemas/movies.js'
import cors from 'cors'


const port = process.env.PORT ?? 1234
const app = express()

app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:3000',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))
app.disable('x-powered-by')


app.get('/movies', (req, res) => {
  
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movie/:id', (req, res) => {
  
  const {id} = req.params
  const movie = movies.find(movie => movie.id===id)
  if(movie){
    return res.json(movie)
  }
  res.status(404).json({message: 'Movie not found'})
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})


app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (result.error){
    return res.status(400).json({error: JSON.parse(result.error.message)})
  }

  const {title, genre, year, director, duration, rate, poster} = req.body
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  movies.push(newMovie)
  console.log(movies)
  res.status(201).json(newMovie)
})

app.patch('/movie/:id',(req,res) =>{
  const {id} = req.params
  const result = validatePartialMovie(req.body)
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if(!result.success) {return res.status(400).json({error: JSON.parse(result.error.message)})}
  if(movieIndex===-1){return res.status(404).json({message: 'Movie not found'})}

  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updatedMovie

  return res.json(updatedMovie)
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})