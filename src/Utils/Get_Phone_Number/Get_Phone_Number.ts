import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const get_phone_number = ({
    phone,
}: {
    phone: string;
}): {
    country: string;
    phone: string;
} => {
    const parsedNumber = parsePhoneNumberFromString(phone);

    if (parsedNumber) {
        return {
            country: parsedNumber.country as string,
            phone: parsedNumber.nationalNumber.toString(),
        };
    }
    return {
        country: '',
        phone: '',
    };
};
