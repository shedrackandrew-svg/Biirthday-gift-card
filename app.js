(function(){
  const nameEl=document.getElementById('name');
  const phoneEl=document.getElementById('phone');
  const emailEl=document.getElementById('email');
  const genderEl=document.getElementById('gender');
  const bdayEl=document.getElementById('bday');
  const saveBtn=document.getElementById('saveBtn');
  const generateBtn=document.getElementById('generateBtn');
  const sendBtn=document.getElementById('sendBtn');
  const giftArea=document.getElementById('giftCardArea');
  const giftCanvas=document.getElementById('giftCanvas');
  const downloadBtn=document.getElementById('downloadBtn');
  const closeGiftBtn=document.getElementById('closeGiftBtn');
  const surpriseModal=document.getElementById('surpriseModal');
  const surpriseText=document.getElementById('surpriseText');
  const closeModal=document.getElementById('closeModal');

  const STORAGE_KEY='birthday-surprise-data-v1';

  function save(){
    const name=nameEl.value.trim();
    const date=bdayEl.value;
    const phone=phoneEl.value.trim();
    const email=emailEl.value.trim();
    const gender=genderEl.value;
    if(!name||!date){alert('Please provide a name and a date');return}
    localStorage.setItem(STORAGE_KEY,JSON.stringify({name,date,phone,email,gender}));
    alert('Saved');
  }

  function load(){
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    try{const obj=JSON.parse(raw);nameEl.value=obj.name||'';bdayEl.value=obj.date||''}catch(e){}
  }

  function loadFull(){
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    try{const obj=JSON.parse(raw);
      nameEl.value=obj.name||'';
      bdayEl.value=obj.date||'';
      phoneEl.value=obj.phone||'';
      emailEl.value=obj.email||'';
      genderEl.value=obj.gender||'unspecified';
    }catch(e){}
  }

  function askNotificationPermission(){
    if(!('Notification' in window)) return;
    if(Notification.permission==='default'){
      Notification.requestPermission();
    }
  }

  function checkForBirthday(){
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    let obj; try{obj=JSON.parse(raw)}catch(e){return}
    if(!obj.date) return;
    const today=new Date();
    const b=new Date(obj.date);
    if(today.getMonth()===b.getMonth() && today.getDate()===b.getDate()){
      triggerSurprise(obj.name||'');
    }
  }

  let lastShownDate='';
  function triggerSurprise(name){
    const todayKey=(new Date()).toDateString();
    if(lastShownDate===todayKey) return; // only once per day
    lastShownDate=todayKey;
    const text=`It's ${name}'s birthday today!`;
    surpriseText.textContent=text;
    surpriseModal.hidden=false;
    try{
      if(Notification.permission==='granted'){
        new Notification('Birthday Surprise', {body:text, vibrate:[200,100,200]});
      }
    }catch(e){console.warn(e)}
  }

  function computeAge(birthDate){
    const b=new Date(birthDate);
    const today=new Date();
    let age=today.getFullYear()-b.getFullYear();
    const m=today.getMonth()-b.getMonth();
    if(m<0|| (m===0 && today.getDate()<b.getDate())) age--;
    return age;
  }

  function drawGiftCard(name, gender, birth){
    const ctx=giftCanvas.getContext('2d');
    const w=giftCanvas.width; const h=giftCanvas.height;
    // palette based on gender
    let bg='#fff7ed', accent='#f97316', text='#111827';
    if(gender==='female'){bg='#fff0f6'; accent='#ec4899'}
    else if(gender==='male'){bg='#f0f9ff'; accent='#0284c7'}
    else if(gender==='other'){bg='#f3f4f6'; accent='#6b46c1'}

    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    // ribbon
    ctx.fillStyle=accent; ctx.fillRect(0,20,w,60);
    ctx.fillStyle='white'; ctx.font='36px system-ui,Segoe UI,Arial'; ctx.fillText('Happy Birthday',40,60);

    // name and age
    const age = birth ? computeAge(birth) : null;
    ctx.fillStyle=text; ctx.font='28px system-ui,Segoe UI,Arial';
    ctx.fillText(name || 'Friend',40,140);
    if(age!==null && !isNaN(age)){
      ctx.font='18px system-ui,Segoe UI,Arial'; ctx.fillText(`Age: ${age}`,40,180);
    }
    ctx.font='16px system-ui,Segoe UI,Arial'; ctx.fillText('Wishing you a wonderful day!',40,220);
  }

  function downloadCanvas(){
    const url=giftCanvas.toDataURL('image/png');
    const a=document.createElement('a'); a.href=url; a.download='gift-card.png'; document.body.appendChild(a); a.click(); a.remove();
  }

  async function sendCard(){
    const apiUrlInput=document.getElementById('apiUrl');
    const apiUrl=apiUrlInput.value.trim();
    if(!apiUrl){alert('Please provide the server API URL in the form to send messages.');return}
    const name=nameEl.value.trim(); const phone=phoneEl.value.trim(); const email=emailEl.value.trim(); const gender=genderEl.value;
    if(!name){alert('Add a name');return}
    // draw to ensure canvas updated
    drawGiftCard(name, gender, bdayEl.value);
    const dataUrl=giftCanvas.toDataURL('image/png');
    try{
      const res=await fetch(apiUrl.replace(/\/+$/,'')+'/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,email,gender,birthday:bdayEl.value,image:dataUrl})});
      const j=await res.json();
      if(res.ok) alert('Sent successfully'); else alert('Send failed: '+(j.error||res.statusText));
    }catch(e){alert('Send error: '+e.message)}
  }

  saveBtn.addEventListener('click',save);
  generateBtn.addEventListener('click',()=>{
    const name=nameEl.value.trim(); if(!name){alert('Enter a name first');return}
    giftArea.hidden=false; drawGiftCard(name, genderEl.value, bdayEl.value);
  });
  sendBtn.addEventListener('click',sendCard);
  downloadBtn.addEventListener('click',downloadCanvas);
  closeGiftBtn.addEventListener('click',()=>giftArea.hidden=true);
  closeModal.addEventListener('click',()=>surpriseModal.hidden=true);

  // periodic check (every minute) and on load
  loadFull(); askNotificationPermission(); checkForBirthday();
  setInterval(checkForBirthday,60*1000);

  // register service worker for simple caching and PWA
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();