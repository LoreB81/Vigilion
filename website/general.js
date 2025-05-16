function createReport() {
  const typology = document.getElementById('tipologia').value;
  const notes = document.getElementById('note').value;
  
  // Check if marker exists
  if (typeof marker === 'undefined' || !marker) {
    alert('Seleziona una posizione sulla mappa');
    return;
  }
  
  const position = [marker.getLatLng().lat, marker.getLatLng().lng];
  const locationString = JSON.stringify(position);

  // Get current date and time in yyyy-mm-dd HH:ii format
  const now = new Date();
  const createdtime = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

  fetch('http://localhost:8000/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      typology: typology,
      notes: notes,
      location: locationString,
      createdtime: createdtime
    })
  })
  .then(function (res) {
    alert("Grazie per la segnalazione!");

    setInterval(() => {
      location.reload();
    }, 1000);
  })
  .then(function (res) {
    if (res.error) {
      throw new Error(res.error);
    }
  })
  .catch((error) => {
    console.err(error);
  });
}

function registerUser() {
  const firstname = document.getElementById('nfield').value;
  const lastname = document.getElementById('surfield').value;
  const email = document.getElementById('emfield').value;
  const password = document.getElementById('pswfield').value;
  const confirmPassword = document.getElementById('rpswfield').value;
  const circoscrizione = document.getElementById('cirfield').value;

  if (!firstname || !lastname || !email || !password || !confirmPassword || !circoscrizione) {
    alert('Per favore, compila tutti i campi');
    return;
  }

  if (password !== confirmPassword) {
    alert('Le password non coincidono');
    return;
  }

  fetch('http://localhost:8000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password,
      circoscrizione: circoscrizione
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Errore durante la registrazione');
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    alert('Registrazione completata con successo!');
    window.location.href = 'login.html';
  })
  .catch(error => {
    console.error('Errore durante la registrazione: ' + error.message);
    alert('Errore durante la registrazione: ' + error.message);
  });
}

function login() {
  const email = document.getElementById('emfield').value;
  const password = document.getElementById('pswfield').value;

  fetch('http://localhost:8000/api/authentication', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ email: email, password: password })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Credenziali non valide');
      });
    }
    return response.json();
  })
  .then(function (data) {
    if (data.success) {
      window.location.href = 'index.html';
    } else {
      throw new Error(data.message || 'Errore durante il login');
    }
  })
  .catch(error => {
    console.error('Errore durante l\'autenticazione: ' + error.message);
  });
}

function logout() {
  fetch('http://localhost:8000/api/authentication/logout', {
    method: 'POST',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = 'login.html';
    }
  })
  .catch(error => {
    console.error('Errore durante il logout: ' + error);
  });
}

function checkAuth() {
  fetch('http://localhost:8000/api/authentication/check', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (!data.authenticated) {
      window.location.href = 'login.html';
    }
  })
  .catch(error => {
    console.error('Errore durante il controllo dell\'autenticazione: ' + error);
    window.location.href = 'login.html';
  });
}

function fetchLatestReports() {
  fetch('http://localhost:8000/api/reports/latest', {
    method: 'GET',
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Errore nel recupero delle segnalazioni');
    }
    return response.json();
  })
  .then(reports => {
    displayReportsOnMap(reports);
  })
  .catch(error => {
    console.error('Errore nel recupero delle segnalazioni:', error);
  });
}

function displayReportsOnMap(reports) {
  // Ensure the map is initialized
  if (!window.map) return;
  
  reports.forEach(report => {
    try {
      // Parse the location string (stored as JSON string in the database)
      const location = JSON.parse(report.location);
      
      // Create a marker for each report
      const reportMarker = L.marker([location[0], location[1]]).addTo(window.map);
      
      // Create popup content with report details
      const popupContent = `
        <div>
          <h3 class="font-bold">${report.typology}</h3>
          <p>${report.notes}</p>
          <p class="text-sm text-gray-600">Data: ${report.createdtime}</p>
          <p class="text-sm text-gray-600">Voti: 👍 ${report.upvote} | 👎 ${report.downvote}</p>
        </div>
      `;
      
      // Bind popup to marker
      reportMarker.bindPopup(popupContent);
    } catch (error) {
      console.error('Errore nella visualizzazione della segnalazione:', error);
    }
  });
}
