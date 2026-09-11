const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
let notes=store.get('gp_notes',[]), sessions=store.get('gp_sessions',[]), workouts=store.get('gp_workouts',[]);
let workStart=null, workElapsed=0, workInterval=null, activeTag='All';

const pad=n=>String(n).padStart(2,'0');
const fmtDate=d=>new Date(d).toLocaleString(undefined,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const todayKey=()=>new Date().toISOString().slice(0,10);
const duration=s=>{s=Math.max(0,Math.floor(s));return `${Math.floor(s/3600)}h ${pad(Math.floor(s%3600/60))}m`};
function updateClock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString();$('#todayDate').textContent=d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('#greeting').textContent=d.getHours()<12?'Good morning':d.getHours()<18?'Good afternoon':'Good evening'}
setInterval(updateClock,1000);updateClock();

function showSection(id){$$('.page').forEach(x=>x.classList.toggle('active',x.id===id));$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.section===id));const names={dashboard:'Dashboard',notes:'Notes',work:'Work Hours',workouts:'Workouts',settings:'Settings'};$('#pageTitle').textContent=names[id]||'Dashboard'}
$$('[data-section]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
document.addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(b)showSection(b.dataset.section);if(e.target.closest('[data-action="new-note"]'))openNote();if(e.target.closest('[data-action="new-workout"]'))openWorkout()});

function renderNotes(query=''){
 const q=query.toLowerCase(); const filtered=notes.filter(n=>(activeTag==='All'||n.tag===activeTag)&&(`${n.title} ${n.content} ${n.tag}`).toLowerCase().includes(q));
 $('#notesGrid').innerHTML=filtered.length?filtered.map(noteHTML).join(''):'<div class="note"><strong>No notes found</strong><p>Create a note to get started.</p></div>';
 $('#recentNotes').innerHTML=notes.slice(0,3).map(noteHTML).join('')||'<div class="note"><strong>Your notes will appear here.</strong><p>Click New Note to capture your first idea.</p></div>';
 const tags=['All',...new Set(notes.map(n=>n.tag))];$('#tagFilters').innerHTML=tags.map(t=>`<button class="filter ${t===activeTag?'active':''}" data-tag="${t}">${t}</button>`).join('');
}
function noteHTML(n){return `<article class="note"><div class="note-top"><h3>${esc(n.title)}</h3><span class="tag">${esc(n.tag)}</span></div><p>${esc(n.content)}</p><div class="note-footer"><span>${fmtDate(n.updated)}</span><span class="note-actions"><button onclick="editNote('${n.id}')">Edit</button><button onclick="deleteNote('${n.id}')">Delete</button></span></div></article>`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function openNote(n=null){$('#modalTitle').textContent=n?'Edit Note':'New Note';$('#noteId').value=n?.id||'';$('#noteTitle').value=n?.title||'';$('#noteTag').value=n?.tag||'Personal';$('#noteContent').value=n?.content||'';$('#modal').classList.add('open');setTimeout(()=>$('#noteTitle').focus(),50)}
function closeNote(){$('#modal').classList.remove('open')}
window.editNote=id=>openNote(notes.find(n=>n.id===id));
window.deleteNote=id=>{if(confirm('Delete this note?')){notes=notes.filter(n=>n.id!==id);store.set('gp_notes',notes);renderNotes();}}
$('#noteForm').addEventListener('submit',e=>{e.preventDefault();const id=$('#noteId').value;const item={id:id||crypto.randomUUID(),title:$('#noteTitle').value.trim(),tag:$('#noteTag').value,content:$('#noteContent').value.trim(),updated:new Date().toISOString()};if(id)notes=notes.map(n=>n.id===id?item:n);else notes.unshift(item);store.set('gp_notes',notes);closeNote();renderNotes();updateDashboard()});
$('#closeModal').onclick=$('#cancelModal').onclick=closeNote;
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeNote()});
$('#noteSearch').addEventListener('input',e=>renderNotes(e.target.value));
$('#globalSearch').addEventListener('input',e=>{showSection('notes');$('#noteSearch').value=e.target.value;renderNotes(e.target.value)});
$('#tagFilters').addEventListener('click',e=>{if(e.target.dataset.tag){activeTag=e.target.dataset.tag;renderNotes($('#noteSearch').value)}});

