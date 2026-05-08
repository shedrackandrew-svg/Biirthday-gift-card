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

  function canvasBlob(){
    return new Promise((resolve) => giftCanvas.toBlob(resolve, 'image/png'));
  }

  async function sendCard(){
    const name=nameEl.value.trim();
    const phone=phoneEl.value.trim();
    const email=emailEl.value.trim();
    const gender=genderEl.value;
    if(!name){alert('Add a name');return}

    // draw to ensure canvas updated
    drawGiftCard(name, gender, bdayEl.value);

    const message = `Hi ${name}! Here is your birthday gift card. You can download it from the page after I send it.`;

    try{
      const blob = await canvasBlob();
      const file = new File([blob], 'gift-card.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: 'Birthday Gift Card',
          text: message,
          files: [file]
        });
        return;
      }

      downloadCanvas();

      const actions = [];
      if (phone) {
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        const waUrl = `https://wa.me/${cleanPhone.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        actions.push('WhatsApp');
      }
      if (email) {
        const mailUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Birthday Gift Card')}&body=${encodeURIComponent(message + '\n\nDownload the card from the page.')}`;
        window.open(mailUrl, '_blank', 'noopener,noreferrer');
        actions.push('email');
      }

      if (!actions.length) {
        alert('Card downloaded. Use the Download PNG button to share it.');
      } else {
        alert(`Card downloaded and opened ${actions.join(' and ')}.`);
      }
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
  // on load
  loadFull();

  // register service worker for simple caching and PWA
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();