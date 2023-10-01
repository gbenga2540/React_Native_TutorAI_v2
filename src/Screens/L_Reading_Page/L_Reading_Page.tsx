import React, {
    Fragment,
    FunctionComponent,
    ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    Alert,
    BackHandler,
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
import {
    RouteProp,
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import BackButton from '../../Components/Back_Button/Back_Button';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { INTF_ChatGPT } from '../../Interface/Chat_GPT/Chat_GPT';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { seconds_to_minutes } from '../../Utils/Seconds_To_Minutes/Seconds_To_Minutes';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { AvatarSpeakStore } from '../../MobX/Avatar_Speak/Avatar_Speak';
import { AdminStore } from '../../MobX/Admin/Admin';

const LReadingPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<any>>();
    const [micText, setMicText] = useState<string>('');
    const [timer, setTimer] = useState<number>(510);
    const flatListRef = useRef<FlatList<any> | null>(null);

    const [resTimer, setResTimer] = useState<number>(60);
    const [resCount, setResCount] = useState<number>(0);
    const [hideInput, setHideInput] = useState<boolean>(false);

    // *Displayed to the User
    const [allMessages, setAllMessages] = useState<INTF_ChatGPT[]>([]);
    // !Hidden from the User. This are the actual Messages ChatGPT uses for communication and it resets based on the Session to avoid conflicts.
    const [messages, setMessages] = useState<INTF_ChatGPT[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // *Prevent Double Message Sent on Init and on Timed Message!
    const [mssgSent, setMssgSent] = useState<boolean>(false);
    const [hasSkipped, setHasSkipped] = useState<boolean>(false);

    // const GPT_PROMPT = new_reading_prompt({
    //     fullname: UserInfoStore.user_info?.fullname as string,
    // });
    const GPT_PROMPT: string = AdminStore.admin_data?.reading_prompt
        ?.replace(
            '/--FULLNAME--/',
            UserInfoStore?.user_info?.fullname as string,
        )
        ?.replace('/--TOPIC--/', route.params?.topic || '')
        ?.replace('/--SUBTOPIC--/', route.params?.sub_topic || '') as string;

    const { mutate: gpt_req_mutate } = useMutation(gpt_request, {
        onMutate: () => {
            setIsLoading(true);
            setMicText('');
            TextToSpeechStore.clear_speech();
        },
        onSettled: async data => {
            setIsLoading(false);
            if (!data?.error) {
                if (data?.data?.chat_res) {
                    setResTimer(60);
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: data?.data?.chat_res,
                        },
                    ]);
                    setAllMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: data?.data?.chat_res,
                        },
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

    const send_message = ({ textInput }: { textInput: string }) => {
        if (textInput) {
            setResTimer(60);
            setMicText(textInput);
            gpt_req_mutate({
                messages: [
                    ...messages,
                    {
                        role: 'user',
                        content: textInput,
                    },
                ] as INTF_ChatGPT[],
            });
            setMessages(prev => [
                ...prev,
                { role: 'user', content: textInput },
            ]);
            setAllMessages(prev => [
                ...prev,
                { role: 'user', content: textInput },
            ]);
        }
        Keyboard.isVisible() && Keyboard.dismiss();
    };

    useEffect(() => {
        if (
            UserInfoStore?.user_info?.fullname &&
            allMessages?.length === 0 &&
            !mssgSent
        ) {
            gpt_req_mutate({
                messages: [
                    {
                        role: 'user',
                        content: GPT_PROMPT,
                    },
                ] as INTF_ChatGPT[],
            });
            setMessages([
                {
                    role: 'user',
                    content: GPT_PROMPT,
                },
            ]);
            setMssgSent(true);
        }
    }, [gpt_req_mutate, GPT_PROMPT, allMessages?.length, mssgSent]);

    // !Countdown
    useEffect(() => {
        let intervalId: any;
        if (allMessages?.length > 0 && timer > 0) {
            intervalId = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        }
        if (timer === 0 && !hasSkipped) {
            TextToSpeechStore.clear_speech();
            navigation.setOptions({
                gestureEnabled: true,
            });
            navigation.navigate('HomeStack', {
                screen: 'LWritingPage',
                params: {
                    topic: route.params?.topic,
                    sub_topic: route.params?.sub_topic,
                    lesson_id: route.params?.lesson_id,
                    is_sixty_min: route.params?.is_sixty_min,
                },
            });
            setHasSkipped(true);
        }
        return () => clearInterval(intervalId);
    }, [timer, allMessages?.length, navigation, hasSkipped, route.params]);

    // !Section Switcher
    useEffect(() => {
        if (timer === 60 && !hasSkipped) {
            setHideInput(false);
            const convey_mssg =
                'You have a minute left to complete the on-going session!';
            setAllMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: convey_mssg,
                },
            ]);
            TextToSpeechStore.play_speech({
                speech: convey_mssg,
                isMale: AvatarVoiceStore.is_avatar_male,
                femaleVoice: AvatarVoiceStore.avatar_female_voice,
                maleVoice: AvatarVoiceStore.avatar_male_voice,
                speechRate: SpeechControllerStore.rate,
            });
        }
        if (timer === 8 && !hasSkipped) {
            const convey_mssg =
                "Thank you for working hard on the Reading Session, now let's move on to the next session.";
            setHideInput(true);
            setAllMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: convey_mssg,
                },
            ]);
            TextToSpeechStore.play_speech({
                speech: convey_mssg,
                isMale: AvatarVoiceStore.is_avatar_male,
                femaleVoice: AvatarVoiceStore.avatar_female_voice,
                maleVoice: AvatarVoiceStore.avatar_male_voice,
                speechRate: SpeechControllerStore.rate,
            });
        }
        if (timer === 2 && !hasSkipped) {
            TextToSpeechStore.clear_speech();
            setHideInput(false);
            navigation.setOptions({
                gestureEnabled: true,
            });
            navigation.navigate('HomeStack', {
                screen: 'LWritingPage',
                params: {
                    topic: route.params?.topic,
                    sub_topic: route.params?.sub_topic,
                    lesson_id: route.params?.lesson_id,
                    is_sixty_min: route.params?.is_sixty_min,
                },
            });
            setHasSkipped(true);
            setResTimer(60);
        }
    }, [timer, hasSkipped, navigation, route.params]);

    // !Init -> Disable goBack navigation feature
    useEffect(() => {
        navigation.setOptions({
            gestureEnabled: false,
        });
    }, [navigation]);

    // !Scroll down to last chat
    useEffect(() => {
        const first_timer = setTimeout(() => {
            flatListRef.current !== null && flatListRef.current?.scrollToEnd();
            if (Keyboard.isVisible()) {
                Keyboard.dismiss();
            }
        }, 100);
        return () => clearTimeout(first_timer);
    }, [allMessages?.length]);

    // !Init -> Alert users to resume lecture if they have been idle for a minute
    const can_speak = AvatarSpeakStore.should_avatar_speak;
    useEffect(() => {
        let resTimerId: any;
        if (
            resTimer > 0 &&
            !isLoading &&
            allMessages?.length > 0 &&
            mssgSent &&
            allMessages?.filter(item => item?.role === 'assistant')?.length >
                0 &&
            !can_speak &&
            !hasSkipped
        ) {
            resTimerId = setInterval(() => {
                setResTimer(prevTimer => prevTimer - 1);
            }, 1000);
        }
        if (resTimer === 0) {
            const convey_mssg =
                resCount >= 1
                    ? 'You are wasting precious learning time. Please respond.'
                    : 'Please respond. I am waiting for you.';
            setAllMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: convey_mssg,
                },
            ]);
            TextToSpeechStore.play_speech({
                speech: convey_mssg,
                isMale: AvatarVoiceStore.is_avatar_male,
                femaleVoice: AvatarVoiceStore.avatar_female_voice,
                maleVoice: AvatarVoiceStore.avatar_male_voice,
                speechRate: SpeechControllerStore.rate,
            });
            setResCount(resCount + 1);
            setResTimer(60);
        }
        return () => clearInterval(resTimerId);
    }, [
        resTimer,
        allMessages,
        resCount,
        isLoading,
        mssgSent,
        can_speak,
        hasSkipped,
    ]);

    // !Init -> Can't leave until lesson is complete
    useFocusEffect(
        useCallback(() => {
            const handleBackPress = () => {
                if (Keyboard.isVisible()) {
                    Keyboard.dismiss();
                }
                if (timer === 0 && !hasSkipped) {
                    TextToSpeechStore.clear_speech();
                    navigation.setOptions({
                        gestureEnabled: true,
                    });
                    navigation.navigate('HomeStack', {
                        screen: 'LWritingPage',
                        params: {
                            topic: route.params?.topic,
                            sub_topic: route.params?.sub_topic,
                            lesson_id: route.params?.lesson_id,
                            is_sixty_min: route.params?.is_sixty_min,
                        },
                    });
                    setHasSkipped(true);
                }
                if (timer !== 0) {
                    Alert.alert(
                        'Tutor AI',
                        'You are not allowed to leave the page until we finish the lesson.',
                        [{ text: 'OK' }],
                        {
                            cancelable: true,
                        },
                    );
                }
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            return () =>
                BackHandler.removeEventListener(
                    'hardwareBackPress',
                    handleBackPress,
                );
        }, [navigation, timer, hasSkipped, route.params]),
    );

    return (
        <View style={styles.conversation_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
            <View
                style={{
                    marginTop:
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_true: 45,
                                  if_false: 65,
                              })
                            : 25,
                    marginHorizontal: 22,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                {timer === 0 && (
                    <BackButton
                        execFunc={() => {
                            TextToSpeechStore.clear_speech();
                            navigation.goBack();
                        }}
                    />
                )}
                <BasicText
                    inputText={'Reading'}
                    textWeight={700}
                    textSize={20}
                    marginLeft={timer === 0 ? 15 : 0}
                />
                <BasicText
                    inputText={seconds_to_minutes({
                        time: timer,
                    })}
                    marginLeft={'auto'}
                    textWeight={600}
                    textColor={Colors.Primary}
                />
            </View>
            <MiniAvatar
                marginTop={15}
                marginBottom={4}
                marginHorizontal={22}
                hideIcons
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
                            : 23,
                }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {allMessages?.length > 0 ? (
                    <FlatList
                        windowSize={4}
                        ref={flatListRef}
                        ListHeaderComponent={() =>
                            (
                                <View style={{ marginTop: 16 }}>{''}</View>
                            ) as ReactElement<any>
                        }
                        data={allMessages}
                        keyExtractor={(item: INTF_ChatGPT, index) =>
                            item.role + index
                        }
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
                                last_index={allMessages?.length - 1}
                                enable_ttv={true}
                                show_t_button={true}
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
                {!hideInput && (
                    <Fragment>
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
                        ) : AvatarSpeakStore.should_avatar_speak ? (
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
                                    inputText="Tutor is speaking..."
                                    textSize={17}
                                    textColor={Colors.DarkGrey}
                                />
                            </View>
                        ) : (
                            <MicAndTextInput
                                mode={'Mic_And_Text'}
                                inputMode="text"
                                marginTop={3}
                                marginLeft={10}
                                marginRight={10}
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
                                onSend={send_message}
                            />
                        )}
                    </Fragment>
                )}
            </KeyboardAvoidingView>
        </View>
    );
});

export default LReadingPage;

const styles = StyleSheet.create({
    conversation_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
