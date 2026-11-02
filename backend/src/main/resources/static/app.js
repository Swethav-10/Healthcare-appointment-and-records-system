const API = '/api';
const state = { view: 'dashboard', doctors: [], patients: [], appointments: [], q: '' };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n || '?').replace(/^dr\.?\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const fmt = t => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

const ICONS = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  doctor: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 4-6 8-6s8 2 8 6',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  x: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M15 9l-6 6 M9 9l6 6',
  check: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M8 12l3 3 5-6'
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[n]}"/></svg>`;

async function api(path, method = 'GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let msg = 'Request failed (' + res.status + ')';
    try {
      const j = await res.json();
      if (j.errors && j.errors.length) msg = j.errors.map(e => (e.field ? e.field + ': ' : '') + e.defaultMessage).join(', ');
      else if (j.message) msg = j.message;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

function toast(msg, type) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' error' : '');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = 'toast'), 3200);
}

function setStatus(ok) {
  $('#apiDot').className = 'dot ' + (ok ? 'on' : 'off');
  $('#apiText').textContent = ok ? 'API connected' : 'API offline';
}

async function loadAll() {
  try {
    const [d, p, a] = await Promise.all([api('/doctors'), api('/patients'), api('/appointments')]);
    state.doctors = d; state.patients = p; state.appointments = a;
    setStatus(true);
  } catch (e) {
    setStatus(false);
  }
  render();
}

const match = o => !state.q || JSON.stringify(o).toLowerCase().includes(state.q);
const empty = (t, s, btn) => `<div class="card empty"><h3>${t}</h3><p class="muted">${s}</p>${btn || ''}</div>`;

/* ---------- Views ---------- */
function renderDashboard() {
  if (!state.doctors.length && !state.patients.length) {
    return empty('Welcome to MediCare', 'Your clinic is empty. Load sample data to explore, or add a doctor to begin.',
      '<button class="btn primary" data-act="seed">Load demo data</button>');
  }
  const now = new Date();
  const booked = state.appointments.filter(a => a.status === 'BOOKED');
  const cancelled = state.appointments.filter(a => a.status === 'CANCELLED');
  const upcoming = booked.filter(a => new Date(a.appointmentTime) >= now)
    .sort((x, y) => new Date(x.appointmentTime) - new Date(y.appointmentTime)).slice(0, 5);
  const load = state.doctors.map(d => ({ name: d.name, n: booked.filter(a => a.doctor && a.doctor.id === d.id).length }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...load.map(l => l.n));

  const stat = (cls, ic, n, label) => `<div class="card stat"><div class="bubble ${cls}">${icon(ic)}</div><div><b>${n}</b><span>${label}</span></div></div>`;
  return `
    <div class="stats">
      ${stat('b1', 'doctor', state.doctors.length, 'Doctors')}
      ${stat('b2', 'heart', state.patients.length, 'Patients')}
      ${stat('b3', 'calendar', booked.length, 'Booked')}
      ${stat('b4', 'x', cancelled.length, 'Cancelled')}
    </div>
    <div class="two">
      <div class="card"><h3>Upcoming appointments</h3>
        ${upcoming.length ? upcoming.map(a => {
          const d = new Date(a.appointmentTime);
          return `<div class="item">
            <div class="when"><b>${d.getDate()}</b><span>${d.toLocaleString([], { month: 'short' })}</span></div>
            <div class="grow"><b>${esc(a.patient.name)}</b><span class="muted">with ${esc(a.doctor.name)} &middot; ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            <span class="chip">${esc(a.reason || 'Visit')}</span></div>`;
        }).join('') : '<p class="muted">No upcoming appointments.</p>'}
      </div>
      <div class="card"><h3>Workload by doctor</h3>
        ${load.length ? load.map(l => `<div class="bar"><div class="lbl"><span>${esc(l.name)}</span><b>${l.n}</b></div><div class="track"><div class="fill" style="width:${(l.n / max) * 100}%"></div></div></div>`).join('') : '<p class="muted">No doctors yet.</p>'}
      </div>
    </div>`;
}

function renderDoctors() {
  const list = state.doctors.filter(match);
  if (!list.length) return empty('No doctors found', 'Add a doctor to get started.', '<button class="btn primary" data-act="add">+ Add doctor</button>');
  return '<div class="grid">' + list.map(d => {
    const n = state.appointments.filter(a => a.doctor && a.doctor.id === d.id && a.status === 'BOOKED').length;
    return `<article class="card doc">
      <div class="avatar">${esc(initials(d.name))}</div>
      <h3 style="margin:0">${esc(d.name)}</h3>
      <span class="chip">${esc(d.specialization)}</span>
      <p class="muted">${esc(d.email)}</p>
      <div class="row between"><span class="muted">${n} booked</span>
        <div class="btns"><button class="icon-btn" data-act="edit-doctor" data-id="${d.id}">Edit</button><button class="icon-btn danger" data-act="del-doctor" data-id="${d.id}">Delete</button></div>
      </div></article>`;
  }).join('') + '</div>';
}

function renderPatients() {
  const list = state.patients.filter(match);
  if (!list.length) return empty('No patients found', 'Add a patient to get started.', '<button class="btn primary" data-act="add">+ Add patient</button>');
  return `<div class="card table-wrap"><table><thead><tr><th>Patient</th><th>Email</th><th>Phone</th><th>Age</th><th></th></tr></thead><tbody>` +
    list.map(p => `<tr>
      <td><div class="who"><div class="avatar">${esc(initials(p.name))}</div><b>${esc(p.name)}</b></div></td>
      <td>${esc(p.email)}</td><td>${esc(p.phone)}</td><td>${esc(p.age)}</td>
      <td><div class="btns"><button class="icon-btn" data-act="edit-patient" data-id="${p.id}">Edit</button><button class="icon-btn danger" data-act="del-patient" data-id="${p.id}">Delete</button></div></td>
    </tr>`).join('') + '</tbody></table></div>';
}

function renderAppointments() {
  const list = state.appointments.filter(match).sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime));
  if (!list.length) return empty('No appointments found', 'Book the first appointment.', '<button class="btn primary" data-act="add">+ Book appointment</button>');
  return `<div class="card table-wrap"><table><thead><tr><th>Patient</th><th>Doctor</th><th>When</th><th>Reason</th><th>Status</th><th></th></tr></thead><tbody>` +
    list.map(a => `<tr>
      <td><div class="who"><div class="avatar">${esc(initials(a.patient.name))}</div><b>${esc(a.patient.name)}</b></div></td>
      <td>${esc(a.doctor.name)}<br><span class="muted">${esc(a.doctor.specialization)}</span></td>
      <td>${esc(fmt(a.appointmentTime))}</td>
      <td>${esc(a.reason || '-')}</td>
      <td><span class="badge ${esc(a.status)}">${esc(a.status)}</span></td>
      <td><div class="btns">
        ${a.status === 'BOOKED' ? `<button class="icon-btn" data-act="cancel-appt" data-id="${a.id}">Cancel</button>` : ''}
        <button class="icon-btn danger" data-act="del-appt" data-id="${a.id}">Delete</button></div></td>
    </tr>`).join('') + '</tbody></table></div>';
}

