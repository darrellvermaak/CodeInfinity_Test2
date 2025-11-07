import { CSVGenerator } from './generate-csv.js';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const GENERATE_BTN = document.getElementById('generateBtn');
  const STATUS = document.getElementById('status');
  const INPUT = document.getElementById('generateQuantity');
  const FILE_INPUT = document.getElementById('csv_file_to_upload');
  const FILE_NAME_SPAN = document.getElementById('fileName');
  const UPLOAD_FORM = document.getElementById('uploadForm');
  const UPLOAD_STATUS = document.getElementById('uploadStatus');
  const UPLOAD_BTN = document.getElementById('uploadBtn');
  const GENERATOR = new CSVGenerator();
  const WORKER = new Worker('./csv-worker.js', { type: 'module' });

  let quantityToGenerate = 1000000;

  // Sync button text & validate input
  const UPDATE_BUTTON = () => {
    let raw = INPUT.value.trim();
    let val = parseInt(raw, 10);

    // ----  ENFORCE MAX 5,000,000  ----
    if (isNaN(val) || val < 1) {
      GENERATE_BTN.disabled = true;
      GENERATE_BTN.textContent = 'Enter a number ≥ 1';
      return;
    }

    if (val > 5_000_000) {
      val = 5_000_000;
      INPUT.value = val.toString();
      STATUS.textContent = 'Maximum allowed: 5,000,000 rows';
      setTimeout(() => { STATUS.textContent = ''; }, 3000);
    }

    quantityToGenerate = val;
    GENERATE_BTN.disabled = false;
    GENERATE_BTN.textContent = `Generate & Save ${val.toLocaleString()} Rows`;
  };

  INPUT.addEventListener('input', UPDATE_BUTTON);
  UPDATE_BUTTON(); // Initial

  FILE_INPUT.addEventListener('change', () => {
    FILE_NAME_SPAN.textContent = FILE_INPUT.files[0]?.name || 'Choose CSV file...';
  });

  WORKER.onmessage = async (event) => {
    const CSV = event.data.csv;

    const SAVED = await GENERATOR.saveWithPicker(CSV);
    console.log('Saved with picker:', SAVED);

    if (SAVED) {
      STATUS.textContent = 'File saved!';
      STATUS.style.color = '#27ae60';
    } else {
      GENERATOR.downloadCSV(CSV);
      STATUS.textContent = 'Download started!';
      STATUS.style.color = '#3498db';
    }

    GENERATE_BTN.disabled = false;

    // Auto-clear after 4 seconds
    STATUS.textContent = '';
    STATUS.style.color = '';

  }

  GENERATE_BTN.addEventListener('click', async () => {
    GENERATE_BTN.disabled = true;
    STATUS.textContent = `Generating ${quantityToGenerate.toLocaleString()} rows...`;
    STATUS.style.color = '#e67e22';

    try {
      WORKER.postMessage({ count: quantityToGenerate })
      // const CSV = GENERATOR.generateCSV(quantityToGenerate);

      // const SAVED = await GENERATOR.saveWithPicker(CSV);
      // console.log('Saved with picker:', SAVED);

      // if (SAVED) {
      //   STATUS.textContent = 'File saved!';
      //   STATUS.style.color = '#27ae60';
      // } else {
      //   GENERATOR.downloadCSV(CSV);
      //   STATUS.textContent = 'Download started!';
      //   STATUS.style.color = '#3498db';
      // }

      // // Auto-clear after 4 seconds
      // setTimeout(() => {
      //   STATUS.textContent = '';
      //   STATUS.style.color = '';
      // }, 4000);

    } catch (err) {
      console.error('Generation error:', err);
      STATUS.textContent = 'Error generating file';
      STATUS.style.color = '#e74c3c';
    } finally {
      // GENERATE_BTN.disabled = false;
    }
  });

  // Upload CSV
  UPLOAD_FORM.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!FILE_INPUT.files[0]) return;

    UPLOAD_BTN.disabled = true;
    UPLOAD_STATUS.textContent = 'Uploading...';

    const FORM_DATA = new FormData();
    FORM_DATA.append('csv_file_to_upload', FILE_INPUT.files[0]);

    try {
      const RES = await fetch('/submit', {
        method: 'POST',
        body: FORM_DATA
      });

      const TEXT = await RES.text();
      if (RES.ok) {
        UPLOAD_STATUS.textContent = 'Upload successful!';
        UPLOAD_STATUS.style.color = '#27ae60';
      } else {
        UPLOAD_STATUS.textContent = `Upload failed: ${TEXT}`;
        UPLOAD_STATUS.style.color = '#e74c3c';
      }
    } catch (err) {
      UPLOAD_STATUS.textContent = 'Network error';
      UPLOAD_STATUS.style.color = '#e74c3c';
      console.error(err);
    } finally {
      UPLOAD_BTN.disabled = false;
      setTimeout(() => {
        UPLOAD_STATUS.textContent = '';
        UPLOAD_STATUS.style.color = '';
      }, 5000);
    }
  });
});