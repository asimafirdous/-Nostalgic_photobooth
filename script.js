const video = document.getElementById('camera');
const canvas = document.getElementById('photo-canvas');
const context = canvas.getContext('2d');
const upload = document.getElementById('upload-photo');
const note = document.getElementById('note');
const layout = document.getElementById('layout');
const downloadBtn = document.getElementById('download');
const captureBtn = document.getElementById('capture');
const countdownEl = document.getElementById('countdown');
const saveGalleryBtn = document.getElementById('save-gallery');
const viewGalleryBtn = document.getElementById('view-gallery');
const gallerySection = document.getElementById('gallery');
const cassetteSound = document.getElementById('cassette-sound');

let currentImage = null;
let currentFilter = 'none';

document.getElementById('start-camera').onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = 'block';
    canvas.style.display = 'none';
    currentImage = null;
  } catch (err) {
    alert("Camera access denied or unavailable.");
  }
};

upload.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      canvas.style.display = 'block';
      video.style.display = 'none';
      currentImage = img;
      applyFilter(currentFilter);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
};

function getSelectedTimer() {
  const selected = document.querySelector('input[name="timer"]:checked');
  return parseInt(selected.value);
}

function startCountdown(seconds, callback) {
  countdownEl.textContent = seconds;
  const interval = setInterval(() => {
    seconds--;
    countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      countdownEl.textContent = '';
      callback();
    }
  }, 1000);
}

captureBtn.onclick = () => {
  const delay = getSelectedTimer();
  if (delay > 0) {
    startCountdown(delay, captureFromVideo);
  } else {
    captureFromVideo();
  }
};

function captureFromVideo() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  canvas.style.display = 'block';
  video.style.display = 'none';

  cassetteSound.currentTime = 0;
  cassetteSound.play();

  const img = new Image();
  img.src = canvas.toDataURL();
  img.onload = () => {
    currentImage = img;
    applyFilter(currentFilter);
  };
}

document.querySelectorAll('.filters button').forEach(button => {
  button.onclick = () => {
    currentFilter = button.dataset.filter;
    applyFilter(currentFilter);
  };
});

function applyFilter(filter) {
  if (!currentImage) return;
  context.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

  let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  if (filter === 'bw') {
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
      imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = avg;
    }
  } else if (filter === 'retro') {
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] *= 1.1;
      imageData.data[i+2] *= 0.8;
    }
  } else if (filter === '90s') {
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i+1] *= 1.3;
    }
  }

  context.putImageData(imageData, 0, 0);
}

downloadBtn.onclick = () => {
  const finalCanvas = createStripWithNote();
  const link = document.createElement('a');
  link.download = 'photobooth_strip.png';
  link.href = finalCanvas.toDataURL();
  link.click();
};

saveGalleryBtn.onclick = () => {
  const strip = createStripWithNote();
  const dataURL = strip.toDataURL();
  const gallery = JSON.parse(localStorage.getItem('nostalgicGallery') || '[]');
  gallery.push(dataURL);
  localStorage.setItem('nostalgicGallery', JSON.stringify(gallery));
  alert("Saved to gallery!");
};

viewGalleryBtn.onclick = () => {
  gallerySection.innerHTML = '';
  const gallery = JSON.parse(localStorage.getItem('nostalgicGallery') || '[]');
  gallery.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    gallerySection.appendChild(img);
  });
};

function createStripWithNote() {
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height + 50;

  const ctx = finalCanvas.getContext('2d');
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  ctx.fillStyle = "#000";
  ctx.font = "12px monospace";
  ctx.fillText(note.value.slice(0, 250), 10, canvas.height + 30);

  return finalCanvas;
}