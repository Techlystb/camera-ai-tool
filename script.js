let net;
const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const downloadBtn = document.getElementById('downloadBtn');

// ✅ মডেল লোড করা
async function loadModel() {
  net = await bodyPix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2
  });
  console.log('✅ BodyPix Model Loaded');
}

// ✅ ক্যামেরা চালু
async function startCamera() {
  await loadModel();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      drawFrame();
    };
  } catch (err) {
    alert('❌ ক্যামেরা চালু করা যায়নি: ' + err.message);
  }
}

// ✅ রিয়েল টাইম ফ্রেম প্রক্রিয়া
async function drawFrame() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // AI দিয়ে segmentation
  const segmentation = await net.segmentPerson(video, {
    internalResolution: 'medium',
    segmentationThreshold: 0.7
  });

  const mask = bodyPix.toMask(segmentation);

  // মূল ভিডিও ফ্রেম আঁকা
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // মানুষের অংশ রেখে বাকি মুছে ফেলা
  ctx.globalCompositeOperation = 'destination-in';
  ctx.putImageData(mask, 0, 0);

  // ব্যাকগ্রাউন্ড ব্লার করার জন্য destination-over ব্যবহার
  ctx.globalCompositeOperation = 'destination-over';
  ctx.filter = 'blur(15px)';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  requestAnimationFrame(drawFrame);
}

// ✅ ডাউনলোড
function downloadImage() {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'ai-captured.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ▶️ ইভেন্ট লিসেনার
startBtn.addEventListener('click', startCamera);
downloadBtn.addEventListener('click', downloadImage);
