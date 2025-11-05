class CSVGenerator {
  constructor() {
    this.firstNames = [
      'Michael', 'Sarah', 'David', 'Emma', 'James', 'Mary Anne', 'Daniel', 'Olivia',
      'Jean-Luc', 'Sophia', 'John', 'Emily', 'Maria', 'Liam', 'Anna Maria', 'Grace',
      'Christopher', 'Chloe', 'Juan Carlos', 'Anna Maria Teresa'
    ];
    this.lastNames = [
      'Mthembu', 'Naidoo', 'van der Merwe', 'Dlamini', 'Botha', 'Nkosi', 'Petersen',
      'Khumalo', 'Adams', 'de Villiers', 'Ndlovu', 'Jacobs', 'Mokoena', 'Williams',
      'Sithole', 'Steyn', 'Zulu', 'Coetzee', 'Pillay', 'Mahlangu'
    ];
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  formatDate(date) {
    const iso = date.toISOString().split('T')[0];
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  generateCSV(rowCount) {
    let csv = 'Id,Name,Surname,Initials,Age,DateOfBirth\n';
    const seen = new Set();
    let id = 1;

    while (seen.size < rowCount) {
      const firstName = this.randomChoice(this.firstNames);
      const lastName = this.randomChoice(this.lastNames);
      const initials = firstName.split(' ').map(n => n[0].toUpperCase()).join('');
      const ageYears = Math.floor(Math.random() * 63) + 18;
      const ageDays = Math.floor(Math.random() * 365);
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - ageYears);
      dob.setDate(dob.getDate() - ageDays);
      const dateOfBirthStr = this.formatDate(dob);

      const key = `${firstName}|${lastName}|${initials}|${ageYears}|${dateOfBirthStr}`;
      if (!seen.has(key)) {
        seen.add(key);
        csv += `${id},${firstName},${lastName},${initials},${ageYears},${dateOfBirthStr}\n`;
        id++;
      }
    }

    console.log(`Generated ${seen.size} unique rows`);
    return csv;
  }

  downloadCSV(csvData, filename = 'generated_data.csv') {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async saveWithPicker(csvData) {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'output.csv',
          types: [{
            description: 'CSV Files',
            accept: { 'text/csv': ['.csv'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(csvData);
        await writable.close();
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
        return false;
      }
    }
    return false;
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const status = document.getElementById('status');
  const input = document.getElementById('generateQuantity');
  const fileInput = document.getElementById('csv_file_to_upload');
  const fileNameSpan = document.getElementById('fileName');
  const uploadForm = document.getElementById('uploadForm');
  const uploadStatus = document.getElementById('uploadStatus');
  const uploadBtn = document.getElementById('uploadBtn');
  const generator = new CSVGenerator();

  let quantityToGenerate = 1000000;

  // Sync button text & validate input
  const updateButton = () => {
    let raw = input.value.trim();
    let val = parseInt(raw, 10);

    // ----  ENFORCE MAX 5,000,000  ----
    if (isNaN(val) || val < 1) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Enter a number ≥ 1';
      return;
    }

    if (val > 5_000_000) {
      // Auto-clamp and show a hint
      val = 5_000_000;
      input.value = val.toString();
      status.textContent = 'Maximum allowed: 5,000,000 rows';
      setTimeout(() => { status.textContent = ''; }, 3000);
    }

    quantityToGenerate = val;
    generateBtn.disabled = false;
    generateBtn.textContent = `Generate & Save ${val.toLocaleString()} Rows`;
  };

  input.addEventListener('input', updateButton);
  updateButton(); // Initial

  // File input display
  fileInput.addEventListener('change', () => {
    fileNameSpan.textContent = fileInput.files[0]?.name || 'Choose CSV file...';
  });

  // Generate CSV
  generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    status.textContent = `Generating ${quantityToGenerate.toLocaleString()} rows...`;
    
    setTimeout(async () => {
      try {
        const csv = generator.generateCSV(quantityToGenerate);
        const saved = await generator.saveWithPicker(csv);
        if (!saved) generator.downloadCSV(csv);
        status.textContent = saved ? 'File saved!' : 'Download started!';
      } catch (err) {
        status.textContent = 'Error generating file';
        console.error(err);
      } finally {
        generateBtn.disabled = false;
      }
    }, 0);
  });

  // Upload CSV
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput.files[0]) return;

    uploadBtn.disabled = true;
    uploadStatus.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('csv_file_to_upload', fileInput.files[0]);

    try {
      const res = await fetch('/submit', {
        method: 'POST',
        body: formData
      });

      const text = await res.text();
      if (res.ok) {
        uploadStatus.textContent = 'Upload successful!';
        uploadStatus.style.color = '#27ae60';
      } else {
        uploadStatus.textContent = `Upload failed: ${text}`;
        uploadStatus.style.color = '#e74c3c';
      }
    } catch (err) {
      uploadStatus.textContent = 'Network error';
      uploadStatus.style.color = '#e74c3c';
      console.error(err);
    } finally {
      uploadBtn.disabled = false;
      setTimeout(() => {
        uploadStatus.textContent = '';
        uploadStatus.style.color = '';
      }, 5000);
    }
  });
});