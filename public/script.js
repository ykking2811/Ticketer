/* =============================================================
   TICKETER — Frontend Script
   ============================================================= */

   const API = 'http://localhost:3000/api';

   const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
   const COLS = [1, 2, 3, 4, 5, 6, 7, 8];
   
   let movies        = [];
   let selectedMovie = null;
   let selectedSeats = [];
   let bookedSeats   = [];
   
   // DOM refs
   const movieSelect   = document.getElementById('movieSelect');
   const movieGenre    = document.getElementById('movieGenre');
   const moviePrice    = document.getElementById('moviePrice');
   const movieMeta     = document.getElementById('movieMeta');
   const moviePoster   = document.getElementById('moviePoster');
   const posterPlaceholder = document.getElementById('posterPlaceholder');
   const seatGrid      = document.getElementById('seatGrid');
   const summaryMovie  = document.getElementById('summaryMovie');
   const summarySeats  = document.getElementById('summarySeats');
   const summaryTotal  = document.getElementById('summaryTotal');
   const customerName  = document.getElementById('customerName');
   const customerPhone = document.getElementById('customerPhone');
   const confirmBtn    = document.getElementById('confirmBtn');
   const btnText       = confirmBtn.querySelector('.btn-text');
   const btnLoader     = confirmBtn.querySelector('.btn-loader');
   const formError     = document.getElementById('formError');
   const bookingsList  = document.getElementById('bookingsList');
   const refreshBtn    = document.getElementById('refreshBookingsBtn');
   
   /* ----------------------------------------------------------
      INIT
      ---------------------------------------------------------- */
   async function init() {
     await fetchMovies();
     await fetchAndRenderBookings();
   }
   
   /* ----------------------------------------------------------
      FETCH MOVIES
      ---------------------------------------------------------- */
   async function fetchMovies() {
     try {
       const res = await fetch(`${API}/movies`);
       movies = await res.json();
       populateMovieDropdown();
     } catch (err) {
       console.error('Failed to load movies:', err);
     }
   }
   
   function populateMovieDropdown() {
     movieSelect.innerHTML = '<option value="">— Select a movie —</option>';
     movies.forEach(m => {
       const opt = document.createElement('option');
       opt.value = m.id;
       opt.textContent = m.title;
       movieSelect.appendChild(opt);
     });
   }
   
   /* ----------------------------------------------------------
      POSTER
      ---------------------------------------------------------- */
   function showPoster(url, alt) {
     moviePoster.classList.remove('loaded');
     moviePoster.classList.add('hidden');
     posterPlaceholder.style.display = 'none';
   
     moviePoster.onload = () => {
       moviePoster.classList.remove('hidden');
       // slight delay so the fade-in is visible
       requestAnimationFrame(() => moviePoster.classList.add('loaded'));
     };
     moviePoster.onerror = () => {
       moviePoster.classList.add('hidden');
       posterPlaceholder.style.display = '';
     };
     moviePoster.src = url;
     moviePoster.alt = alt;
   }
   
   function resetPoster() {
     moviePoster.classList.add('hidden');
     moviePoster.classList.remove('loaded');
     moviePoster.src = '';
     posterPlaceholder.style.display = '';
   }
   
   /* ----------------------------------------------------------
      MOVIE SELECTION
      ---------------------------------------------------------- */
   movieSelect.addEventListener('change', async () => {
     const id = parseInt(movieSelect.value);
     if (!id) {
       selectedMovie = null;
       selectedSeats = [];
       bookedSeats   = [];
       clearGrid();
       updateSummary();
       movieMeta.classList.add('hidden');
       resetPoster();
       return;
     }
   
     selectedMovie = movies.find(m => m.id === id);
     selectedSeats = [];
   
     movieGenre.textContent = selectedMovie.genre;
     moviePrice.textContent = `₹${selectedMovie.price} / seat`;
     movieMeta.classList.remove('hidden');
   
     if (selectedMovie.poster) {
       showPoster(selectedMovie.poster, selectedMovie.title);
     } else {
       resetPoster();
     }
   
     await loadBookedSeatsForMovie(id);
     renderGrid();
     updateSummary();
   });
   
   async function loadBookedSeatsForMovie(movieId) {
     try {
       const res = await fetch(`${API}/bookings`);
       const all = await res.json();
       bookedSeats = all
         .filter(b => b.movieId === movieId)
         .flatMap(b => b.bookedSeats);
     } catch {
       bookedSeats = [];
     }
   }
   
   /* ----------------------------------------------------------
      GRID
      ---------------------------------------------------------- */
   function renderGrid() {
     seatGrid.innerHTML = '';
     ROWS.forEach(row => {
       const rowEl = document.createElement('div');
       rowEl.className = 'seat-row';
   
       const label = document.createElement('span');
       label.className = 'row-label';
       label.textContent = row;
       rowEl.appendChild(label);
   
       const wrap = document.createElement('div');
       wrap.className = 'seats-in-row';
   
       COLS.forEach(col => {
         const seatId = `${row}${col}`;
         const seat = document.createElement('div');
         seat.className = 'seat';
         seat.dataset.seat = seatId;
         seat.textContent = col;
   
         if (bookedSeats.includes(seatId))   seat.classList.add('booked');
         else if (selectedSeats.includes(seatId)) seat.classList.add('selected');
   
         seat.addEventListener('click', () => toggleSeat(seatId, seat));
         wrap.appendChild(seat);
       });
   
       rowEl.appendChild(wrap);
       seatGrid.appendChild(rowEl);
     });
   }
   
   function clearGrid() { seatGrid.innerHTML = ''; }
   
   /* ----------------------------------------------------------
      SEAT TOGGLE
      ---------------------------------------------------------- */
   function toggleSeat(seatId, el) {
     if (!selectedMovie || bookedSeats.includes(seatId)) return;
     const idx = selectedSeats.indexOf(seatId);
     if (idx === -1) { selectedSeats.push(seatId); el.classList.add('selected'); }
     else            { selectedSeats.splice(idx, 1); el.classList.remove('selected'); }
     updateSummary();
   }
   
   /* ----------------------------------------------------------
      SUMMARY
      ---------------------------------------------------------- */
   function updateSummary() {
     summaryMovie.textContent = selectedMovie ? selectedMovie.title : '—';
   
     if (selectedSeats.length === 0) {
       summarySeats.innerHTML = '<span style="color:var(--text-muted)">—</span>';
     } else {
       summarySeats.innerHTML = selectedSeats
         .map(s => `<span class="seat-pill">${s}</span>`)
         .join('');
     }
   
     const total = selectedMovie ? selectedSeats.length * selectedMovie.price : 0;
     summaryTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
   
     validateForm();
   }
   
   /* ----------------------------------------------------------
      FORM VALIDATION
      ---------------------------------------------------------- */
   function validateForm() {
     confirmBtn.disabled = !(
       selectedMovie &&
       selectedSeats.length > 0 &&
       customerName.value.trim() &&
       customerPhone.value.trim()
     );
   }
   customerName.addEventListener('input', validateForm);
   customerPhone.addEventListener('input', validateForm);
   
   /* ----------------------------------------------------------
      CONFIRM BOOKING
      ---------------------------------------------------------- */
   confirmBtn.addEventListener('click', async () => {
     hideError();
     setLoading(true);
   
     const payload = {
       customerName:  customerName.value.trim(),
       customerPhone: customerPhone.value.trim(),
       movieId:       selectedMovie.id,
       bookedSeats:   [...selectedSeats],
       totalPrice:    selectedSeats.length * selectedMovie.price,
     };
   
     try {
       const res  = await fetch(`${API}/bookings`, {
         method:  'POST',
         headers: { 'Content-Type': 'application/json' },
         body:    JSON.stringify(payload),
       });
       const data = await res.json();
   
       if (!res.ok) { showError(data.error || 'Booking failed.'); setLoading(false); return; }
   
       alert(
         `🎉 Booking Confirmed!\n\n` +
         `ID: ${data.booking.bookingId}\n` +
         `Movie: ${data.booking.movieTitle}\n` +
         `Seats: ${data.booking.bookedSeats.join(', ')}\n` +
         `Total: ₹${data.booking.totalPrice.toLocaleString('en-IN')}`
       );
   
       customerName.value  = '';
       customerPhone.value = '';
       selectedSeats = [];
   
       await loadBookedSeatsForMovie(selectedMovie.id);
       renderGrid();
       updateSummary();
       await fetchAndRenderBookings();
   
     } catch {
       showError('Network error. Is the server running?');
     } finally {
       setLoading(false);
     }
   });
   
   /* ----------------------------------------------------------
      BOOKINGS LIST
      ---------------------------------------------------------- */
   async function fetchAndRenderBookings() {
     try {
       const res = await fetch(`${API}/bookings`);
       const all = await res.json();
       renderBookingsList(all);
     } catch {
       bookingsList.innerHTML = '<p class="empty-state">Could not load bookings.</p>';
     }
   }
   
   function renderBookingsList(bookings) {
     if (!bookings.length) {
       bookingsList.innerHTML = '<p class="empty-state">No bookings yet.</p>';
       return;
     }
     bookingsList.innerHTML = [...bookings].reverse().slice(0, 10).map(b => `
       <div class="booking-item">
         <div class="booking-item-id">${b.bookingId}</div>
         <div class="booking-item-title">${b.movieTitle}</div>
         <div class="booking-item-detail">
           👤 ${b.customerName} &nbsp;·&nbsp; 🪑 ${b.bookedSeats.join(', ')} &nbsp;·&nbsp; 💵 ₹${b.totalPrice.toLocaleString('en-IN')}
         </div>
       </div>
     `).join('');
   }
   
   refreshBtn.addEventListener('click', fetchAndRenderBookings);
   
   /* ----------------------------------------------------------
      HELPERS
      ---------------------------------------------------------- */
   function setLoading(on) {
     confirmBtn.disabled = on;
     btnText.classList.toggle('hidden', on);
     btnLoader.classList.toggle('hidden', !on);
   }
   function showError(msg) {
     formError.textContent = msg;
     formError.classList.remove('hidden');
   }
   function hideError() {
     formError.classList.add('hidden');
   }

   document.getElementById('clearBookingsBtn').addEventListener('click', async () => {
    if (!confirm('Clear ALL bookings? This cannot be undone.')) return;
    await fetch(`${API}/bookings`, { method: 'DELETE' });
    await fetchAndRenderBookings();
    // refresh grid if a movie is selected
    if (selectedMovie) {
      bookedSeats = [];
      selectedSeats = [];
      renderGrid();
      updateSummary();
    }
  });
   
   init();