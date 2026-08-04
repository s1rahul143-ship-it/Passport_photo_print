// script.js — simple upload, layout generation, and printing (pre-crop version)

const photoInput = document.getElementById('photoInput');
const copiesInput = document.getElementById('copiesInput');
const generateBtn = document.getElementById('generateBtn');
const printBtn = document.getElementById('printBtn');
const previewArea = document.getElementById('previewArea');

let photoDataUrl = null;

function setDisabled(disabled){
  if (generateBtn) generateBtn.disabled = disabled;
  if (printBtn) printBtn.disabled = disabled;
}

setDisabled(true);

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

printBtn.addEventListener('click', () => window.print());

function mmToNumber(mm, fallback = 0){
  if (typeof mm === 'number') return mm;
  if (!mm) return fallback;
  const v = String(mm).replace('mm','').trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function readLayoutVars(){
  // fallback defaults
  const pageW = getComputedStyle(document.documentElement).getPropertyValue('--page-w') || '210mm';
  const pageH = getComputedStyle(document.documentElement).getPropertyValue('--page-h') || '297mm';
  const margin = getComputedStyle(document.documentElement).getPropertyValue('--page-margin') || '8mm';
  const photoW = getComputedStyle(document.documentElement).getPropertyValue('--photo-w') || '27mm';
  const photoH = getComputedStyle(document.documentElement).getPropertyValue('--photo-h') || '35mm';
  const gap = getComputedStyle(document.documentElement).getPropertyValue('--photo-gap') || '1mm';

  return {
    pageW: mmToNumber(pageW, 210),
    pageH: mmToNumber(pageH, 297),
    margin: mmToNumber(margin, 8),
    photoW: mmToNumber(photoW, 27),
    photoH: mmToNumber(photoH, 35),
    gap: mmToNumber(gap, 1)
  };
}

generateBtn.addEventListener('click', () => {
  const copies = Math.max(1, Math.min(60, Number(copiesInput.value) || 1));
  copiesInput.value = copies;
  if (!photoDataUrl) return alert('Upload a photo first');

  const vars = readLayoutVars();
  console.log('Layout vars:', vars);

  const availW = vars.pageW - vars.margin * 2;
  const availH = vars.pageH - vars.margin * 2;
  const cols = Math.max(1, Math.floor((availW + vars.gap) / (vars.photoW + vars.gap)));
  const rows = Math.max(1, Math.floor((availH + vars.gap) / (vars.photoH + vars.gap)));
  const perPage = cols * rows;
  console.log({availW,availH,cols,rows,perPage});

  previewArea.innerHTML = '';
  let remaining = copies;

  while (remaining > 0) {
    const onThisPage = Math.min(remaining, perPage);
    const page = document.createElement('div');
    page.className = 'page';

    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.style.gap = `${vars.gap}mm`;

    for (let i = 0; i < onThisPage; i++){
      const slot = document.createElement('div');
      slot.className = 'photo-slot';
      slot.style.width = `${vars.photoW}mm`;
      slot.style.height = `${vars.photoH}mm`;

      const img = document.createElement('img');
      img.src = photoDataUrl;
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
  info.textContent = `Generated ${copies} copies across ${Math.ceil(copies / Math.max(1,perPage))} page(s). Each page: ${cols}×${rows} grid, ${perPage} per page.`;
  previewArea.appendChild(info);

  setDisabled(false);
});
