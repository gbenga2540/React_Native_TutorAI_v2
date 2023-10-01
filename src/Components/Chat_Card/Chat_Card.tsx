import React, { FunctionComponent, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import TutorAIIcon from '../../Images/SVGs/Tutor_AI_Icon.svg';
import TranscribeIcon from '../../Images/SVGs/Transcribe_Icon.svg';
import TranslateIcon from '../../Images/SVGs/Translate_Icon.svg';
import Colors from '../../Configs/Colors/Colors';
import { KeyboardStore } from '../../MobX/Keyboard/Keyboard';
import { observer } from 'mobx-react';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { http_link_fix } from '../../Utils/HTTP_Link_Fix/HTTP_Link_Fix';
import { INTF_ChatGPT } from '../../Interface/Chat_GPT/Chat_GPT';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import SelectableText from '../Selectable_Text/Selectable_Text';
import BasicText from '../Basic_Text/Basic_Text';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import { getGoogleTranslate } from '../../Hooks/Get_Google_Translate/Get_Google_Translate';

interface ChatCardProps {
    chat: INTF_ChatGPT;
    index: number;
    last_index: number;
    enable_ttv: boolean;
    show_t_button?: boolean;
}
const ChatCard: FunctionComponent<ChatCardProps> = observer(
    ({ chat, index, last_index, enable_ttv, show_t_button }) => {
        const [showT, setShowT] = useState<boolean>(false);
        const [translation, setTranslation] = useState<string>('');
        const [isTLoading, setIsTLoading] = useState<boolean>(false);

        const { mutate: gpt_req_mutate } = useMutation(gpt_request, {
            onMutate: () => {
                setIsTLoading(true);
            },
            onSettled: async data => {
                setIsTLoading(false);
                if (!data?.error) {
                    if (data?.data?.chat_res) {
                        setTranslation(data?.data?.chat_res);
                        setShowT(true);
                    }
                }
            },
        });

        const show_translation = no_double_clicks({
            execFunc: async () => {
                if (
                    UserInfoStore?.user_info?.language !== null &&
                    UserInfoStore?.user_info?.language !== undefined &&
                    !(UserInfoStore?.user_info?.language as string)?.includes(
                        'English',
                    )
                ) {
                    if (showT) {
                        setShowT(false);
                    } else {
                        if (translation) {
                            setShowT(true);
                        } else {
                            const gTranslate = await getGoogleTranslate({
                                words: [chat.content],
                                target_lang:
                                    (
                                        UserInfoStore?.user_info
                                            ?.language as string
                                    )?.split(' - ')?.[1] || '',
                            });
                            if (gTranslate?.length > 0) {
                                setTranslation(gTranslate?.[0] || '');
                                setShowT(true);
                            } else {
                                gpt_req_mutate({
                                    messages: [
                                        {
                                            role: 'user',
                                            content: `Translate "${chat.content}" to ${UserInfoStore?.user_info?.language}. Note: your response should only be the translated text.`,
                                        },
                                    ],
                                });
                            }
                        }
                    }
                } else {
                    setShowT(false);
                }
            },
        });

        return (
            <View
                style={{
                    marginBottom:
                        index === last_index && KeyboardStore.keyboard_active
                            ? 1
                            : 0,
                }}>
                {chat.role === 'assistant' && chat.content && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            marginBottom: 20,
                        }}>
                        <TutorAIIcon width={31} height={31} />
                        <View style={[styles.container, { minHeight: 80 }]}>
                            {enable_ttv && !chat.is_writing_text ? (
                                showT ? (
                                    <BasicText
                                        inputText={translation}
                                        textSize={16}
                                        selectable
                                    />
                                ) : (
                                    <SelectableText
                                        inputText={
                                            chat.is_writing_text
                                                ? `${
                                                      AvatarVoiceStore.avatar_female_voice ||
                                                      'Emily'
                                                  } said...`
                                                : chat?.content
                                        }
                                        textSize={16}
                                    />
                                )
                            ) : (
                                <BasicText
                                    inputText={
                                        showT
                                            ? translation
                                            : chat.is_writing_text
                                            ? `${
                                                  AvatarVoiceStore.avatar_female_voice ||
                                                  'Emily'
                                              } said...`
                                            : chat?.content
                                    }
                                    textSize={16}
                                    selectable
                                />
                            )}
                        </View>
                        <View>
                            {show_t_button &&
                                !chat.is_writing_text &&
                                !(
                                    UserInfoStore?.user_info?.language as string
                                )?.includes('English') && (
                                    <TouchableOpacity
                                        disabled={isTLoading}
                                        onPress={show_translation}
                                        activeOpacity={0.5}>
                                        <TranslateIcon width={30} height={30} />
                                    </TouchableOpacity>
                                )}
                            <TouchableOpacity
                                style={{ marginTop: 13 }}
                                onPress={no_double_clicks({
                                    execFunc: () => {
                                        TextToSpeechStore.play_speech({
                                            speech: chat?.content,
                                            isMale: AvatarVoiceStore.is_avatar_male,
                                            femaleVoice:
                                                AvatarVoiceStore.avatar_female_voice,
                                            maleVoice:
                                                AvatarVoiceStore.avatar_male_voice,
                                            speechRate:
                                                SpeechControllerStore.rate,
                                        });
                                    },
                                })}
                                activeOpacity={0.5}>
                                <TranscribeIcon width={30} height={30} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                {chat.role === 'user' &&
                    chat.content !== '--START_SEC_2' &&
                    chat.content !== '--START_SEC_3' &&
                    chat.content && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                                alignSelf: 'flex-end',
                                marginBottom: 20,
                            }}>
                            <Image
                                source={
                                    UserInfoStore?.user_info?.dp?.url
                                        ? {
                                              uri: http_link_fix({
                                                  http_link: UserInfoStore
                                                      ?.user_info?.dp
                                                      ?.url as string,
                                              }),
                                          }
                                        : require('../../Images/Extra/default_user_dp_light.jpg')
                                }
                                style={{
                                    width: 31,
                                    height: 31,
                                    resizeMode: 'contain',
                                    borderRadius: 31,
                                }}
                            />
                            <View
                                style={[
                                    styles.container,
                                    {
                                        backgroundColor: Colors.Primary,
                                        borderBottomLeftRadius: 20,
                                        borderBottomRightRadius: 0,
                                    },
                                ]}>
                                {enable_ttv ? (
                                    <SelectableText
                                        inputText={chat?.content}
                                        textColor={Colors.White}
                                        textSize={16}
                                    />
                                ) : (
                                    <BasicText
                                        inputText={chat?.content}
                                        textColor={Colors.White}
                                        textSize={15}
                                        selectable
                                    />
                                )}
                            </View>
                        </View>
                    )}
            </View>
        );
    },
);

export default ChatCard;

const styles = StyleSheet.create({
    container: {
        width: 240,
        maxWidth: 240,
        backgroundColor: Colors.ChatBG,
        marginLeft: 7,
        marginRight: 7,
        paddingTop: 10,
        paddingHorizontal: 12,
        paddingBottom: 8,
        borderRadius: 20,
        borderBottomLeftRadius: 0,
        shadowColor: 'rgba(0 ,0 ,0 , 0.35)',
        shadowOffset: {
            width: 1,
            height: 2,
        },
        shadowOpacity: 0.34,
        shadowRadius: 3.27,
        elevation: 3,
        minHeight: 55,
    },
});