const VIEWS = {
  dashboard: { title: 'Dashboard', sub: 'Overview of your clinic', add: 'Book appointment', draw: renderDashboard, open: () => openAppointmentForm() },
  appointments: { title: 'Appointments', sub: 'Book, track and cancel visits', add: 'Book appointment', draw: renderAppointments, open: () => openAppointmentForm() },
  doctors: { title: 'Doctors', sub: 'Your medical team', add: 'Add doctor', draw: renderDoctors, open: () => openDoctorForm() },
  patients: { title: 'Patients', sub: 'Registered patients', add: 'Add patient', draw: renderPatients, open: () => openPatientForm() }
};

function render() {
  const v = VIEWS[state.view];
  $('#title').textContent = v.title;
  $('#subtitle').textContent = v.sub;
  $('#addBtn').textContent = '+ ' + v.add;
  $('#view').innerHTML = v.draw();
}

/* ---------- Modal + forms ---------- */
function closeModal() { $('#modal').classList.add('hidden'); }

function openForm({ title, fields, values = {}, onSubmit }) {
  $('#mTitle').textContent = title;
  $('#mForm').innerHTML = fields.map(f => {
    const v = values[f.name] ?? '';
    let input;
    if (f.type === 'select') {
      input = `<select name="${f.name}" required>${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea name="${f.name}" rows="3">${esc(v)}</textarea>`;
    } else {
      input = `<input name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" ${f.required === false ? '' : 'required'} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.list ? `list="${f.list}"` : ''}>`;
    }
    return `<label class="field"><span>${esc(f.label)}</span>${input}</label>`;
  }).join('') +
    `<datalist id="specs"><option>Cardiology</option><option>Neurology</option><option>Pediatrics</option><option>Dermatology</option><option>Orthopedics</option><option>General Medicine</option><option>Gynecology</option><option>ENT</option></datalist>
     <div class="form-foot"><button type="button" class="btn ghost" id="mCancel">Cancel</button><button type="submit" class="btn primary">Save</button></div>`;
  $('#mCancel').onclick = closeModal;
  $('#mForm').onsubmit = async ev => {
    ev.preventDefault();
    const btn = ev.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await onSubmit(Object.fromEntries(new FormData(ev.target)));
      closeModal();
      await loadAll();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  };
  $('#modal').classList.remove('hidden');
  const first = $('#mForm').querySelector('input,select,textarea');
  if (first) first.focus();
}

function openDoctorForm(d) {
  openForm({
    title: d ? 'Edit doctor' : 'Add doctor',
    values: d || {},
    fields: [
      { name: 'name', label: 'Full name' },
      { name: 'specialization', label: 'Specialization', list: 'specs' },
      { name: 'email', label: 'Email', type: 'email' }
    ],
    onSubmit: v => d ? api('/doctors/' + d.id, 'PUT', v) : api('/doctors', 'POST', v)
  });
}

