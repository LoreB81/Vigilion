function createReport() {
  const typology = document.getElementById('tipologia').value;
  const notes = document.getElementById('note').value;
  const position = localStorage.getItem('position');

  const locationString = typeof position === 'string' ? position : JSON.stringify(position);

  fetch('http://localhost:8000/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user: localStorage.getItem('id'),
      typology: typology,
      notes: notes,
      location: locationString
    })
  })
  .then(function (res) {
    return res.json();
  })
  .then(function (res) {
    if (res.error) {
      throw new Error(res.error);
    }
    alert(res.message);
  })
  .catch((error) => {
    alert('Errore: ' + error);
  });

  localStorage.removeItem('position');
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
