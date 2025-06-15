/** this file is used to dinamically load the options for various selects, such as report typologies and districts */

$(document).ready(function() {
  // load typologies
  let typologySelect = document.getElementById('typology');
  let typologies = ["Furto", "Aggressione", "Molestia", "Soggetto armato", "Soggetto alterato", "Altro"];

  if (typologySelect) {
    typologies.forEach(element => {
      typologySelect.innerHTML += `<option value="${element}">${element}</option>`;
    });
  }

  // load districts
  let districtSelect = document.getElementById('district');
  let districts = ["Gardolo", "Meano", "Bondone", "Sardagna", "Ravina-Romagnano", "Argentario", "Povo", "Mattarello",
    "Villazzano", "Oltrefersina", "San Giuseppe-Santa Chiara", "Centro Storico-Piedicastello"];
  
  if (districtSelect) {
    districts.forEach(element => {
      districtSelect.innerHTML += `<option value="${element}">${element}</option>`;
    });
  }
});