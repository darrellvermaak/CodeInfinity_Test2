const FIRST_NAMES: string[] = ['Michael', 'Sarah', 'David', 'Emma', 'James', 'Mary Anne', 'Daniel', 'Olivia', 'Jean-Luc', 'Sophia', 'John', 'Emily', 'Maria', 'Liam', 'Anna Maria', 'Grace', 'Christopher', 'Chloe', 'Juan Carlos', 'Anna Maria Teresa'];
const LAST_NAMES: string[] = ['Mthembu', 'Naidoo' ,'van der Merwe', 'Dlamini', 'Botha', 'Nkosi', 'Petersen', 'Khumalo', 'Adams', 'de Villiers', 'Ndlovu', 'Jacobs', 'Mokoena', 'Williams', 'Sithole', 'Steyn', 'Zulu', 'Coetzee', 'Pillay', 'Mahlangu'];

export class CSVFileGeneration {
    public GenerateCSVData(rowCount: number): string {
        let csvContent = 'Id,Name,Surname,Initials,Age,DateOfBirth\n';
        const SET_OF_PEOPLE = new Set<string>();
        
        let id = 1;
        while (SET_OF_PEOPLE.size < rowCount) {
            const FIRST_NAME = this.getRandomElement(FIRST_NAMES);
            const LAST_NAME = this.getRandomElement(LAST_NAMES);
            const IINITIALS = FIRST_NAME!.split(' ').map(n => n.charAt(0).toUpperCase()).join('');
            const AGE_YEARS = Math.floor(Math.random() * 63) + 18;
            const AGE_DAYS = Math.floor(Math.random() * 365);
            const DATE_OF_BIRTH = new Date();
            DATE_OF_BIRTH.setFullYear(DATE_OF_BIRTH.getFullYear() - AGE_YEARS);
            DATE_OF_BIRTH.setDate(DATE_OF_BIRTH.getDate() - AGE_DAYS);
            const DATE_OF_BIRTH_STR = this.formatDate(DATE_OF_BIRTH);
            
            const PERSON_KEY = `${FIRST_NAME}|${LAST_NAME}|${IINITIALS}|${AGE_YEARS}|${DATE_OF_BIRTH_STR}`;
            if (!SET_OF_PEOPLE.has(PERSON_KEY)) {
                SET_OF_PEOPLE.add(PERSON_KEY);
                csvContent += `${id.toString()},${FIRST_NAME},${LAST_NAME},${IINITIALS},${AGE_YEARS},${DATE_OF_BIRTH_STR}\n`;
                id++;
            }
        }

        console.log(`Generated ${SET_OF_PEOPLE.size} unique rows of CSV data.`);
        return csvContent;
    }

    private getRandomElement(arr: string[]): string {
        return arr[Math.floor(Math.random() * arr.length)] ?? '';
    }

    private formatDate(dateOfBirth: Date): string {
        const DATE_OF_BIRTH_STR = dateOfBirth.toISOString().split('T')[0] ?? '';
        const [YEAR, MONTH, DAY] = DATE_OF_BIRTH_STR.split('-');
        return `${DAY}/${MONTH}/${YEAR}`;
    }
}