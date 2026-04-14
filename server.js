const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure bookings.json exists on startup
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
  console.log('Created data/bookings.json');
}

// Movies data
const MOVIES = [
  { id: 1, title: "Spider-Man: Brand New Day",   genre: "Action / Superhero", price: 249,  poster: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Spider-Man_Brand_New_Day_poster.jpg/250px-Spider-Man_Brand_New_Day_poster.jpg" },
  { id: 2, title: "The Matrix",                  genre: "Sci-Fi / Action",    price: 199,  poster: "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_.jpg" },
  { id: 3, title: "Inception",                   genre: "Sci-Fi / Thriller",  price: 219,  poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg" },
  { id: 4, title: "Interstellar",                genre: "Sci-Fi / Drama",     price: 229,  poster: "https://m.media-amazon.com/images/I/61wrhEawgQL._AC_UF894,1000_QL80_.jpg" },
  { id: 5, title: "The Dark Knight",             genre: "Action / Crime",     price: 189,  poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg" },
  { id: 6, title: "Dhundhar (2025)",             genre: "Action / Thriller",  price: 199,  poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRm8NbwMpmda8-sVMKpcJEwav3E9WNGvVt9g&s" },
  { id: 7, title: "Dhundhar:The Revenge",        genre: "Action / Thriller",  price: 209,  poster: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/Dhurandhar-_The_Revenge_poster.jpg/250px-Dhurandhar-_The_Revenge_poster.jpg" },
];

// Helper: read bookings
function readBookings() {
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper: write bookings
function writeBookings(bookings) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

// Helper: generate booking ID
function generateBookingId() {
  return 'TKT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// GET /api/movies
app.get('/api/movies', (req, res) => {
  res.json(MOVIES);
});

// GET /api/bookings
app.get('/api/bookings', (req, res) => {
  const bookings = readBookings();
  res.json(bookings);
});

// POST /api/bookings
app.post('/api/bookings', (req, res) => {
  const { customerName, customerPhone, movieId, bookedSeats, totalPrice } = req.body;

  // Validation
  if (
    !customerName || customerName.trim() === '' ||
    !customerPhone || customerPhone.trim() === '' ||
    !movieId ||
    !bookedSeats || !Array.isArray(bookedSeats) || bookedSeats.length === 0 ||
    totalPrice === undefined || totalPrice === null
  ) {
    return res.status(400).json({ error: 'All fields are required and at least one seat must be selected.' });
  }

  const movie = MOVIES.find(m => m.id === Number(movieId));
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found.' });
  }

  const bookings = readBookings();

  // Check for seat conflicts
  const conflictingBookings = bookings.filter(b => b.movieId === Number(movieId));
  const alreadyBooked = conflictingBookings.flatMap(b => b.bookedSeats);
  const conflict = bookedSeats.filter(seat => alreadyBooked.includes(seat));

  if (conflict.length > 0) {
    return res.status(409).json({ error: `Seats already booked: ${conflict.join(', ')}` });
  }

  const newBooking = {
    bookingId: generateBookingId(),
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    movieId: Number(movieId),
    movieTitle: movie.title,
    bookedSeats,
    totalPrice,
    bookedAt: new Date().toISOString(),
  };

  bookings.push(newBooking);
  writeBookings(bookings);

  res.status(201).json({ message: 'Booking confirmed!', booking: newBooking });
});

app.listen(PORT, () => {
  console.log(`🎬 Ticketer running at http://localhost:${PORT}`);
});

// DELETE /api/bookings
app.delete('/api/bookings', (req, res) => {
    writeBookings([]);
    res.json({ message: 'All bookings cleared.' });
  });