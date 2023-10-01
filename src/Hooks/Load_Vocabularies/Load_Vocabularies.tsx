import { SECURE_STORAGE_NAME, SECURE_STORAGE_VOCABULARY_DATA } from '@env';
import SInfo from 'react-native-sensitive-info';
import { INTF_Glossary } from '../../Interface/Glossary/Glossary';
import { VocabularyInfoStore } from '../../MobX/Vocabulary_Info/Vocabulary_Info';

const LoadVocabularies = async () => {
    try {
        await SInfo.getItem(SECURE_STORAGE_VOCABULARY_DATA, {
            sharedPreferencesName: SECURE_STORAGE_NAME,
            keychainService: SECURE_STORAGE_NAME,
        })?.then(async res => {
            if (res) {
                const voc_info: INTF_Glossary[] = JSON.parse(res);
                if (voc_info?.length > 0) {
                    VocabularyInfoStore.set_vocabularies({
                        data: voc_info,
                    });
                }
            }
        });
    } catch (error) {}
};

export { LoadVocabularies };
