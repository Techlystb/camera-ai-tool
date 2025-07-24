let stream, net;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const preview = document.getElementById('preview');
const cameraSelect = document.getElementById('cameraSelect');
const sizeSelect = document.getElementById('sizeSelect');
const filterSelect = document.getElementById('filterSelect');
const captureBtn = document.getElementById('captureBtn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const statusDiv = document.getElementById('status');
const copyBtn = document.getElementById('copyBtn');
let uploadedLink = "";
let aiMode = false;

async function startCamera(facing = 'user') {
  if (stream) stream.getTracks().forEach(t => t.stop());
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: false
    });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera error: " + err.message);
  }
}

function setCanvasSize() {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
}

function applyCSSFilter() {
  if (filterSelect.value === 'warm') video.style.filter = "brightness(110%) contrast(110%) sepia(20%)";
  else if (filterSelect.value === 'cool') video.style.filter = "brightness(95%) contrast(120%) hue-rotate(180deg)";
  else if (filterSelect.value === 'hdr') video.style.filter = "brightness(120%) contrast(150%) saturate(140%)";
  else if (filterSelect.value === 'bw') video.style.filter = "grayscale(100%) contrast(150%)";
  else { video.style.filter = "none"; }
}

filterSelect.addEventListener('change', () => {
  aiMode = (filterSelect.value === 'ai');
  applyCSSFilter();
});

cameraSelect.addEventListener('change', () => startCamera(cameraSelect.value));
sizeSelect.addEventListener('change', setCanvasSize);

startCamera();
setCanvasSize();
applyCSSFilter();

async function ensureModelLoaded() {
  if (!net) {
    statusDiv.textContent = 'Loading AI model...';
    net = await bodyPix.load();
    statusDiv.textContent = '✅ AI model loaded';
  }
}

captureBtn.addEventListener('click', async () => {
  setCanvasSize();
  if (aiMode) await ensureModelLoaded();

  ctx.filter = video.style.filter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Overlay frame
  const frame = new Image();
  frame.crossOrigin = "anonymous";
  frame.src = document.getElementById('frameOverlay').src;
  await frame.decode();
  
  if (aiMode) {
    const segmentation = await net.segmentPerson(video);
    const mask = bodyPix.toMask(segmentation);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.putImageData(mask, 0, 0);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.filter = 'blur(10px)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
  }
  
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

  preview.src = canvas.toDataURL('image/png');
  preview.style.display = 'block';
  downloadBtn.style.display = 'inline-block';
  uploadBtn.disabled = false;
  statusDiv.textContent = '';
});

downloadBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = preview.src;
  a.download = 'captured.png';
  a.click();
});

uploadBtn.addEventListener('click', () => {
  statusDiv.textContent = 'Uploading...';
  const base64 = preview.src.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
  const formData = new FormData();
  formData.append('key', '355dbcfb690f8c7f8039bd31adbcf1bf'); // তোমার ImgBB API key
  formData.append('image', base64);

  fetch('https://cors-anywhere.herokuapp.com/https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        uploadedLink = data.data.url;
        statusDiv.innerHTML = `✅ Uploaded! <a href="${uploadedLink}" target="_blank" style="color:#0f0;">View</a>`;
        copyBtn.style.display = 'inline-block';
      } else {
        statusDiv.textContent = 'Upload failed: ' + JSON.stringify(data);
      }
    })
    .catch(err => {
      statusDiv.textContent = 'Error: ' + err.message;
    });
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(uploadedLink).then(() => {
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => copyBtn.textContent = '📋 Copy Link', 2000);
  });
});
