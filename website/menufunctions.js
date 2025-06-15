document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.getElementById("menu-toggle");
  const menuContainer = document.getElementById("menu-container");
  let menuLoaded = false;

  menuButton.addEventListener("click", function (e) {
    e.stopPropagation();

    if (!menuLoaded) {
      fetch("menu.html")
      .then(response => {
          if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(html => {
          menuContainer.innerHTML = html;
          menuLoaded = true;
          updateUserGreeting();
          showMenu();
        })
        .catch(error => {
          console.error("Errore nel caricamento del menu:", error);
        });
    } else {
      if (menuContainer.classList.contains('open')) {
        hideMenu();
      } else {
        showMenu();
      }
    }
  });

  document.addEventListener("click", function (e) {
    if (!menuContainer.contains(e.target) && !menuButton.contains(e.target)) {
      hideMenu();
    }
  });

  function showMenu() {
    menuContainer.style.display = 'block';
    menuContainer.classList.add('open');
  }

  function hideMenu() {
    menuContainer.classList.remove('open');
    if (!menuContainer.classList.contains('open')) {
      menuContainer.style.display = 'none';
      menuContainer.innerHTML = '';
    }

    menuLoaded = false;
  }
});