import SInfo from 'react-native-sensitive-info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_SPEECH_CONTROLLER } from '@env';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';

const GetSpeechRate = async () => {
    try {
        await SInfo.getItem(SECURE_STORAGE_SPEECH_CONTROLLER, {
            sharedPreferencesName: SECURE_STORAGE_NAME,
            keychainService: SECURE_STORAGE_NAME,
        })?.then(async res => {
            if (res) {
                const speech_rate = JSON.parse(res);
                SpeechControllerStore.set_rate_pitch({
                    rate: speech_rate?.rate,
                });
            } else {
                SpeechControllerStore.set_rate_pitch({
                    rate: 85,
                });
            }
        });
    } catch (error) {
        SpeechControllerStore.set_rate_pitch({
            rate: 85,
        });
    }
};

export { GetSpeechRate };
