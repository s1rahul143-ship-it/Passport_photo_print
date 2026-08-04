// script.js — upload, crop, layout generation, printing, background selection

const photoInput = document.getElementById('photoInput');
const copiesInput = document.getElementById('copiesInput');
const generateBtn = document.getElementById('generateBtn');
const printBtn = document.getElementById('printBtn');
const previewArea = document.getElementById('previewArea');
const backgroundSelect = document.getElementById('backgroundSelect');

const cropModal = document.getElementById('cropModal');
const cropImg = document.getElementById('cropImg');
const cropViewport = document.getElementById('cropViewport');
const zoomRange = document.getElementById('zoomRange');
const applyCropBtn = document.getElementById('applyCrop');
const cancelCropBtn = document.getElementById('cancelCrop');

let originalDataUrl = null;   // raw uploaded image
let croppedDataUrl = null;    // final cropped image used for layout
let imgNaturalW = 0;
let imgNaturalH = 0;

// transform state for cropping
let scale = 1;
let tx = 0;
let ty = 0;
let dragging = false;
let lastPointer = {x:0,y:0};

function setDisabled(disabled){
  generateBtn.disabled = disabled;
  printBtn.disabled = disabled;
}

// Read file and open crop modal
photoInput.addEventListener('change', () => {
  try {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return setDisabled(true);
    if (!/image\/(jpeg|png)/.test(file.type)) return alert('Please upload a JPG or PNG image');

    const reader = new FileReader();
    reader.onload = (e) => {
      originalDataUrl = e.target.result;
      // Allow generating immediately (user can skip cropping) but still open crop modal
      setDisabled(false);
      openCropModal(originalDataUrl);
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error('Error handling file input:', err);
    alert('An error occurred while reading the file. See console for details.');
  }
});

function openCropModal(dataUrl){
  cropImg.src = dataUrl;
  cropImg.style.transform = '';
  scale = 1;
  tx = 0;
  ty = 0;
  zoomRange.value = 100;
  cropModal.style.display = 'flex';
  cropImg.onload = () => {
    imgNaturalW = cropImg.naturalWidth;
    imgNaturalH = cropImg.naturalHeight;
    // Fit image so it covers viewport minimally
    const vw = cropViewport.clientWidth;
    const vh = cropViewport.clientHeight;
    const fitScale = Math.max(vw / imgNaturalW, vh / imgNaturalH);
    scale = fitScale;
    tx = (vw - imgNaturalW * scale) / 2;
    ty = (vh - imgNaturalH * scale) / 2;
    updateImageTransform();
  };
}

// pointer-based panning
cropViewport.addEventListener('pointerdown', (ev) => {
  cropViewport.setPointerCapture(ev.pointerId);
  dragging = true;
  lastPointer.x = ev.clientX;
  lastPointer.y = ev.clientY;
});
window.addEventListener('pointermove', (ev) => {
  if (!dragging) return;
  const dx = ev.clientX - lastPointer.x;
  const dy = ev.clientY - lastPointer.y;
  lastPointer.x = ev.clientX;
  lastPointer.y = ev.clientY;
  tx += dx;
  ty += dy;
  updateImageTransform();
});
window.addEventListener('pointerup', () => dragging = false);
window.addEventListener('pointercancel', () => dragging = false);

// zoom control
zoomRange.addEventListener('input', (ev) => {
  const newScale = Number(ev.target.value) / 100;
  // keep viewport center stable
  const vw = cropViewport.clientWidth;
  const vh = cropViewport.clientHeight;
  const centerX = (vw/2 - tx) / scale;
  const centerY = (vh/2 - ty) / scale;
  scale = newScale;
  tx = vw/2 - centerX * scale;
  ty = vh/2 - centerY * scale;
  updateImageTransform();
});

// apply crop
applyCropBtn.addEventListener('click', () => {
  try {
    const vw = cropViewport.clientWidth;
    const vh = cropViewport.clientHeight;
    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');

    // fill background with selected color
    const bg = backgroundSelect.value || '#ffffff';
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // convert displayed transform to source rectangle
    const sx = clamp(( -tx ) / scale, 0, imgNaturalW);
    const sy = clamp(( -ty ) / scale, 0, imgNaturalH);
    const sWidth = clamp(canvas.width / scale, 0, imgNaturalW - sx);
    const sHeight = clamp(canvas.height / scale, 0, imgNaturalH - sy);

    ctx.drawImage(cropImg, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    // keep PNG to preserve background color reliably
    croppedDataUrl = canvas.toDataURL('image/png');
    cropModal.style.display = 'none';
    setDisabled(false);
  } catch (err) {
    console.error('Error applying crop:', err);
    alert('An error occurred while applying the crop. See console.');
  }
});

// cancel crop
cancelCropBtn.addEventListener('click', () => {
  cropModal.style.display = 'none';
  // keep generate enabled if original image exists
  if (!originalDataUrl && !croppedDataUrl) setDisabled(true);
});

generateBtn.addEventListener('click', () => {
  const copies = Math.max(1, Math.min(60, Number(copiesInput.value) || 1));
  copiesInput.value = copies;
  const useData = croppedDataUrl || originalDataUrl;
  if (!useData) return alert('Upload and crop a photo first');
  generatePages(useData, copies);
  printBtn.disabled = false;
});

printBtn.addEventListener('click', () => window.print());

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function updateImageTransform(){
  cropImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function mmToNumber(mm){
  if (typeof mm === 'number') return mm;
  return parseFloat(mm.replace('mm',''));
}

function generatePages(dataUrl, copies){
  try {
    const pageW = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--page-w'));
    const pageH = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--page-h'));
    const margin = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--page-margin'));
    const photoW = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--photo-w'));
    const photoH = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--photo-h'));
    const gap = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--photo-gap'));

    // debug logging
    console.log('Layout params (mm):', {pageW, pageH, margin, photoW, photoH, gap});

    const availW = pageW - margin*2;
    const availH = pageH - margin*2;

    const cols = Math.max(1, Math.floor( (availW + gap) / (photoW + gap) ));
    const rows = Math.max(1, Math.floor( (availH + gap) / (photoH + gap) ));
    const perPage = cols * rows;

    console.log('Computed grid:', {availW, availH, cols, rows, perPage});

    previewArea.innerHTML = '';
    let remaining = copies;
    const bg = backgroundSelect.value || '#ffffff';

    while (remaining > 0) {
      const onThisPage = Math.min(remaining, perPage);
      const page = document.createElement('div');
      page.className = 'page';

      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.style.gap = `${gap}mm`;

      for (let i = 0; i < onThisPage; i++){
        const slot = document.createElement('div');
        slot.className = 'photo-slot';
        slot.style.width = `${photoW}mm`;
        slot.style.height = `${photoH}mm`;
        slot.style.background = bg;

        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'passport photo';

        slot.appendChild(img);
        grid.appendChild(slot);
      }

      page.appendChild(grid);
      previewArea.appendChild(page);
      remaining -= onThisPage;
    }

    const info = document.createElement('div');
    info.className = 'layout-info';
    info.style.marginTop = '8px';
    info.textContent = `Generated ${copies} copies across ${Math.ceil(copies / perPage)} page(s). Each page: ${cols}×${rows} grid, ${perPage} per page.`;
    previewArea.appendChild(info);
  } catch (err) {
    console.error('Error generating pages:', err);
    alert('An error occurred while generating the pages. See console.');
  }
}
