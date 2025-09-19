(() => {
  // Selectores
  const contactForm = document.getElementById('contactForm');
  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const address = document.getElementById('address');
  const addBtn = document.getElementById('addBtn');
  const resetBtn = document.getElementById('resetBtn');
  const contactsTbody = document.getElementById('contactsTbody');
  const totalCount = document.getElementById('totalCount');
  const formAlert = document.getElementById('formAlert');
  const searchInput = document.getElementById('searchInput');
  const clearAll = document.getElementById('clearAll');

  const STORAGE_KEY = 'agenda_contacts_v1';

  // Estado
  let contacts = [];
  let editId = null;

  // Inicializar
  function init() {
    loadFromStorage();
    render();
    setupEvents();
  }

  // Cargar desde localStorage
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      contacts = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error leyendo storage', e);
      contacts = [];
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }

  // Validaciones 
  function validateForm() {
    // HTML5 constraint validation ayuda, pero hacemos checks extras
    if (!firstName.value.trim()) return { ok: false, msg: 'Nombre requerido.' };
    if (!lastName.value.trim()) return { ok: false, msg: 'Apellido requerido.' };
    const phoneVal = phone.value.trim();
    if (!/^[\d\s()+-]{6,20}$/.test(phoneVal)) return { ok: false, msg: 'Teléfono inválido.' };
    const emailVal = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return { ok: false, msg: 'Correo electrónico inválido.' };
    if (!address.value.trim()) return { ok: false, msg: 'Dirección requerida.' };
    return { ok: true };
  }

  // Render de la tabla
  function render(filter = '') {
    contactsTbody.innerHTML = '';
    const q = filter.toLowerCase().trim();
    const rows = contacts
      .filter(c => {
        if (!q) return true;
        return (
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      })
      .map(contactRow);

    if (rows.length === 0) {
      contactsTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay contactos</td></tr>`;
    } else {
      contactsTbody.append(...rows);
    }

    totalCount.textContent = contacts.length;
  }

  // Crear fila DOM
  function contactRow(c) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(c.firstName)}</td>
      <td>${escapeHtml(c.lastName)}</td>
      <td>${escapeHtml(c.phone)}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.address)}</td>
      <td class="text-center">
        <div class="action-btns">
          <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${c.id}" title="Editar">Editar</button>
          <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${c.id}" title="Eliminar">Eliminar</button>
        </div>
      </td>
    `;
    return tr;
  }

  // Escapar para evitar inyección en la tabla
  function escapeHtml(s = '') {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Agregar nuevo contacto
  function addContact(data) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    contacts.push({ id, ...data });
    saveToStorage();
    render(searchInput.value);
    showFormMessage('Contacto agregado', 'success');
    contactForm.reset();
  }

  // Actualizar contacto
  function updateContact(id, data) {
    const idx = contacts.findIndex(c => c.id === id);
    if (idx === -1) return showFormMessage('Contacto no encontrado', 'danger');
    contacts[idx] = { id, ...data };
    saveToStorage();
    render(searchInput.value);
    showFormMessage('Contacto actualizado', 'success');
    editId = null;
    addBtn.textContent = 'Agregar contacto';
  }

  // Eliminar contacto
  function deleteContact(id) {
    if (!confirm('¿Eliminar este contacto?')) return;
    contacts = contacts.filter(c => c.id !== id);
    saveToStorage();
    render(searchInput.value);
    showFormMessage('Contacto eliminado', 'warning');
  }

  // Evento clicks en la tabla (delegation)
  function tableClickHandler(e) {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn = e.target.closest('.btn-delete');
    if (editBtn) {
      const id = editBtn.dataset.id;
      startEdit(id);
      return;
    }
    if (delBtn) {
      const id = delBtn.dataset.id;
      deleteContact(id);
      return;
    }
  }

  // Rellenar formulario para editar
  function startEdit(id) {
    const c = contacts.find(x => x.id === id);
    if (!c) return showFormMessage('Contacto no encontrado', 'danger');
    firstName.value = c.firstName;
    lastName.value = c.lastName;
    phone.value = c.phone;
    email.value = c.email;
    address.value = c.address;
    editId = id;
    addBtn.textContent = 'Guardar cambios';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showFormMessage(msg, type = 'info') {
    formAlert.innerHTML = `<div class="alert alert-${type} p-1 m-0">${msg}</div>`;
    setTimeout(() => { formAlert.innerHTML = ''; }, 2500);
  }

  function onSubmit(e) {
    e.preventDefault();
    const valid = validateForm();
    if (!valid.ok) {
      showFormMessage(valid.msg, 'danger');
      return;
    }
    const data = {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      phone: phone.value.trim(),
      email: email.value.trim(),
      address: address.value.trim()
    };
    if (editId) {
      updateContact(editId, data);
    } else {
      addContact(data);
    }
  }

  // Limpiar form
  function onReset() {
    contactForm.reset();
    editId = null;
    addBtn.textContent = 'Agregar contacto';
  }

  // Buscar
  function onSearch() {
    render(searchInput.value);
  }

  // Borrar todo
  function onClearAll() {
    if (!contacts.length) return showFormMessage('No hay contactos para eliminar', 'info');
    if (!confirm('¿Eliminar todos los contactos?')) return;
    contacts = [];
    saveToStorage();
    render();
    showFormMessage('Todos los contactos eliminados', 'warning');
  }

  function setupEvents() {
    contactForm.addEventListener('submit', onSubmit);
    resetBtn.addEventListener('click', onReset);
    contactsTbody.addEventListener('click', tableClickHandler);
    searchInput.addEventListener('input', onSearch);
    clearAll.addEventListener('click', onClearAll);
  }

  init();
})();
