const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const contadorDiv = document.getElementById('contador');

let temporizadorActivo = false;
let selfieTomada = false;
let intervaloTemporizador = null;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function loadAndRunPoseNet() {
  await setupCamera();
  const net = await posenet.load();
  detectPose(net);
}

async function detectPose(net) {
  const pose = await net.estimateSinglePose(video, { flipHorizontal: false });

  drawPose(pose);
  sendPoseToServer(pose);

  if (algunaManoLevantada(pose)) {
    if (!temporizadorActivo && !selfieTomada) {
      iniciarTemporizador();
    }
  }


  requestAnimationFrame(() => detectPose(net));
}

function algunaManoLevantada(pose) {
  const leftWrist = pose.keypoints.find(k => k.part === 'leftWrist');
  const rightWrist = pose.keypoints.find(k => k.part === 'rightWrist');
  const nose = pose.keypoints.find(k => k.part === 'nose');

  if (
    nose && (leftWrist && leftWrist.score > 0.5 && leftWrist.position.y < nose.position.y ||
      rightWrist && rightWrist.score > 0.5 && rightWrist.position.y < nose.position.y)
  ) {
    return true;
  }
  return false;
}

function drawSkeleton(keypoints, minConfidence, ctx) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);
  adjacentKeyPoints.forEach(([kp1, kp2]) => {
    ctx.beginPath();
    ctx.moveTo(kp1.position.x, kp1.position.y);
    ctx.lineTo(kp2.position.x, kp2.position.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'aqua';
    ctx.stroke();
  });
}

function drawPose(pose) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  drawSkeleton(pose.keypoints, 0.5, ctx);
  for (let keypoint of pose.keypoints) {
    if (keypoint.score > 0.5) {
      ctx.beginPath();
      ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  }
}

async function sendPoseToServer(pose) {
  try {
    await fetch('/api/pose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pose),
    });
  } catch (err) {
    console.error('Error enviando datos al backend:', err);
  }
}

function iniciarTemporizador() {
  let cuentaRegresiva = 3;
  temporizadorActivo = true;
  contadorDiv.style.display = 'block';
  contadorDiv.textContent = cuentaRegresiva;

  intervaloTemporizador = setInterval(() => {
    cuentaRegresiva--;
    if (cuentaRegresiva > 0) {
      contadorDiv.textContent = cuentaRegresiva;
    } else {
      clearInterval(intervaloTemporizador);
      temporizadorActivo = false;
      selfieTomada = true;
      contadorDiv.style.display = 'none';
      downloadPhoto();
      setTimeout(() => {
        selfieTomada = false;
      }, 5000);
    }
  }, 1000);
}

function downloadPhoto() {
  const link = document.createElement('a');
  link.download = 'selfie.png';
  link.href = videoToDataURL();
  link.click();
}

function videoToDataURL() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  return tempCanvas.toDataURL('image/png');
}

loadAndRunPoseNet();
