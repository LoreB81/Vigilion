let users = [];

async function fetchUsers() {
  const res = await fetch('/api/users', { credentials: 'include' });
  const allUsers = await res.json();

  // filters out admin users
  users = allUsers.filter(user => !user.admin);
  displayUserList(users);
}

function displayUserList(filteredUsers) {
  const list = document.getElementById('userList');
  list.innerHTML = '';
  filteredUsers.forEach(user => {
    // create the div to contain user's data
    const div = document.createElement('div');
    div.className = 'flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 shadow-sm cursor-pointer hover:bg-green-50 transition';

    let statusIcon = '';
    if (user.blocked) {
      statusIcon = '<span title="Bannato" class="ml-2 text-2xl align-middle">🚫</span>';
    } else if (user.warned) {
      statusIcon = '<span title="Ammonito" class="ml-2 text-2xl align-middle">⚠️</span>';
    }

    div.innerHTML = `
      <span class="material-icons text-3xl text-gray-400 mr-3">account_circle</span>
      <div class="flex flex-col">
        <div class="flex items-center font-semibold text-base text-gray-800">
          ${user.firstname} ${user.lastname} ${statusIcon}
        </div>
        <div class="text-xs text-gray-400">${user.id}</div>
      </div>
    `;
    div.onclick = () => {
      // redirect to useractions.html with the user ID as query parameter
      window.location.href = `useractions.html?userId=${user.id}`;
    };
    list.appendChild(div);
  });
}

window.onload = async () => {
  await fetchUsers();
}; 