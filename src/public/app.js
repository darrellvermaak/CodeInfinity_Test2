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
        if (err.name !== 'AbortError') {
          console.error(err);
        }
        return false;
      }
    }
    return false;
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('generateBtn');
  const status = document.getElementById('status');
  const input = document.getElementById('generateQuantity');
  const generator = new CSVGenerator();
  let quantityToGenerate = 1000000;

  input.addEventListener('input', () => {
    quantityToGenerate = parseInt(input.value, 10);
    if (isNaN(quantityToGenerate) || quantityToGenerate <= 0) {
      btn.disabled = true;
    } else {
      btn.disabled = false;
      btn.textContent = `Generate & Save ${quantityToGenerate.toLocaleString()} Rows`;
    }
  });

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    status.textContent = `Generating ${quantityToGenerate} rows... (please wait)`;
    
    // Run in background to keep UI responsive
    setTimeout(async () => {
      try {
        const csv = generator.generateCSV(quantityToGenerate);
        const saved = await generator.saveWithPicker(csv);
        if (!saved) {
          generator.downloadCSV(csv);
        }
        status.textContent = saved ? 'File saved!' : 'Download started!';
      } catch (err) {
        status.textContent = 'Error generating file';
        console.error(err);
      } finally {
        btn.disabled = false;
      }
    }, 0);
  });
});