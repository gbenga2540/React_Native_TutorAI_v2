import { action, makeObservable, observable } from 'mobx';
import { INTF_Glossary } from '../../Interface/Glossary/Glossary';
import SInfo from 'react-native-sensitive-info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_VOCABULARY_DATA } from '@env';

class VocabularyInfoClass {
    vocabularies: INTF_Glossary[] = [];

    constructor() {
        makeObservable(this, {
            vocabularies: observable,
            set_vocabularies: action,
            add_vocabulary: action,
            clear_vocabularies: action,
            delete_vocabularies: action,
        });
    }

    set_vocabularies = ({ data }: { data: INTF_Glossary[] }) => {
        this.vocabularies = data;
    };

    clear_vocabularies = async () => {
        this.vocabularies = [];
    };

    delete_vocabularies = async () => {
        this.vocabularies = [];
        try {
            await SInfo.deleteItem(SECURE_STORAGE_VOCABULARY_DATA, {
                sharedPreferencesName: SECURE_STORAGE_NAME,
                keychainService: SECURE_STORAGE_NAME,
            });
        } catch (error) {}
    };

    add_vocabulary = ({ v_data }: { v_data: INTF_Glossary[] }) => {
        const update_vocabularies = ({
            voc,
            all_voc,
        }: {
            voc: INTF_Glossary[];
            all_voc: INTF_Glossary[];
        }): INTF_Glossary[] => {
            const updated_glossary: INTF_Glossary[] = [...all_voc];

            for (const obj of voc) {
                const index = all_voc.findIndex(
                    item =>
                        item.word?.toLowerCase() === obj.word?.toLowerCase(),
                );
                if (index !== -1) {
                    updated_glossary[index] = obj;
                } else {
                    updated_glossary.push(obj);
                }
            }
            return updated_glossary;
        };

        const save_vocabulary_data = async ({
            voc_data,
        }: {
            voc_data: INTF_Glossary[];
        }) => {
            try {
                await SInfo.setItem(
                    SECURE_STORAGE_VOCABULARY_DATA,
                    JSON.stringify([...voc_data]),
                    {
                        sharedPreferencesName: SECURE_STORAGE_NAME,
                        keychainService: SECURE_STORAGE_NAME,
                    },
                );
            } catch (error) {}
        };

        const save_vocabulary = async ({ data }: { data: INTF_Glossary[] }) => {
            try {
                await SInfo.getItem(SECURE_STORAGE_VOCABULARY_DATA, {
                    sharedPreferencesName: SECURE_STORAGE_NAME,
                    keychainService: SECURE_STORAGE_NAME,
                })
                    .catch(() => {
                        save_vocabulary_data({ voc_data: [...data] });
                    })
                    .then(async res => {
                        if (res) {
                            const json_res: INTF_Glossary[] = JSON.parse(res);
                            if (json_res?.length > 0) {
                                const new_glossary = update_vocabularies({
                                    voc: data,
                                    all_voc: json_res,
                                });
                                save_vocabulary_data({
                                    voc_data: [...new_glossary],
                                });
                            } else {
                                save_vocabulary_data({ voc_data: [...data] });
                            }
                        } else {
                            save_vocabulary_data({ voc_data: [...data] });
                        }
                    });
            } catch (error) {
                save_vocabulary_data({ voc_data: [...data] });
            }
        };

        this.vocabularies = [...this.vocabularies, { ...v_data?.[0] }];
        save_vocabulary({ data: v_data });
    };
}

export const VocabularyInfoStore = new VocabularyInfoClass();
