import { action, makeObservable, observable } from 'mobx';
import SInfo from 'react-native-sensitive-info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_INIT_INTEREST } from '@env';

const save_initial_used = async ({ used }: { used: boolean }) => {
    try {
        await SInfo.setItem(
            SECURE_STORAGE_INIT_INTEREST,
            JSON.stringify({ used: used }),
            {
                sharedPreferencesName: SECURE_STORAGE_NAME,
                keychainService: SECURE_STORAGE_NAME,
            },
        );
    } catch (error) {}
};

class InitInterestClass {
    initial_used: boolean = false;

    constructor() {
        makeObservable(this, {
            initial_used: observable,
            set_inital_used: action,
        });
    }

    set_inital_used = ({ used, save }: { used: boolean; save: boolean }) => {
        this.initial_used = used;
        if (save) {
            save_initial_used({ used: used });
        }
    };
}

export const InitInterestStore = new InitInterestClass();
