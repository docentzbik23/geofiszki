const $=id=>document.getElementById(id);
let laws=[],exams=[],sources=[],mode='law',list=[],idx=0,revealed=false,graded=false,selected=new Set();
let progress={};try{progress=JSON.parse(localStorage.getItem('geofiszki-progress-v1')||'{}')}catch{}
const save=()=>{try{localStorage.setItem('geofiszki-progress-v1',JSON.stringify(progress))}catch{}};
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=q=>(q.kind==='law'?'law-':'exam-')+q.id;
const pdfURL=(name,page)=>'./pdf/'+encodeURIComponent(name)+(page?'#page='+page:'');
function pageOf(q){const m=(q.reference||'').match(/s\.\s*(\d+)\s*PDF/i);return m?+m[1]:null}
function btn(text,style,handler){const b=document.createElement('button');b.textContent=text;b.className=style||'';b.onclick=handler;$('actions').append(b)}
function updateMetrics(){$('lawCount').textContent=laws.length;$('metricLaws').textContent=laws.length;$('metricExam').textContent=exams.length;$('metricDocs').textContent=sources.length+4;$('metricKnown').textContent=Object.values(progress).filter(v=>v==='known').length}
// Każdy tryb zapamiętuje własne wyszukiwanie. Filtr fiszek nie ogranicza testów ABC.
const searchByMode={law:'',exam:'',write:'',review:'',library:''};
function switchMode(m){
 searchByMode[mode]=$('search').value;
 mode=m;
 $('search').value=searchByMode[m]||'';
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));
 document.querySelectorAll('.exam-filter').forEach(e=>e.hidden=m!=='exam');
 $('source').disabled=m==='exam';
 filter();
}
function filter(reset=true){if(reset)idx=0;revealed=false;graded=false;selected=new Set();let pool=mode==='exam'?exams:mode==='review'?[...laws,...exams].filter(q=>progress[key(q)]==='missed'):laws;
 const src=$('source').value,term=$('search').value.trim().toLocaleLowerCase('pl');
 pool=pool.filter(q=>{if(src!=='all'&&q.source!==src)return false;if(mode==='exam'&&$('part').value!=='all'&&q.part!==$('part').value)return false;if(mode==='exam'&&$('status').value!=='all'&&q.status!==$('status').value)return false;return !term||[q.front,q.back,q.question,q.reference,q.topic,q.note,q.legal,...Object.values(q.options||{})].join(' ').toLocaleLowerCase('pl').includes(term)});
 if($('order').value==='random')pool=pool.sort(()=>Math.random()-.5);list=pool;render()}
