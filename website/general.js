function registerUser() {
  const firstname = document.getElementById('nfield').value;
  const lastname = document.getElementById('surfield').value;
  const email = document.getElementById('emfield').value;
  const password = document.getElementById('pswfield').value;
  const confirmPassword = document.getElementById('rpswfield').value;
  const district = document.getElementById('district').value;

  if (!firstname || !lastname || !email || !password || !confirmPassword || !district) {
    alert('Per favore, compila tutti i campi');
    return;
  }

  if (password !== confirmPassword) {
    alert('Le password non coincidono');
    return;
  }

  fetch('/api/users', {
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
      district: district
    })
  })
  .then(response => {
    if (!response.ok) {
      // error returned
      return response.json().then(data => {
        throw new Error(data.error || 'Error during registration');
      });
    }

    return response.json();
  })
  .then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    
    // successfull registration, redirect to login page
    alert('Registrazione completata con successo!');
    window.location.href = 'login.html';
  })
  .catch(error => {
    console.error('Error during registration: ', error.message);
  });
}

function loginWithGoogle() {
  alert("Funzionalità non ancora implementata");
}

function login() {
  const email = document.getElementById('emfield').value;
  const password = document.getElementById('pswfield').value;

  fetch('/api/authentication', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ email: email, password: password })
  })
  .then(response => {
    if (!response.ok && response.status == 403) {
      alert("Il tuo utente è stato bloccato dagli amministratori");
    }

    if (!response.ok && response.status == 404) {
      alert("Credenziali inserite non valide");
    }
    
    if (!response.ok) {
      // invalid credentials
      return response.json().then(data => {
        throw new Error(data.error || 'Invalid credentials');
      });
    }
    return response.json();
  })
  .then(function (data) {
    if (data.success) {
      // successfull login, redirect to index page
      window.location.href = 'index.html';
    } else {
      throw new Error(data.message || 'Error on login');
    }
  })
  .catch(error => {
    console.error('Error on login: ' + error.message);
  });
}

function logout() {
  fetch('/api/authentication/logout', {
    method: 'POST',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = 'index.html';
    }
  })
  .catch(error => {
    console.error('Error on logout: ' + error);
  });
}

function checkAuth() {
  // store the current URL if we're not already on the login page
  if (!window.location.pathname.includes('login.html')) {
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
  }

  fetch('/api/authentication/check', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (!data.authenticated) {
      // clear any existing auth data
      sessionStorage.removeItem('isAuthenticated');
      window.location.replace('login.html');
    } else {
      // store authentication state
      sessionStorage.setItem('isAuthenticated', 'true');
    }
  })
  .catch(error => {
    console.error('Error on authentication check: ' + error);
    sessionStorage.removeItem('isAuthenticated');
    window.location.replace('login.html');
  });
}

