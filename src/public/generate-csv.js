export class CSVGenerator {
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
