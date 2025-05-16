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

async function fetchLatestReports() {
  try {
    const response = await fetch('http://localhost:8000/api/reports/latest', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Errore nel recupero delle segnalazioni');
    }
    
    const reports = await response.json();
    displayReportsOnMap(reports);
  } catch (error) {
    console.error('Errore nel recupero delle segnalazioni:', error);
  }
}

function displayReportsOnMap(reports) {
  // Ensure the map is initialized
  if (!window.map) return;
  
  // Clear existing markers
  if (window.markers) {
    window.markers.forEach(marker => marker.remove());
  }
  window.markers = [];
  
  reports.forEach(report => {
    try {
      // Parse the location string (stored as JSON string in the database)
      const location = JSON.parse(report.location);
      
      // Create a marker for each report
      const reportMarker = L.marker([location[0], location[1]]).addTo(window.map);
      
      // Create popup content with report details and vote buttons
      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-lg mb-2">${report.typology}</h3>
          <p class="text-gray-700 mb-2">${report.notes}</p>
          <p class="text-sm text-gray-600 mb-2">Data: ${report.createdtime}</p>
          <div class="flex items-center space-x-4">
            <button id="upvote-${report.id}" class="flex items-center space-x-1">
              <span class="text-2xl">👍</span>
              <span id="upvote-count-${report.id}">${report.upvote}</span>
            </button>
            <button id="downvote-${report.id}" class="flex items-center space-x-1">
              <span class="text-2xl">👎</span>
              <span id="downvote-count-${report.id}">${report.downvote}</span>
            </button>
          </div>
        </div>
      `;
      
      // Bind popup to marker
      reportMarker.bindPopup(popupContent);
      
      // Initialize vote buttons when popup opens
      reportMarker.on('popupopen', () => {
        initializeVoteButtons(report.id);
      });
      
      window.markers.push(reportMarker);
    } catch (error) {
      console.error('Errore nella visualizzazione della segnalazione:', error);
    }
  });
}

async function handleVote(reportId, voteType) {
  try {
    const response = await fetch(`http://localhost:8000/api/reports/${reportId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ voteType })
    });

    if (!response.ok) {
      throw new Error('Failed to vote');
    }

    const data = await response.json();
    console.log('Vote response:', data); // Debug log
    updateVoteDisplay(reportId, data);
  } catch (error) {
    console.error('Error voting:', error);
  }
}

async function getUserVote(reportId) {
  try {
    const response = await fetch(`http://localhost:8000/api/reports/${reportId}/user-vote`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user vote');
    }

    const data = await response.json();
    return data.voteType;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}

function updateVoteDisplay(reportId, data) {
  console.log('Updating vote display for report:', reportId, 'with data:', data); // Debug log
  
  const upvoteBtn = document.querySelector(`#upvote-${reportId}`);
  const downvoteBtn = document.querySelector(`#downvote-${reportId}`);
  const upvoteCount = document.querySelector(`#upvote-count-${reportId}`);
  const downvoteCount = document.querySelector(`#downvote-count-${reportId}`);

  if (upvoteBtn && downvoteBtn && upvoteCount && downvoteCount) {
    // Update counts
    upvoteCount.textContent = data.upvotes;
    downvoteCount.textContent = data.downvotes;

    // Update button styles
    upvoteBtn.classList.remove('text-blue-500', 'text-gray-400');
    downvoteBtn.classList.remove('text-red-500', 'text-gray-400');

    if (data.userVote === 'upvote') {
      upvoteBtn.classList.add('text-blue-500');
      downvoteBtn.classList.add('text-gray-400');
    } else if (data.userVote === 'downvote') {
      upvoteBtn.classList.add('text-gray-400');
      downvoteBtn.classList.add('text-red-500');
    } else {
      upvoteBtn.classList.add('text-gray-400');
      downvoteBtn.classList.add('text-gray-400');
    }
  } else {
    console.error('Could not find vote elements for report:', reportId); // Debug log
  }
}

// Function to initialize vote buttons for a report
function initializeVoteButtons(reportId) {
  console.log('Initializing vote buttons for report:', reportId); // Debug log
  
  const upvoteBtn = document.querySelector(`#upvote-${reportId}`);
  const downvoteBtn = document.querySelector(`#downvote-${reportId}`);

  if (upvoteBtn && downvoteBtn) {
    upvoteBtn.addEventListener('click', () => handleVote(reportId, 'upvote'));
    downvoteBtn.addEventListener('click', () => handleVote(reportId, 'downvote'));

    // Get initial user vote state
    getUserVote(reportId).then(voteType => {
      console.log('Initial vote type for report:', reportId, 'is:', voteType); // Debug log
      
      if (voteType === 'upvote') {
        upvoteBtn.classList.add('text-blue-500');
        downvoteBtn.classList.add('text-gray-400');
      } else if (voteType === 'downvote') {
        upvoteBtn.classList.add('text-gray-400');
        downvoteBtn.classList.add('text-red-500');
      } else {
        upvoteBtn.classList.add('text-gray-400');
        downvoteBtn.classList.add('text-gray-400');
      }
    });
  } else {
    console.error('Could not find vote buttons for report:', reportId); // Debug log
  }
}