function updateDashboard(){const today=sessions.filter(s=>s.date===todayKey()).reduce((a,s)=>a+s.seconds,0);const wt=workouts.filter(w=>w.date===todayKey()).reduce((a,w)=>a+w.duration,0);$('#dashWork').textContent=duration(today);$('#dashWorkout').textContent=`${wt} min`;$('#workTotal').textContent=duration(today);$('#workoutCount').textContent=workouts.length;$('#weekWorkout').textContent=workouts.filter(w=>Date.now()-new Date(w.created)<7*864e5).reduce((a,w)=>a+w.duration,0)+' min';renderSessions();renderWorkouts()}
function renderSessions(){$('#workSessions').innerHTML=sessions.filter(s=>s.date===todayKey()).slice().reverse().map(s=>`<div class="list-item"><div><strong>Work session</strong><p>${fmtDate(s.created)}</p></div><strong>${duration(s.seconds)}</strong></div>`).join('')||'<p class="muted">No work sessions today.</p>'}
function renderWorkouts(){$('#workoutList').innerHTML=workouts.slice().sort((a,b)=>b.created-a.created).map(w=>`<div class="list-item"><div><strong>${esc(w.name)}</strong><p>${esc(w.details||'Workout logged')} · ${fmtDate(w.created)}</p></div><strong>${w.duration} min</strong></div>`).join('')||'<p class="muted">No workouts logged yet.</p>'}

function workTick(){workElapsed=Math.floor((Date.now()-workStart)/1000);$('#workTimer').textContent=[Math.floor(workElapsed/3600),Math.floor(workElapsed%3600/60),workElapsed%60].map(pad).join(':')}
$('#workToggle').onclick=()=>{if(!workStart){workStart=Date.now();workElapsed=0;workInterval=setInterval(workTick,1000);$('#workToggle').textContent='■ Stop Work';$('#workStatus').textContent='Work session in progress'}else{clearInterval(workInterval);workTick();sessions.push({created:new Date().toISOString(),date:todayKey(),seconds:workElapsed});store.set('gp_sessions',sessions);workStart=null;workElapsed=0;$('#workTimer').textContent='00:00:00';$('#workToggle').textContent='▶ Start Work';$('#workStatus').textContent='Session saved';updateDashboard()}};

function openWorkout(){$('#workoutModal').classList.add('open');$('#workoutName').focus()}
function closeWorkout(){$('#workoutModal').classList.remove('open')}
$('#workoutForm').addEventListener('submit',e=>{e.preventDefault();workouts.unshift({created:Date.now(),date:todayKey(),name:$('#workoutName').value.trim(),duration:Number($('#workoutDuration').value),details:$('#workoutDetails').value.trim()});store.set('gp_workouts',workouts);e.target.reset();closeWorkout();updateDashboard()});
$('#closeWorkout').onclick=$('#cancelWorkout').onclick=closeWorkout;
$('#workoutModal').addEventListener('click',e=>{if(e.target.id==='workoutModal')closeWorkout()});

function setTheme(){const light=localStorage.getItem('gp_theme')==='light';document.body.classList.toggle('light',light);$('#themeBtn').textContent=light?'☾':'☀';}
$('#themeBtn').onclick=()=>{localStorage.setItem('gp_theme',document.body.classList.contains('light')?'dark':'light');setTheme()};$('#settingsTheme').onclick=$('#themeBtn').onclick;
$('#clearData').onclick=()=>{if(confirm('Clear all notes, work sessions and workouts?')){notes=[];sessions=[];workouts=[];store.set('gp_notes',[]);store.set('gp_sessions',[]);store.set('gp_workouts',[]);renderNotes();updateDashboard()}};

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
setTheme();renderNotes();updateDashboard();