function next(){idx=Math.min(idx+1,list.length);revealed=false;graded=false;selected.clear();render()}
function prev(){idx=Math.max(0,idx-1);revealed=false;graded=false;selected.clear();render()}
function mark(v){const q=list[idx];if(!q)return;progress[key(q)]=v;save();updateMetrics();next()}
function sourceLink(q){return q.source?`<p class="ref">Źródło: ${escapeHTML(q.topic||q.source)} · ${escapeHTML(q.reference||'')} · <a href="${pdfURL(q.source,pageOf(q))}" target="_blank" rel="noopener">Otwórz PDF ↗</a></p>`:''}
function askChatGPT(q){
 const question=q.front||q.question||'';
 const answer=q.back||(q.answer||[]).join(', ');
 const prompt=`Pomóż mi zrozumieć tę fiszkę z aplikacji GeoFiszki, przygotowanej do egzaminu na uprawnienia geologiczne V i VII.\n\nFiszka: ${question}\nOdpowiedź: ${answer}\nŹródło: ${q.topic||''}; ${q.reference||q.legal||''}; ${q.source||''}.\n\nWyjaśnij konkretnie, sprawdź podstawę prawną i wyjątki. Nie zakładaj, że odpowiedź z fiszki jest poprawna. Zadaj mi pytanie, co jest dla mnie niejasne.`;
 const url='https://chatgpt.com/?q='+encodeURIComponent(prompt);
 // Kopia pytania pozostaje dostępna, gdy ChatGPT nie obsłuży parametru w URL.
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(prompt).catch(()=>{});
 const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click();
}
function render(){const card=$('card');$('actions').replaceChildren();$('modeLabel').textContent=({law:'SZYBKIE FISZKI',exam:'TESTY ABC',write:'ODPOWIEDŹ WŁASNA',review:'POWTÓRKI',library:'BIBLIOTEKA PDF'})[mode];$('heading').textContent=({law:'Sprawdź, co pamiętasz',exam:'Pytania egzaminacyjne',write:'Odpowiedz własnymi słowami',review:'Wróć do trudnych zagadnień',library:'Dokumenty źródłowe'})[mode];
 if(mode==='library'){renderLibrary();return}
 $('position').textContent=list.length?`${Math.min(idx+1,list.length)} / ${list.length}`:'0 / 0';$('progressFill').style.width=(list.length?100*Math.min(idx,list.length)/list.length:0)+'%';
 if(!list.length){card.innerHTML='<h3>Brak pasujących materiałów</h3><p>Zmień filtry lub tryb nauki.</p>';return}
 if(idx>=list.length){card.innerHTML='<h3>Koniec sesji</h3><p>Możesz wrócić do początku lub wybrać powtórki.</p>';btn('Od początku','primary',()=>{idx=0;render()});return}
 const q=list[idx];if(q.kind==='exam'&&mode!=='write'){
  card.innerHTML=`<span class="tag">PYTANIE ${q.id} · CZĘŚĆ ${escapeHTML(q.part)}</span><h3>${escapeHTML(q.question)}</h3><div id="choices"></div><div id="result"></div>${q.note?`<p class="ref">Komentarz: ${escapeHTML(q.note)} ${escapeHTML(q.legal||'')}</p>`:''}`;
  const choices=$('choices');for(const [k,v] of Object.entries(q.options||{})){const b=document.createElement('button');b.className='option'+(selected.has(k)?' selected':'');b.textContent=k+'. '+v;b.disabled=graded;b.onclick=()=>{selected.has(k)?selected.delete(k):selected.add(k);b.classList.toggle('selected',selected.has(k))};choices.append(b)}
  if(!graded)btn('Sprawdź','primary',()=>{graded=true;render()});else{
   const keyStr=q.answer?.join(', ')||'brak';const message=q.status==='unknown'?'Brak rozstrzygniętego klucza — nie oceniaj automatycznie odpowiedzi.':`Klucz ${q.status==='checked'?'sprawdzony':'wstępny'}: ${keyStr}. ${[...selected].sort().join(',')===q.answer.slice().sort().join(',')?'Zgodność z kluczem.':'Porównaj warianty.'}`;
   $('result').innerHTML=`<div class="answer">${escapeHTML(message)}</div>`;btn('Do powtórki','bad',()=>mark('missed'));btn('Znam ✓','good',()=>mark('known'))}
 }else{
  card.innerHTML=`<span class="tag">${escapeHTML(q.topic||'ZAGADNIENIE')} ${mode==='write'?'· ĆWICZENIE PISEMNE':''}</span><h3>${escapeHTML(q.front||q.question)}</h3>${mode==='write'?'<label for="written">Twoja odpowiedź (opcjonalnie)</label><textarea class="answer-input" id="written" placeholder="Wpisz odpowiedź, jeśli chcesz poćwiczyć formułowanie przepisów..."></textarea>':''}${revealed?`<div class="answer">${escapeHTML(q.back||('Klucz: '+(q.answer||[]).join(', ')))}</div>${sourceLink(q)}`:'<p class="muted">Przypomnij sobie odpowiedź i odsłoń ją jednym kliknięciem.</p>'}`;
  if(!revealed)btn('Pokaż odpowiedź','primary',()=>{revealed=true;const typed=$('written')?.value||'';render();if(typed){const p=document.createElement('p');p.className='ref';p.textContent='Twoja odpowiedź: '+typed;card.append(p)}});
  else{btn('Do powtórki','bad',()=>mark('missed'));btn('Znam ✓','good',()=>mark('known'));btn('Zapytaj ChatGPT ↗','',()=>askChatGPT(q))}
 }
 btn('← Poprzednia','',prev);btn('Pomiń →','',next)
}
function renderLibrary(){const card=$('card');$('position').textContent=sources.length+4+' dokumentów';$('progressFill').style.width='0';const term=$('search').value.trim().toLocaleLowerCase('pl');const all=[...sources,...['Pytania_-_1cz.pdf','Pytania_-_2cz.pdf','Pytania_-_3cz.pdf','Pytania_-_4cz.pdf'].map((id,i)=>({id,name:'Pytania egzaminacyjne — część '+(i+1),pages:null}))];const filtered=all.filter(s=>(s.name+' '+s.id).toLocaleLowerCase('pl').includes(term));card.innerHTML=`<p class="search-note">Otwórz oryginalny PDF, aby wyszukać w nim frazę za pomocą Ctrl+F (na komputerze) lub wyszukiwarki przeglądarki. W trybie fiszek link „Otwórz PDF” prowadzi do wskazanej strony, jeśli jest znana.</p><div class="library-grid">${filtered.map(s=>`<div class="doc"><b>${escapeHTML(s.id.replace(/\.pdf$/i,''))} — ${escapeHTML(s.name)}</b><small>${escapeHTML(s.id)} ${s.pages?'· '+s.pages+' stron':''}</small><a href="${pdfURL(s.id)}" target="_blank" rel="noopener">Otwórz PDF ↗</a><a href="${pdfURL(s.id)}" download>Pobierz</a></div>`).join('')}</div>`}
async function init(){try{const data=await Promise.all(['laws.json','questions.json','sources.json'].map(async p=>{const r=await fetch('./'+p);if(!r.ok)throw Error(p);return r.json()}));[laws,exams,sources]=data;laws=laws.map(x=>({...x,kind:'law'}));exams=exams.map(x=>({...x,kind:'exam'}));for(const s of sources){const o=document.createElement('option');o.value=s.id;o.textContent=s.name;$('source').append(o)}updateMetrics();switchMode('law')}catch(e){$('card').textContent='Nie można załadować danych. Uruchom stronę przez serwer HTTP lub opublikuj ją na HTTPS.';console.error(e)}}
document.querySelectorAll('.navbtn').forEach(b=>b.onclick=()=>switchMode(b.dataset.mode));for(const id of ['source','part','status','order'])$(id).onchange=()=>filter();$('search').oninput=()=>filter();$('reset').onclick=()=>{idx=0;render()};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,progress},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='geofiszki-postepy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed.progress||typeof parsed.progress!=='object')throw Error('format');progress={...progress,...parsed.progress};save();updateMetrics();filter();alert('Postępy zaimportowane')}catch{alert('Nieprawidłowy plik')}e.target.value=''};
let installEvent;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('install').hidden=false});$('install').onclick=async()=>{if(installEvent){installEvent.prompt();await installEvent.userChoice;installEvent=null;$('install').hidden=true}};
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(console.warn);init();
