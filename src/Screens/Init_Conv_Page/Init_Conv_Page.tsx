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
import MicAndTextInput from '../../Components/Mic_And_Text_Input/Mic_And_Text_Input';
import { observer } from 'mobx-react';
import BackButton from '../../Components/Back_Button/Back_Button';
import TextButton from '../../Components/Text_Button/Text_Button';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { seconds_to_minutes } from '../../Utils/Seconds_To_Minutes/Seconds_To_Minutes';
import { INTF_ChatGPT } from '../../Interface/Chat_GPT/Chat_GPT';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';

const InitConvPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const UserInfo = UserInfoStore?.user_info;
    const UserName = UserInfo?.fullname?.split(' ')?.[0];

    const [micText, setMicText] = useState<string>('');
    const flatListRef = useRef<FlatList<any> | null>(null);

    const [hasSkipped, setHasSkipped] = useState<boolean>(false);
    const [messages, setMessages] = useState<INTF_ChatGPT[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(120);

    // *Prevent Double Message Sent on Init!
    const [mssgSent, setMssgSent] = useState<boolean>(false);

    const GPT_PROMPT = `This is an English Tutor application called TutorAI, Let's have a conversation about it.\nStart by saying exactly this, "Hello ${UserName}, Thank you for selecting me as your English Tutor. I am dedicated to both ensuring our lessons are both enjoyable and engaging. Now I would like to invite you to take a Proficiency test. Based on your performance, I would create a tailored study plan for you. Let's start!"\nNote: you are not actually generating the questions. The questions have been formulated in the next page of the app. So just introduce the app to the user only! You can tell the user to click the "Start" Button to begin the test. Also Note: Keep your answers very very short.`;

    const GPT_REPLY = `Hello ${UserName}!, Thank you for selecting me as your English Tutor. I am dedicated to both ensuring our lessons are both enjoyable and engaging. Now I would like to invite you to take a Proficiency test. Based on your performance, I would create a tailored study plan for you. Let's start!".`;

    const { mutate: gpt_req_mutate } = useMutation(gpt_request, {
        onMutate: () => {
            setIsLoading(true);
            setMessages(prev => [
                ...prev,
                {
                    role: 'user',
                    content: micText,
                },
            ]);
            setMicText('');
            TextToSpeechStore.clear_speech();
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
                    if (!hasSkipped) {
                        TextToSpeechStore.play_speech({
                            speech: data?.data?.chat_res,
                            isMale: AvatarVoiceStore.is_avatar_male,
                            femaleVoice: AvatarVoiceStore.avatar_female_voice,
                            maleVoice: AvatarVoiceStore.avatar_male_voice,
                            speechRate: SpeechControllerStore.rate,
                        });
                    }
                }
            }
        },
    });

    const send_reply = ({ textInput }: { textInput: string }) => {
        if (textInput) {
            setMicText(textInput);
            gpt_req_mutate({
                messages: [
                    ...messages,
                    { role: 'user', content: textInput },
                ] as INTF_ChatGPT[],
            });
        }
        Keyboard.isVisible() && Keyboard.dismiss();
    };

    useEffect(() => {
        if (messages?.length < 3 && !mssgSent) {
            // gpt_req_mutate({
            //     messages: [
            //         ...messages,
            //         { role: 'user', content: GPT_PROMPT },
            //         { role: 'assistant', content: GPT_REPLY },
            //     ] as INTF_ChatGPT[],
            // });
            setMessages(prev => [
                ...prev,
                {
                    role: 'user',
                    content: GPT_PROMPT,
                },
                {
                    role: 'assistant',
                    content: GPT_REPLY,
                },
            ]);
            if (!hasSkipped) {
                TextToSpeechStore.play_speech({
                    speech: GPT_REPLY,
                    isMale: AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
            setMssgSent(true);
        }
    }, [gpt_req_mutate, GPT_PROMPT, messages, mssgSent, GPT_REPLY, hasSkipped]);

    useEffect(() => {
        let intervalId: any;
        if (timer > 0) {
            intervalId = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        }
        if (!hasSkipped && timer === 0) {
            TextToSpeechStore.clear_speech();
            setHasSkipped(true);
            navigation.navigate('AuthStack', {
                screen: 'PreTestPage',
            });
        }
        return () => clearInterval(intervalId);
    }, [timer, navigation, hasSkipped]);

    useEffect(() => {
        const first_timer = setTimeout(() => {
            flatListRef.current !== null && flatListRef.current?.scrollToEnd();
        }, 100);
        if (Keyboard.isVisible()) {
            Keyboard.dismiss();
        }
        return () => clearTimeout(first_timer);
    }, [messages?.length]);

    if (UserName) {
        return (
            <View style={styles.init_conv_main}>
                <CustomStatusBar backgroundColor={Colors.Background} />
                <View
                    style={{
                        marginTop:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 40,
                                      if_false: 65,
                                  })
                                : 20,
                        marginHorizontal: 22,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <BackButton show_back_button />
                    <View
                        style={{
                            position: 'absolute',
                            right: 0,
                            left: 0,
                        }}>
                        <BasicText
                            inputText={seconds_to_minutes({ time: timer })}
                            marginLeft={'auto'}
                            marginRight={'auto'}
                            textColor={Colors.Primary}
                            textWeight={600}
                            textSize={15}
                        />
                    </View>
                    <TextButton
                        buttonText="Start"
                        marginLeft={'auto'}
                        marginRight={5}
                        isFontLight
                        execFunc={no_double_clicks({
                            execFunc: () => {
                                TextToSpeechStore.clear_speech();
                                setHasSkipped(true);
                                navigation.navigate('AuthStack', {
                                    screen: 'PreTestPage',
                                });
                            },
                        })}
                    />
                </View>
                <MiniAvatar
                    marginTop={15}
                    marginBottom={4}
                    marginHorizontal={22}
                    isSubtitleIcon
                />
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_false: 35,
                                      if_true: 10,
                                  })
                                : 15,
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
                            data={messages.slice(1)}
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
                                    last_index={messages.slice(1)?.length - 1}
                                    enable_ttv={false}
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
                                    inputText="Press the Microphone Button or type into the ChatBox to start a Conversation."
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
                            inputMode="text"
                            marginTop={3}
                            marginLeft={12}
                            marginRight={12}
                            paddingBottom={7}
                            paddingTop={3}
                            placeHolderText="Type here.."
                            inputValue={micText}
                            setInputValue={setMicText}
                            onChange={no_double_clicks({
                                execFunc: () => {
                                    flatListRef?.current?.scrollToEnd();
                                },
                            })}
                            onFocus={no_double_clicks({
                                execFunc: () => {
                                    flatListRef?.current?.scrollToEnd();
                                },
                            })}
                            onSend={send_reply}
                        />
                    )}
                </KeyboardAvoidingView>
            </View>
        );
    } else {
        return null;
    }
});

export default InitConvPage;

const styles = StyleSheet.create({
    init_conv_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
