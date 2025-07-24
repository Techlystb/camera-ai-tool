
let stream;
const video=document.getElementById('camera');
const canvas=document.getElementById('snapshot');
const preview=document.getElementById('preview');
const captureBtn=document.getElementById('captureBtn');
const uploadBtn=document.getElementById('uploadBtn');
const downloadBtn=document.getElementById('downloadBtn');
const statusDiv=document.getElementById('status');
const cameraSelect=document.getElementById('cameraSelect');
const sizeSelect=document.getElementById('sizeSelect');
const filterSelect=document.getElementById('filterSelect');
let currentFilter='none';

  
  
  
// 🎨 Filter Update
function updateFilter(){
  let f="";
  const p=presetSelect.value;
  if(p==="warm"){f="brightness(110%) contrast(110%) sepia(20%)";}
  else if(p==="cool"){f="brightness(95%) contrast(120%) hue-rotate(180deg)";}
  else if(p==="hdr"){f="brightness(120%) contrast(150%) saturate(140%)";}
  else if(p==="teal"){f="contrast(130%) saturate(150%) hue-rotate(180deg)";}
  else if(p==="retro"){f="sepia(40%) contrast(120%) brightness(90%)";}
  else if(p==="bw"){f="grayscale(100%) contrast(150%)";}
  else if(p==="sketch"){f="contrast(200%) invert(100%) grayscale(100%)";}
  else if(p==="cartoon"){f="contrast(150%) saturate(120%)";}
  else if(p==="emboss"){f="contrast(200%) sepia(20%)";}
  else if(p==="edge"){f="contrast(300%) brightness(150%)";}
  video.style.filter=f;
}
presetSelect.addEventListener('change',updateFilter);


  
  
  
  
  
async function startCamera(facingMode='user'){
  if(stream){stream.getTracks().forEach(t=>t.stop());}
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facingMode},audio:false});
    video.srcObject=stream;
  }catch(e){alert('Camera could not be turned on: '+e.message);}
}

function setCanvasSize(){
  const [w,h]=sizeSelect.value.split('x').map(Number);
  canvas.width=w;canvas.height=h;
}

cameraSelect.addEventListener('change',()=>{startCamera(cameraSelect.value);});
sizeSelect.addEventListener('change',setCanvasSize);
filterSelect.addEventListener('change',()=>{
  currentFilter=filterSelect.value;
  video.style.filter=currentFilter;
});

startCamera();setCanvasSize();

captureBtn.addEventListener('click',()=>{
  const ctx=canvas.getContext('2d');
  ctx.filter=currentFilter;
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  preview.src=canvas.toDataURL('image/png');
  uploadBtn.disabled=false;
  downloadBtn.style.display='inline-block';
  statusDiv.textContent='';
});

downloadBtn.addEventListener('click',()=>{
  if(!preview.src){alert('Take a picture first.');return;}
  const a=document.createElement('a');
  a.href=preview.src;
  a.download='captured.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});



let uploadedLink = "";
const copyBtn = document.getElementById('copyBtn');

uploadBtn.addEventListener('click',()=>{
  if(!preview.src){alert('Take a picture first.');return;}
  statusDiv.style.color='#0f0';
  statusDiv.textContent='Uploading...';
  copyBtn.style.display='none';

  const base64Data = preview.src.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

  const formData = new FormData();
  formData.append('key','355dbcfb690f8c7f8039bd31adbcf1bf'); // Your API KEY
  formData.append('image', base64Data);

  fetch('https://cors-anywhere.herokuapp.com/https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if(data.success){
      uploadedLink = data.data.url;
      statusDiv.style.color='#0f0';
      statusDiv.innerHTML = ' Success!<br><a href="'+uploadedLink+'" target="_blank" style="color:#0f0;">See the picture</a>';
      copyBtn.style.display='inline-block';
    }else{
      statusDiv.style.color='#f00';
      statusDiv.innerHTML = ' Failed!<br>'+JSON.stringify(data);
    }
  })
  .catch(err=>{
    statusDiv.style.color='#f00';
    statusDiv.innerHTML = ' Error: '+err.message;
  });
});

//  Copy Button Action
copyBtn.addEventListener('click', ()=>{
  if(uploadedLink){
    navigator.clipboard.writeText(uploadedLink).then(()=>{
      copyBtn.textContent = " Copied!";
      setTimeout(()=>{
        copyBtn.textContent = "📋 Copy link";
      },2000);
    });
  }
});
