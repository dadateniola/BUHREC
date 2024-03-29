class Methods {
    constructor(params = {}) {
        Object.assign(this, params);
        return this;
    }

    validateData() {
        const validationRules = {
            fullname: [
                /^[a-zA-Z]+(?:-[a-zA-Z]+)?(?: [a-zA-Z]+(?:-[a-zA-Z]+)?)+$/
            ],
            email: [
                /.+@.*gmail\.com$/
            ],
            password: [
                /\S+/
            ],
            card_holder_name: [
                /^[a-zA-Z]+(?:-[a-zA-Z]+)?(?: [a-zA-Z]+(?:-[a-zA-Z]+)?)+$/
            ],
            card_number: [
                /^\d{16}$/
            ],
            expiration_month: [
                /\S+/
            ],
            expiration_year: [
                /\S+/
            ],
            cvv: [
                /^\d{3}$/
            ]
            
        };

        const result = {
            invalidKeys: {},
            unknownKeys: [],
        };

        const entries = Object.entries(this);

        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];

            if (validationRules.hasOwnProperty(key)) {
                const name = key.split("_").join(" ");

                if (!value.trim().length) {
                    result.invalidKeys[key] = `${name} cannot be left empty`;
                    continue;
                }

                const isValid = validationRules[key].some(rule => rule.test(value));

                if (!isValid) result.invalidKeys[key] = `The format for ${name} is invalid`;
            } else result.unknownKeys.push(key);
        }

        return result;
    }

    // Static methods
    static generateUniqueID() {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const idLength = 8;
        const maxAttempts = 1000000; // Maximum attempts to generate a unique ID

        // Helper function to generate a random character from the specified characters
        const getRandomCharacter = () => characters[Math.floor(Math.random() * characters.length)];

        let attempts = 0;

        // Attempt to generate a unique ID
        while (attempts < maxAttempts) {
            // Generate a random ID using timestamp, random characters, and a counter
            const timestamp = Date.now().toString(36);
            const randomChars = Array.from({ length: idLength - timestamp.length }, getRandomCharacter).join('');
            const uniqueID = timestamp + randomChars;

            // Check if the generated ID matches the required regex
            if (/^[a-zA-Z0-9]{8}$/.test(uniqueID)) {
                return uniqueID;
            }

            attempts++;
        }

        // Return an error if a unique ID couldn't be generated in the specified attempts
        throw new Error('Unable to generate a unique ID within the specified attempts.');
    }

    static capitalize(str = '') {
        const words = str.split(' ');

        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));

        const capitalizedSentence = capitalizedWords.join(' ');

        return capitalizedSentence;
    }
}

module.exports = Methods;