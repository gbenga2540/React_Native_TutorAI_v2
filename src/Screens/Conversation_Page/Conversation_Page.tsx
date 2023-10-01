import React, {
    FunctionComponent,
    ReactElement,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import MiniAvatar from '../../Components/Mini_Avatar/Mini_Avatar';
import ChatCard from '../../Components/Chat_Card/Chat_Card';
import { observer } from 'mobx-react';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { INTF_ChatGPT } from '../../Interface/Chat_GPT/Chat_GPT';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { seconds_to_minutes } from '../../Utils/Seconds_To_Minutes/Seconds_To_Minutes';
import TextButton from '../../Components/Text_Button/Text_Button';
import MicAndTextInput from '../../Components/Mic_And_Text_Input/Mic_And_Text_Input';

const ConversationPage: FunctionComponent = observer(() => {
    const [chat, setChat] = useState<string>('');
    const flatListRef = useRef<FlatList<any> | null>(null);

    const [messages, setMessages] = useState<INTF_ChatGPT[]>([]);
    const [micText, setMicText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(1800);
    // *Prevent Double Message Sent on Init!
    const [mssgSent, setMssgSent] = useState<boolean>(false);

    const UserInfo = UserInfoStore?.user_info;

    const GPT_PROMPT = `Hi, My name is ${UserInfo?.fullname}, let's talk about my interest and also a bit of some English Language Tutoring. Here's an array of my interests: ${UserInfo?.interests}. Note: keep your replies short and let the Conversation be as Natural as Possible!`;

    const { mutate: gpt_req_mutate } = useMutation(gpt_request, {
        onMutate: () => {
            setIsLoading(true);
            setMessages(prev => [
                ...prev,
                {
                    role: 'user',
                    content: messages?.length === 0 ? GPT_PROMPT : chat,
                },
            ]);
            TextToSpeechStore.clear_speech();
            setChat('');
        },
        onSettled: async data => {
            if (data?.error) {
                setIsLoading(false);
            } else {
                setIsLoading(false);
                if (data?.data?.chat_res) {
                    setMessages(prev => [
                        ...prev,
                        { role: 'assistant', content: data?.data?.chat_res },
                    ]);
                    TextToSpeechStore.play_speech({
                        speech: data?.data?.chat_res,
                        isMale: AvatarVoiceStore.is_avatar_male,
                        femaleVoice: AvatarVoiceStore.avatar_female_voice,
                        maleVoice: AvatarVoiceStore.avatar_male_voice,
                        speechRate: SpeechControllerStore.rate,
                    });
                }
            }
        },
    });

    const restart_conversation = no_double_clicks({
        execFunc: () => {
            setChat('');
            setMessages([]);
            setTimer(1800);
            setMssgSent(false);
        },
    });

    const send_message = ({ textInput }: { textInput: string }) => {
        if (textInput) {
            setChat(textInput);
            gpt_req_mutate({
                messages: [
                    ...messages,
                    { role: 'user', content: textInput },
                ] as INTF_ChatGPT[],
            });
        }
        Keyboard.isVisible() && Keyboard.dismiss();
    };

    const speak_info = no_double_clicks({
        execFunc: () => {
            TextToSpeechStore.play_speech({
                speech:
                    timer === 0
                        ? 'Session Time Elapsed!\nPress the RESTART button to start a new conversation.'
                        : 'Press the Microphone Button to start or continue a conversation.',
                isMale: AvatarVoiceStore.is_avatar_male,
                femaleVoice: AvatarVoiceStore.avatar_female_voice,
                maleVoice: AvatarVoiceStore.avatar_male_voice,
                speechRate: SpeechControllerStore.rate,
            });
        },
    });

    useEffect(() => {
        if (messages?.length === 0 && !mssgSent) {
            gpt_req_mutate({
                messages: [
                    ...messages,
                    { role: 'user', content: GPT_PROMPT },
                ] as INTF_ChatGPT[],
            });
            setMssgSent(true);
        }
    }, [gpt_req_mutate, GPT_PROMPT, messages, mssgSent]);

    useEffect(() => {
        let intervalId: any;
        if (messages?.length > 1 && timer > 0) {
            intervalId = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [timer, messages?.length]);

    useEffect(() => {
        const first_timer = setTimeout(() => {
            flatListRef.current !== null && flatListRef.current?.scrollToEnd();
            if (Keyboard.isVisible()) {
                Keyboard.dismiss();
            }
        }, 100);
        return () => clearTimeout(first_timer);
    }, [messages?.length]);

    return (
        <View style={styles.conversation_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
            <View style={styles.c_header_cont}>
                <BasicText
                    inputText="Conversation"
                    textWeight={700}
                    textSize={25}
                    marginTop={'auto'}
                    marginBottom={18}
                />
                <BasicText
                    inputText={seconds_to_minutes({
                        time: timer,
                    })}
                    marginLeft={'auto'}
                    marginTop={'auto'}
                    marginBottom={25}
                    marginRight={22}
                    textWeight={600}
                    textColor={Colors.Primary}
                />
            </View>
            <MiniAvatar
                marginTop={15}
                marginBottom={4}
                marginHorizontal={22}
                isSubtitleIcon
                onPressVoice={speak_info}
            />
            {timer === 0 ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <BasicText
                        inputText="30 mins elapsed! Press Restart to begin another Session."
                        textWeight={600}
                        width={250}
                        textAlign="center"
                        textSize={15}
                    />
                    <TextButton
                        buttonText="RESTART"
                        marginTop={20}
                        execFunc={restart_conversation}
                    />
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                    }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    {messages?.slice(1)?.length > 0 ? (
                        <FlatList
                            windowSize={4}
                            ref={flatListRef}
                            ListHeaderComponent={() =>
                                (
                                    <View style={{ marginTop: 16 }}>{''}</View>
                                ) as ReactElement<any>
                            }
                            data={messages?.slice(1)}
                            keyExtractor={(item, index) => item?.role + index}
                            renderItem={({
                                item,
                                index,
                            }: {
                                item: INTF_ChatGPT;
                                index: number;
                            }) => (
                                <ChatCard
                                    key={index}
                                    chat={item}
                                    index={index}
                                    last_index={messages?.slice(1)?.length - 1}
                                    enable_ttv={true}
                                />
                            )}
                            style={{
                                paddingHorizontal: 22,
                            }}
                            ListFooterComponent={() =>
                                (
                                    <View
                                        style={{
                                            marginBottom: 1,
                                        }}>
                                        {''}
                                    </View>
                                ) as ReactElement<any>
                            }
                        />
                    ) : (
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            {!isLoading && (
                                <BasicText
                                    inputText="Press the Microphone Button to start a Conversation."
                                    textSize={16}
                                    width={250}
                                    textAlign="center"
                                />
                            )}
                        </View>
                    )}
                    {isLoading ? (
                        <View
                            style={{
                                marginHorizontal: 10,
                                height: 56,
                                minHeight: 56,
                                maxHeight: 56,
                                borderRadius: 8,
                                borderColor: Colors.Border,
                                borderWidth: 1,
                                backgroundColor: Colors.InputBackground,
                                flex: 1,
                                justifyContent: 'center',
                                paddingLeft: 12,
                                marginBottom: 10,
                            }}>
                            <BasicText
                                inputText="Loading..."
                                textSize={17}
                                textColor={Colors.DarkGrey}
                            />
                        </View>
                    ) : (
                        <MicAndTextInput
                            mode="Mic_And_Text"
                            marginTop={2}
                            marginLeft={'auto'}
                            marginRight={'auto'}
                            marginBottom={10}
                            inputValue={micText}
                            setInputValue={setMicText}
                            onSend={send_message}
                        />
                    )}
                </KeyboardAvoidingView>
            )}
        </View>
    );
});

export default ConversationPage;

const styles = StyleSheet.create({
    conversation_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    c_header_cont: {
        height:
            Platform.OS === 'ios'
                ? screen_height_less_than({
                      if_true: 90,
                      if_false: 120,
                  })
                : 70,
        paddingLeft: 22,
        backgroundColor: Colors.Background,
        shadowColor:
            Platform.OS === 'ios'
                ? 'rgba(0 ,0 ,0 , 0.35)'
                : 'rgba(0 ,0 ,0 , 0.9)',
        shadowOffset: {
            width: 1,
            height: Platform.OS === 'ios' ? 1 : 2,
        },
        shadowOpacity: 0.34,
        shadowRadius: 3.27,
        elevation: 3,
        flexDirection: 'row',
    },
});
