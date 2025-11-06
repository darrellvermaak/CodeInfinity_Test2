class CSVGenerator {
  constructor() {
    this.FIRST_NAMES = [
      'Michael', 'Sarah', 'David', 'Emma', 'James', 'Mary Anne', 'Daniel', 'Olivia',
      'Jean-Luc', 'Sophia', 'John', 'Emily', 'Maria', 'Liam', 'Anna Maria', 'Grace',
      'Christopher', 'Chloe', 'Juan Carlos', 'Anna Maria Teresa'
    ];
    this.LAST_NAMES = [
      'Mthembu', 'Naidoo', 'van der Merwe', 'Dlamini', 'Botha', 'Nkosi', 'Petersen',
      'Khumalo', 'Adams', 'de Villiers', 'Ndlovu', 'Jacobs', 'Mokoena', 'Williams',
      'Sithole', 'Steyn', 'Zulu', 'Coetzee', 'Pillay', 'Mahlangu'
    ];
  }

  getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)] ?? '';
  }

  formatDate(date) {
    const ISO_DATE = date.toISOString().split('T')[0] ?? '';
    const [YEAR, MONTH, DAY] = ISO_DATE.split('-');
    return `${DAY}/${MONTH}/${YEAR}`;
  }

  generateCSV(rowCount) {
    let csv = 'Id,Name,Surname,Initials,Age,DateOfBirth\n';
    const SEEN = new Set();
    let id = 1;

    while (SEEN.size < rowCount) {
      const FIRST_NAME = this.getRandomElement(this.FIRST_NAMES);
      const LAST_NAME = this.getRandomElement(this.LAST_NAMES);
      const INITIALS = FIRST_NAME.split(' ').map(n => n[0].toUpperCase()).join('');
      const AGE_YEARS = Math.floor(Math.random() * 63) + 18;
      const AGE_DAYS = Math.floor(Math.random() * 365);
      const DATE_OF_BIRTH = new Date();
      DATE_OF_BIRTH.setFullYear(DATE_OF_BIRTH.getFullYear() - AGE_YEARS);
      DATE_OF_BIRTH.setDate(DATE_OF_BIRTH.getDate() - AGE_DAYS);
      const DATE_OF_BIRTH_STR = this.formatDate(DATE_OF_BIRTH);

      const KEY = `${FIRST_NAME}|${LAST_NAME}|${INITIALS}|${AGE_YEARS}|${DATE_OF_BIRTH_STR}`;
      if (!SEEN.has(KEY)) {
        SEEN.add(KEY);
        csv += `${id},${FIRST_NAME},${LAST_NAME},${INITIALS},${AGE_YEARS},${DATE_OF_BIRTH_STR}\n`;
        id++;
      }
    }

    console.log(`Generated ${SEEN.size} unique rows`);
    return csv;
  }

  downloadCSV(csvData, filename = 'generated_data.csv') {
    const BLOB = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const MY_URL = URL.createObjectURL(BLOB);
    const LINK = document.createElement('a');
    LINK.href = MY_URL;
    LINK.download = filename;
    LINK.style.display = 'none';
    document.body.appendChild(LINK);
    LINK.click();
    document.body.removeChild(LINK);
    URL.revokeObjectURL(MY_URL);
  }

  async saveWithPicker(csvData) {
    if (!('showSaveFilePicker' in window)) return false;

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'generated_data.csv',
        types: [{
          description: 'CSV Files',
          accept: { 'text/csv': ['.csv'] },
        }],
      });

      const writable = await handle.createWritable();
      await writable.write(new Blob([csvData], { type: 'text/csv;charset=utf-8' }));
      await writable.close();
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('saveWithPicker error:', err);
      }
      return false;
    }
  }
}

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
      // Auto-clamp and show a hint
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

  // File input display
  FILE_INPUT.addEventListener('change', () => {
    FILE_NAME_SPAN.textContent = FILE_INPUT.files[0]?.name || 'Choose CSV file...';
  });

  // Generate CSV - FIXED VERSION
GENERATE_BTN.addEventListener('click', async () => {
  GENERATE_BTN.disabled = true;
  STATUS.textContent = `Generating ${quantityToGenerate.toLocaleString()} rows...`;
  STATUS.style.color = '#e67e22';

  try {
    // Run generation off the main thread? Use a Worker.
    // But for now: just generate synchronously (it's fast enough for 1M)
    const CSV = GENERATOR.generateCSV(quantityToGenerate);

    // This now runs in the correct call stack
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

    // Auto-clear after 4 seconds
    setTimeout(() => {
      STATUS.textContent = '';
      STATUS.style.color = '';
    }, 4000);

    } catch (err) {
      console.error('Generation error:', err);
      STATUS.textContent = 'Error generating file';
      STATUS.style.color = '#e74c3c';
    } finally {
      GENERATE_BTN.disabled = false;
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