function openPatientForm(p) {
  openForm({
    title: p ? 'Edit patient' : 'Add patient',
    values: p || {},
    fields: [
      { name: 'name', label: 'Full name' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
      { name: 'age', label: 'Age', type: 'number', min: 0 }
    ],
    onSubmit: v => {
      v.age = Number(v.age);
      return p ? api('/patients/' + p.id, 'PUT', v) : api('/patients', 'POST', v);
    }
  });
}

function openAppointmentForm() {
  if (!state.doctors.length || !state.patients.length) {
    toast('Add at least one doctor and one patient first', 'error');
    return;
  }
  const min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  openForm({
    title: 'Book appointment',
    fields: [
      { name: 'doctorId', label: 'Doctor', type: 'select', options: state.doctors.map(d => ({ value: d.id, label: d.name + ' - ' + d.specialization })) },
      { name: 'patientId', label: 'Patient', type: 'select', options: state.patients.map(p => ({ value: p.id, label: p.name })) },
      { name: 'appointmentTime', label: 'Date and time', type: 'datetime-local', min },
      { name: 'reason', label: 'Reason', type: 'textarea' }
    ],
    onSubmit: v => api('/appointments', 'POST', {
      doctorId: Number(v.doctorId),
      patientId: Number(v.patientId),
      appointmentTime: v.appointmentTime.length === 16 ? v.appointmentTime + ':00' : v.appointmentTime,
      reason: v.reason
    })
  });
}

/* ---------- Demo data ---------- */
async function seedDemo() {
  const docs = [['Dr. Anita Rao', 'Cardiology', 'anita.rao@clinic.com'], ['Dr. Vikram Shah', 'Neurology', 'vikram.shah@clinic.com'], ['Dr. Meera Iyer', 'Pediatrics', 'meera.iyer@clinic.com']];
  const pats = [['Swetha V', 'swetha@mail.com', '9876543210', 22], ['Arjun Kumar', 'arjun@mail.com', '9123456780', 34], ['Priya Nair', 'priya@mail.com', '9988776655', 8]];
  const D = [], P = [];
  for (const [name, specialization, email] of docs) D.push(await api('/doctors', 'POST', { name, specialization, email }));
  for (const [name, email, phone, age] of pats) P.push(await api('/patients', 'POST', { name, email, phone, age }));
  const z = n => String(n).padStart(2, '0');
  const slot = (days, h) => {
    const t = new Date(); t.setDate(t.getDate() + days); t.setHours(h, 0, 0, 0);
    return `${t.getFullYear()}-${z(t.getMonth() + 1)}-${z(t.getDate())}T${z(t.getHours())}:00:00`;
  };
  const appts = [[0, 0, 1, 10, 'Heart checkup'], [1, 1, 2, 11, 'Migraine follow-up'], [2, 2, 1, 15, 'Vaccination'], [0, 1, 3, 9, 'ECG review']];
  for (const [d, p, days, h, reason] of appts) {
    await api('/appointments', 'POST', { doctorId: D[d].id, patientId: P[p].id, appointmentTime: slot(days, h), reason });
  }
}

/* ---------- Events ---------- */
$('#view').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const id = Number(b.dataset.id);
  const act = b.dataset.act;
  try {
    if (act === 'add') return VIEWS[state.view].open();
    if (act === 'edit-doctor') return openDoctorForm(state.doctors.find(d => d.id === id));
    if (act === 'edit-patient') return openPatientForm(state.patients.find(p => p.id === id));
    if (act === 'seed') { b.disabled = true; await seedDemo(); toast('Demo data loaded'); return loadAll(); }
    if (act === 'cancel-appt') { await api(`/appointments/${id}/cancel`, 'PUT'); toast('Appointment cancelled'); return loadAll(); }
    if (act === 'del-appt') {
      if (!confirm('Delete this appointment?')) return;
      await api('/appointments/' + id, 'DELETE'); toast('Appointment deleted'); return loadAll();
    }
    if (act === 'del-doctor' || act === 'del-patient') {
      const kind = act === 'del-doctor' ? 'doctors' : 'patients';
      if (!confirm('Delete this record?')) return;
      try { await api(`/${kind}/${id}`, 'DELETE'); toast('Deleted'); }
      catch (err) { toast('Could not delete. Remove their appointments first.', 'error'); }
      return loadAll();
    }
  } catch (err) {
    toast(err.message, 'error');
  }
});

document.querySelectorAll('.nav').forEach(btn => {
  btn.insertAdjacentHTML('afterbegin', icon(btn.dataset.icon));
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');
    state.view = btn.dataset.view;
    state.q = '';
    $('#search').value = '';
    render();
  });
});
$('#addBtn').addEventListener('click', () => VIEWS[state.view].open());
$('#search').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); render(); });
$('#mClose').addEventListener('click', closeModal);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

loadAll();