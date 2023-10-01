import SInfo from 'react-native-sensitive-info';
import { SECURE_STORAGE_INIT_INTEREST, SECURE_STORAGE_NAME } from '@env';
import { InitInterestStore } from '../../MobX/Init_Interest/Init_Interest';

const LoadInitInterest = async () => {
    try {
        await SInfo.getItem(SECURE_STORAGE_INIT_INTEREST, {
            sharedPreferencesName: SECURE_STORAGE_NAME,
            keychainService: SECURE_STORAGE_NAME,
        })?.then(async res => {
            if (res) {
                const init = JSON.parse(res);
                InitInterestStore.set_inital_used({
                    used: init?.used,
                    save: false,
                });
            }
        });
    } catch (error) {}
};

export { LoadInitInterest };
