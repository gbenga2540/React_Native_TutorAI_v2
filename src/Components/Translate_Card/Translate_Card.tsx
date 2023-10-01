import React, { FunctionComponent, useEffect, useState } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import { INTF_Glossary } from '../../Interface/Glossary/Glossary';
import BasicText from '../Basic_Text/Basic_Text';
import TranscribeIcon from '../../Images/SVGs/Transcribe_Icon.svg';
import TextDivider from '../Text_Divider/Text_Divider';
import TextButton from '../Text_Button/Text_Button';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { TranslateStore } from '../../MobX/Translate/Translate';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { observer } from 'mobx-react';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { SECURE_STORAGE_GLOSSARY, SECURE_STORAGE_NAME } from '@env';
import SInfo from 'react-native-sensitive-info';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { getGoogleTranslate } from '../../Hooks/Get_Google_Translate/Get_Google_Translate';
import { VocabularyInfoStore } from '../../MobX/Vocabulary_Info/Vocabulary_Info';

const TranslateCard: FunctionComponent = observer(() => {
    const search = TranslateStore.t_word || '';

    const UserInfo = UserInfoStore.user_info || {};
    const GPT_PROMPT = `You are a given a __WORD__ = “${search}”\nAct as an Oxford Dictionary:\n\nlet data_1 = __WORD__\nlet data_2 = Replace with the Meaning of the __WORD__ in English\nlet data_3 = Replace with one Example of the usage of the word __WORD__\nlet data_4 = Replace with the Translation of the __WORD__ in ${UserInfo.language}\n\nreturn your result in this format:\n%w0% data_1 %w0% \n%m0% data_2 %m0% \n%e0% data_3 %e0% \n%t0% data_4 %t0%`;

    const [tState, setTState] = useState<string>('Translating...');
    const [wordInfo, setWordInfo] = useState<INTF_Glossary>({
        word: '',
        meaning: '',
        example: '',
        translation: '',
    });

    const transform_data_3 = ({ data }: { data: string }) => {
        const lines = data
            .trim()
            .split('\n')
            .map(line => line.trim());

        if (lines.length !== 4) {
            setTState('An error occured!');
            return;
        }

        return {
            word: lines[0].replace('%w0%', '').trim(),
            meaning: lines[1].replace('%m0%', '').trim(),
            example: lines[2].replace('%e0%', '').trim(),
            translation:
                lines[3].replace('%t0%', '').trim() ||
                'Translation not available',
        };
    };

    const transform_data_2 = ({ data }: { data: string }) => {
        const regex =
            /%w0%(.*?)%w0%\n%m0%(.*?)%m0%\n%e0%(.*?)%e0%\n%t0%(.*?)%t0%/;

        const matches = data.match(regex);

        if (!matches) {
            transform_data_3({ data: data });
        } else {
            return {
                word: matches[1],
                meaning: matches[2],
                example: matches[3],
                translation: matches[4] || 'Translation not available',
            };
        }
    };

    const transform_data = ({ data }: { data: string }) => {
        const regex =
            /%w0% (.*?) %w0%\s*%m0% (.*?) %m0%\s*%e0% (.*?) %e0%\s*%t0% (.*?) %t0%/;
        const matches = data.match(regex);

        if (!matches) {
            transform_data_2({ data: data });
        } else {
            return {
                word: matches[1],
                meaning: matches[2],
                example: matches[3],
                translation: matches[4] || 'Translation not available',
            };
        }
    };

    const transcribe_text = no_double_clicks({
        execFunc: () => {
            TextToSpeechStore.clear_speech();
            TextToSpeechStore.play_speech({
                speech: search,
                isMale: AvatarVoiceStore.is_avatar_male,
                femaleVoice: AvatarVoiceStore.avatar_female_voice,
                maleVoice: AvatarVoiceStore.avatar_male_voice,
                speechRate: SpeechControllerStore.rate,
            });
        },
    });

    const update_glossary = ({
        glossary,
        all_glossary,
    }: {
        glossary: INTF_Glossary[];
        all_glossary: INTF_Glossary[];
    }): INTF_Glossary[] => {
        const updated_glossary: INTF_Glossary[] = [...all_glossary];

        for (const obj of glossary) {
            const index = all_glossary.findIndex(
                item => item.word?.toLowerCase() === obj.word?.toLowerCase(),
            );
            if (index !== -1) {
                updated_glossary[index] = obj;
            } else {
                updated_glossary.push(obj);
            }
        }
        return updated_glossary;
    };

    const save_glossary_data = async ({
        s_g_data,
    }: {
        s_g_data: INTF_Glossary[];
    }) => {
        try {
            await SInfo.setItem(
                SECURE_STORAGE_GLOSSARY,
                JSON.stringify([...s_g_data]),
                {
                    sharedPreferencesName: SECURE_STORAGE_NAME,
                    keychainService: SECURE_STORAGE_NAME,
                },
            );
        } catch (error) {}
    };

    const save_glossary = async ({ data }: { data: INTF_Glossary[] }) => {
        try {
            await SInfo.getItem(SECURE_STORAGE_GLOSSARY, {
                sharedPreferencesName: SECURE_STORAGE_NAME,
                keychainService: SECURE_STORAGE_NAME,
            })
                .catch(() => {
                    save_glossary_data({ s_g_data: [...data] });
                })
                .then(async res => {
                    if (res) {
                        const json_res: INTF_Glossary[] = JSON.parse(res);
                        if (json_res?.length > 0) {
                            const new_glossary = update_glossary({
                                glossary: data,
                                all_glossary: json_res,
                            });
                            save_glossary_data({ s_g_data: [...new_glossary] });
                        } else {
                            save_glossary_data({ s_g_data: [...data] });
                        }
                    } else {
                        save_glossary_data({ s_g_data: [...data] });
                    }
                });
        } catch (error) {
            save_glossary_data({ s_g_data: [...data] });
        }
    };

    const { mutate: gpt_req_mutate } = useMutation(gpt_request, {
        onMutate: () => {
            setTState('Translating...');
        },
        onSettled: async data => {
            if (data?.error) {
                setTState('An error occured!');
            } else {
                setTState('Completed!');
                const gpt_res: string = data?.data?.chat_res;
                try {
                    const converted_data = transform_data({ data: gpt_res });
                    if (converted_data?.meaning) {
                        const gTranslate = await getGoogleTranslate({
                            words: [converted_data?.word],
                            target_lang:
                                (
                                    UserInfoStore?.user_info?.language as string
                                )?.split(' - ')?.[1] || '',
                        });
                        if (gTranslate?.length > 0) {
                            setWordInfo({
                                ...converted_data,
                                translation: gTranslate?.[0] || '',
                            });
                            save_glossary({
                                data: [
                                    {
                                        ...converted_data,
                                        translation: gTranslate?.[0] || '',
                                    },
                                ],
                            });
                            VocabularyInfoStore.add_vocabulary({
                                v_data: [
                                    {
                                        ...converted_data,
                                        translation: gTranslate?.[0] || '',
                                    },
                                ],
                            });
                        } else {
                            setWordInfo(converted_data);
                            save_glossary({ data: [{ ...converted_data }] });
                            VocabularyInfoStore.add_vocabulary({
                                v_data: [{ ...converted_data }],
                            });
                        }
                    } else {
                        setTState('An error occured!');
                    }
                } catch (err) {
                    setTState('An error occured!');
                }
            }
        },
    });

    const close_translate = no_double_clicks({
        execFunc: () => {
            TranslateStore.clear_translate();
        },
    });

    const regenerate_voc = no_double_clicks({
        execFunc: () => {
            setWordInfo({
                word: '',
                meaning: '',
                example: '',
                translation: '',
            });
            if (search) {
                gpt_req_mutate({
                    messages: [
                        {
                            role: 'user',
                            content: GPT_PROMPT,
                        },
                    ],
                });
            }
        },
    });

    useEffect(() => {
        setWordInfo({
            word: '',
            meaning: '',
            example: '',
            translation: '',
        });
        if (search) {
            gpt_req_mutate({
                messages: [{ role: 'user', content: GPT_PROMPT }],
            });
        }
    }, [GPT_PROMPT, gpt_req_mutate, search]);

    const transformValue = useSharedValue(200);
    const opacityValue = useSharedValue(0);
    const modalStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: transformValue.value }],
            opacity: opacityValue.value,
        };
    });

    useEffect(() => {
        transformValue.value = withTiming(0, {
            duration: 200,
        });
        opacityValue.value = withTiming(1, {
            duration: 200,
        });
    }, [transformValue, opacityValue]);

    if (TranslateStore.t_show || false) {
        return (
            <View
                style={{
                    flex: 1,
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    zIndex: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    justifyContent: 'flex-end',
                }}>
                <Animated.View
                    style={[
                        {
                            backgroundColor: Colors.White,
                            borderRadius: 13,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            minHeight:
                                Platform.OS === 'ios'
                                    ? screen_height_less_than({
                                          if_false: 180,
                                          if_true: 160,
                                      })
                                    : screen_height_less_than({
                                          if_false: 140,
                                          if_true: 130,
                                      }),
                            transform: [{ translateY: 200 }],
                        },
                        modalStyle,
                    ]}>
                    <TextButton
                        buttonText="Close"
                        marginLeft={'auto'}
                        marginRight={16}
                        marginTop={13}
                        execFunc={close_translate}
                        textColor={Colors.Red}
                    />
                    {wordInfo?.word &&
                    wordInfo?.example &&
                    wordInfo?.meaning &&
                    wordInfo?.translation ? (
                        <View
                            style={{
                                marginHorizontal: 18,
                                marginBottom: 50,
                                marginTop: 20,
                                flex: 1,
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                <BasicText
                                    inputText={
                                        wordInfo?.word
                                            ?.slice(0, 1)
                                            ?.toUpperCase() +
                                            wordInfo?.word?.slice(1) || ''
                                    }
                                    textSize={19}
                                    textWeight={600}
                                />
                                <TouchableOpacity
                                    style={{ marginLeft: 'auto' }}
                                    activeOpacity={0.5}
                                    onPress={transcribe_text}>
                                    <TranscribeIcon width={30} height={30} />
                                </TouchableOpacity>
                            </View>
                            <TextDivider singleLine marginTop={3} />
                            <View
                                style={{
                                    flexDirection: 'row',
                                }}>
                                <View style={{ flex: 1 }}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            marginTop: 7,
                                        }}>
                                        <BasicText
                                            inputText={'Translation: '}
                                            textSize={15}
                                            textWeight={600}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <BasicText
                                                inputText={
                                                    wordInfo?.translation || ''
                                                }
                                                textSize={14}
                                            />
                                        </View>
                                    </View>
                                    {/* <View
                                        style={{
                                            flexDirection: 'row',
                                            marginTop: 7,
                                        }}>
                                        <BasicText
                                            inputText={'Meaning: '}
                                            textSize={15}
                                            textWeight={600}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <BasicText
                                                inputText={
                                                    wordInfo?.meaning || ''
                                                }
                                                textSize={14}
                                            />
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            marginTop: 7,
                                        }}>
                                        <BasicText
                                            inputText={'Example: '}
                                            textSize={15}
                                            textWeight={600}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <BasicText
                                                inputText={
                                                    wordInfo?.example || ''
                                                }
                                                textSize={14}
                                            />
                                        </View>
                                    </View> */}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 30,
                            }}>
                            <BasicText inputText={tState} textSize={16} />
                            {tState === 'An error occured!' && (
                                <TextButton
                                    buttonText="Retry"
                                    marginTop={10}
                                    execFunc={regenerate_voc}
                                />
                            )}
                        </View>
                    )}
                </Animated.View>
            </View>
        );
    } else {
        return null;
    }
});

export default TranslateCard;
