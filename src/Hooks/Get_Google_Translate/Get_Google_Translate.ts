import Axios from 'axios';
import { GOOGLE_TRANSLATE_LINK } from '@env';
import { AdminStore } from '../../MobX/Admin/Admin';

const googleCloudKey = AdminStore.admin_data?.google_cloud_key || '';

const getGoogleTranslate = async ({
    words,
    target_lang,
}: {
    words: string[];
    target_lang: string;
}): Promise<any[]> => {
    if (!target_lang) {
        return [];
    } else {
        if (target_lang === 'en') {
            return [];
        } else {
            try {
                const response = await Axios.post(
                    `${GOOGLE_TRANSLATE_LINK}${googleCloudKey}`,
                    {
                        q: words,
                        source: 'en',
                        target: target_lang,
                        format: 'text',
                    },
                );

                const translations = response?.data?.data?.translations;

                if (!translations) {
                    return [];
                }

                const translatedArray = translations.map(
                    (item: any) => item.translatedText,
                );
                return translatedArray;
            } catch (error) {
                return [];
            }
        }
    }
};

export { getGoogleTranslate };
