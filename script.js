let net;
const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const downloadBtn = document.getElementById('downloadBtn');

// ✅ BodyPix মডেল লোড
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

// ✅ প্রতিটি ফ্রেম AI দিয়ে প্রসেস করা
async function drawFrame() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // segmentation চালানো
  const segmentation = await net.segmentPerson(video, {
    internalResolution: 'medium',
    segmentationThreshold: 0.7
  });

  // mask তৈরি
  const mask = bodyPix.toMask(segmentation);

  // মানুষের অংশ আঁকা
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // মানুষের অংশ ছাড়া বাকি transparent
  ctx.globalCompositeOperation = 'destination-in';
  ctx.putImageData(mask, 0, 0);

  // পেছনের background blur
  ctx.globalCompositeOperation = 'destination-over';
  ctx.filter = 'blur(15px)';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  requestAnimationFrame(drawFrame);
}

// ✅ ডাউনলোড ফাংশন
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
