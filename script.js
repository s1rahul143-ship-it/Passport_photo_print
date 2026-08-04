// script.js — handles upload, layout generation, and printing

const photoInput = document.getElementById('photoInput');
const copiesInput = document.getElementById('copiesInput');
const generateBtn = document.getElementById('generateBtn');
const printBtn = document.getElementById('printBtn');
const previewArea = document.getElementById('previewArea');

let photoDataUrl = null;

photoInput.addEventListener('change', () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return setDisabled(true);
  if (!/image\/(jpeg|png)/.test(file.type)) return alert('Please upload a JPG or PNG image');

  const reader = new FileReader();
  reader.onload = (e) => {
    photoDataUrl = e.target.result;
    setDisabled(false);
  };
  reader.readAsDataURL(file);
});

function setDisabled(disabled){
  generateBtn.disabled = disabled;
  printBtn.disabled = disabled;
}

generateBtn.addEventListener('click', () => {
  const copies = Math.max(1, Math.min(60, Number(copiesInput.value) || 1));
  copiesInput.value = copies;
  if (!photoDataUrl) return alert('Upload a photo first');
  generatePages(photoDataUrl, copies);
  printBtn.disabled = false;
});

printBtn.addEventListener('click', () => {
  window.print();
});

function mmToNumber(mm){
  // "35mm" -> 35 numeric if mm passed as number already, return number
  if (typeof mm === 'number') return mm;
  return parseFloat(mm.replace('mm',''));
}

function generatePages(dataUrl, copies){
  // Page config from CSS variables (same units)
  const pageW = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--page-w'));
  const pageH = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--page-h'));
  const margin = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--page-margin'));
  const photoW = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--photo-w'));
  const photoH = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--photo-h'));
  const gap = mmToNumber(getComputedStyle(document.documentElement).getPropertyValue('--photo-gap'));

  // Available content area
  const availW = pageW - margin*2;
  const availH = pageH - margin*2;

  // Compute how many columns and rows fit using simple packing
  const cols = Math.max(1, Math.floor( (availW + gap) / (photoW + gap) ));
  const rows = Math.max(1, Math.floor( (availH + gap) / (photoH + gap) ));
  const perPage = cols * rows;

  // Clear preview
  previewArea.innerHTML = '';

  let remaining = copies;
  while (remaining > 0) {
    const onThisPage = Math.min(remaining, perPage);
    const page = document.createElement('div');
    page.className = 'page';

    const grid = document.createElement('div');
    grid.className = 'grid';
    // set computed gap as inline style to ensure it matches measurement
    grid.style.gap = `${gap}mm`;

    // Create slots
    for (let i = 0; i < onThisPage; i++){
      const slot = document.createElement('div');
      slot.className = 'photo-slot';
      slot.style.width = `${photoW}mm`;
      slot.style.height = `${photoH}mm`;

      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = 'passport photo';

      slot.appendChild(img);
      grid.appendChild(slot);
    }

    // If last row not full, we still keep spacing consistent — remaining slots are simply not created
    page.appendChild(grid);
    previewArea.appendChild(page);

    remaining -= onThisPage;
  }

  // Add a short message about layout (onscreen helpfulness)
  const info = document.createElement('div');
  info.className = 'layout-info';
  info.style.marginTop = '8px';
  info.textContent = `Generated ${copies} copies across ${Math.ceil(copies / perPage)} page(s). Each page: ${cols}×${rows} grid, ${perPage} per page.`;
  previewArea.appendChild(info);
}
