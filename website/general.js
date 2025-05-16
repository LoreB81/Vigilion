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

  fetch('http://localhost:8000/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      typology: typology,
      notes: notes,
      location: locationString
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
    alert('Errore: ' + error);
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