function createReport() {
  const typology = document.getElementById('typology');
  const notes = document.getElementById('notes');
  
  // check if marker exists
  if (typeof marker === 'undefined' || !marker) {
    alert('Seleziona una posizione sulla mappa');
    return;
  }

  // check if all values needed are given
  if (typology.value == "" || notes.value == "" || typeof marker === 'undefined' || !marker) {
    alert("Mancano dei campi necessari");
    return;
  }
  
  // get marker position in JSON format (lat/lng)
  const position = [marker.getLatLng().lat, marker.getLatLng().lng];

  // get current date and time in yyyy-mm-dd HH:ii format
  const now = new Date();
  const createdtime = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

  fetch('/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      typology: typology.value,
      notes: notes.value,
      location: position,
      createdtime: createdtime
    })
  })
  .then(response => {
    if (!response.ok && response.status == 422) {
      alert("Impossibile trovare la circoscrizione di appartenenza delle coordinate inserite");
    }

    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Errore durante la creazione della segnalazione');
      });
    }
    return response.json();
  })
  .then(data => {
    alert("Grazie per la segnalazione!");
    notes.value = "";
    window.location.reload();
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

async function fetchLatestReports() {
  try {
    const response = await fetch('/api/reports/latest', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Error while retrieving reports');
    }
    
    const reports = await response.json();
    displayReportsOnMap(reports);
  } catch (error) {
    console.error('Error while retrieving reports:', error);
  }
}

function displayReportsOnMap(reports) {
  // checks if the map is initialized
  if (!window.map) return;
  
  // clear existing markers
  if (window.markers) {
    window.markers.forEach(marker => marker.remove());
  }
  window.markers = [];
  
  reports.forEach(report => {
    try {
      // parse the location string
      const location = JSON.parse(report.location);
      
      // create a marker for each report
      const reportMarker = L.marker([location[0], location[1]]).addTo(window.map);
      
      // create popup content with report details and vote buttons
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
      
      // bind popup to marker
      reportMarker.bindPopup(popupContent);
      
      // initialize vote buttons when popup opens
      reportMarker.on('popupopen', () => {
        initializeVoteButtons(report.id);
      });
      
      window.markers.push(reportMarker);
    } catch (error) {
      console.error('Error on report rendering:', error);
    }
  });
}

async function handleVote(reportId, voteType) {
  try {
    // sends the vote type
    const response = await fetch(`/api/reports/${reportId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ voteType })
    });

    if (!response.ok && response.status == 401) {
      alert("Per poter votare è necessario autenticarsi effettuando l'accesso");
    }
    
    if (!response.ok) {
      throw new Error('Failed to vote');
    }

    // update displayed vote
    const data = await response.json();
    updateVoteDisplay(reportId, data);
  } catch (error) {
    console.error('Error voting:', error);
  }
}

async function getUserVote(reportId) {
  try {
    // get the user vote for specific report
    const response = await fetch(`/api/reports/${reportId}/user-vote`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user vote');
    }

    // return vote type
    const data = await response.json();
    return data.voteType;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}

function updateVoteDisplay(reportId, data) {  
  const upvoteBtn = document.querySelector(`#upvote-${reportId}`);
  const downvoteBtn = document.querySelector(`#downvote-${reportId}`);
  const upvoteCount = document.querySelector(`#upvote-count-${reportId}`);
  const downvoteCount = document.querySelector(`#downvote-count-${reportId}`);

  if (upvoteBtn && downvoteBtn && upvoteCount && downvoteCount) {
    // update counts
    upvoteCount.textContent = data.upvotes;
    downvoteCount.textContent = data.downvotes;

    // update button styles
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
    console.error('Could not find vote elements for report:', reportId);
  }
}

function initializeVoteButtons(reportId) {
  const upvoteBtn = document.querySelector(`#upvote-${reportId}`);
  const downvoteBtn = document.querySelector(`#downvote-${reportId}`);

  if (upvoteBtn && downvoteBtn) {
    // sets event listener for upvote and downvote
    upvoteBtn.addEventListener('click', () => handleVote(reportId, 'upvote'));
    downvoteBtn.addEventListener('click', () => handleVote(reportId, 'downvote'));

    // get initial user vote state
    getUserVote(reportId).then(voteType => {
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
  }
}

async function updateUserGreeting() {
  const greetingElement = document.getElementById('userGreeting');
  if (!greetingElement) return;

  try {
    const response = await fetch('/api/authentication/check', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Authentication check failed');
    }
    
    const data = await response.json();

    if (data.authenticated && data.user && data.user.id) {
      // get user data to display name
      const userResponse = await fetch(`/api/users/${data.user.id}`, {
        credentials: 'include'
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      
      if (userData && userData.firstname) {
        greetingElement.innerHTML = `Ciao, ${userData.firstname}`;
      } else {
        throw new Error('User data incomplete');
      }
    } else {
      greetingElement.innerHTML = 'Ciao, <a href="login.html" class="text-blue-600 hover:text-blue-800">clicca qui</a> per accedere';
    }
  } catch (error) {
    console.error('Error on authentication check:', error);
    greetingElement.innerHTML = 'Ciao, <a href="login.html" class="text-blue-600 hover:text-blue-800">clicca qui</a> per accedere';
  }
}

async function changePassword(oldPassword, newPassword, confirmPassword) {
  // validate inputs
  if (!oldPassword || !newPassword || !confirmPassword) {
    alert('Per favore, compila tutti i campi');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Le nuove password non coincidono');
    return;
  }

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        oldPassword: oldPassword,
        newPassword: newPassword
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error on password change');
    }

    const data = await response.json();
    if (data.success) {
      // redirect to index page
      alert('Password modificata con successo!');
      window.location.href = 'index.html';
    } else {
      throw new Error(data.error || 'Error on password change');
    }
  } catch (error) {
    console.error('Error on password change:', error);
    alert(error.message);
  }
}

async function changeDistrict() {
  const district = document.getElementById('district').value;

  if (!district) {
    alert('Per favore, seleziona una circoscrizione');
    return;
  }

  try {
    const response = await fetch('/api/users/change-district', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        district: district
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error on district change');
    }

    const data = await response.json();
    if (data.success) {
      // redirect to index page
      alert('Circoscrizione modificata con successo!');
      window.location.href = 'index.html';
    } else {
      throw new Error(data.error || 'Error on district change');
    }
  } catch (error) {
    console.error('Error on district change:', error);
    alert(error.message);
  }
}

async function changeEmail(oldEmail, newEmail) {
  // validate inputs
  if (!oldEmail || !newEmail) {
    alert('Per favore, compila tutti i campi');
    return;
  }

  try {
    const response = await fetch('/api/users/change-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        oldEmail: oldEmail,
        newEmail: newEmail
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error on email change');
    }

    const data = await response.json();
    if (data.success) {
      // redirect to index page
      alert('Email modificata con successo!');
      window.location.href = 'index.html';
    } else {
      throw new Error(data.error || 'Error on email change');
    }
  } catch (error) {
    console.error('Error on email change:', error);
    alert(error.message);
  }
}

function callNumber() {
  alert('Funzionalità non ancora implementata');
}

async function checkAdminAuth() {
  try {
    const response = await fetch('/api/authentication/check', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Authentication check failed');
    }
    
    const data = await response.json();

    if (!data.authenticated || !data.user || !data.user.id) {
      // not authenticated, redirect to login page
      window.location.replace('login.html');
      return false;
    }

    // checks if the user is admin
    const userResponse = await fetch(`/api/users/${data.user.id}`, {
      credentials: 'include'
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await userResponse.json();
    
    if (!userData.admin) {
      // if the user isn't an admin, redirect to the precedent page
      const referrer = document.referrer;
      if (referrer && !referrer.includes('controlpanel.html') && !referrer.includes('useractions.html')) {
        window.location.replace(referrer);
      } else {
        window.location.replace('index.html');
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error on admin authentication check:', error);
    window.location.replace('index.html');
    return false;
  }
}
