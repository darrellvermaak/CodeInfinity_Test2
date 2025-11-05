

const firstNames: string[] = ['Michael', 'Sarah', 'David', 'Emma', 'James', 'Mary Anne', 'Daniel', 'Olivia', 'Jean-Luc', 'Sophia', 'John', 'Emily', 'Maria', 'Liam', 'Anna Maria', 'Grace', 'Christopher', 'Chloe', 'Juan Carlos', 'Anna Maria Teresa'];
const lastNames: string[] = ['Mthembu', 'Naidoo' ,'van der Merwe', 'Dlamini', 'Botha', 'Nkosi', 'Petersen', 'Khumalo', 'Adams', 'de Villiers', 'Ndlovu', 'Jacobs', 'Mokoena', 'Williams', 'Sithole', 'Steyn', 'Zulu', 'Coetzee', 'Pillay', 'Mahlangu'];

export class CSVFileGeneration {
    public GenerateCSVData(rowCount: number): string {
        let csvContent = 'Id,Name,Surname,Initials,Age,DateOfBirth\n';
        const SET_OF_PEOPLE = new Set<string>();
        
        let id = 1;
        while (SET_OF_PEOPLE.size < rowCount) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const initials = firstName!.split(' ').map(n => n.charAt(0).toUpperCase()).join('');
            const ageYears = Math.floor(Math.random() * 63) + 18;
            const ageDays = Math.floor(Math.random() * 365);
            const dateOfBirth = new Date();
            dateOfBirth.setFullYear(dateOfBirth.getFullYear() - ageYears);
            dateOfBirth.setDate(dateOfBirth.getDate() - ageDays);
            let dateOfBirthStr = dateOfBirth.toISOString().split('T')[0];
            dateOfBirthStr = `${dateOfBirthStr?.substring(8, 10)}/${dateOfBirthStr?.substring(5, 7)}/${dateOfBirthStr?.substring(0, 4)}`;
            
            const personKey = `${firstName}|${lastName}|${initials}|${ageYears}|${dateOfBirthStr}`;
            if (!SET_OF_PEOPLE.has(personKey)) {
                SET_OF_PEOPLE.add(personKey);
                csvContent += `${id.toString()},${firstName},${lastName},${initials},${ageYears},${dateOfBirthStr}\n`;
                id++;
            }
        }

        console.log(`Generated ${SET_OF_PEOPLE.size} unique rows of CSV data.`);
        return csvContent;
    }
}