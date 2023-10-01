import React, {
    Fragment,
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    BackHandler,
    Keyboard,
    Platform,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { observer } from 'mobx-react';
import {
    RouteProp,
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts } from '../../Configs/Fonts/Fonts';
import MiniAvatar from '../../Components/Mini_Avatar/Mini_Avatar';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import TextButton from '../../Components/Text_Button/Text_Button';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { global_variables } from '../../Configs/Global/Global_Variable';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { INTF_AssignedClass } from '../../Interface/Assigned_Class/Assigned_Class';

const ExamWPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<any>>();

    const CurrentLevel: INTF_AssignedClass =
        route.params?.CurrentLevel || 'Beginner';
    const __MAX_QUESTIONS__ = 5;

    const [gptError, setGPTError] = useState<boolean>(false);
    const [currentQ, setCurrentQ] = useState<number>(1);

    const [question, setQuestion] = useState<string>('');
    const [wAnswer, setWAnswer] = useState<string>('');
    const [answerStatus, setAnswerStatus] = useState<
        'NoChange' | 'Wrong' | 'Correct'
    >('NoChange');

    const get_level_num = useCallback((): number => {
        switch (CurrentLevel) {
            case 'Beginner':
                return 1;
            case 'Pre-Intermediate':
                return 2;
            case 'Intermediate':
                return 3;
            case 'Upper-Intermediate':
                return 4;
            case 'Confident':
                return 5;
            default:
                return 1;
        }
    }, [CurrentLevel]);

    const calculate_percentage = useCallback(() => {
        const questionWords = question
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.trim() !== '');
        const userWords = wAnswer
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.trim() !== '');

        let matchingWordsCount = 0;
        for (const word of userWords) {
            if (questionWords.includes(word)) {
                matchingWordsCount++;
            }
        }
        return (matchingWordsCount / questionWords.length) * 100;
    }, [question, wAnswer]);

    const {
        mutate: gpt_req_mutate,
        isLoading,
        isError,
    } = useMutation(gpt_request, {
        onMutate: () => {},
        onSettled: async data => {
            if (data?.error) {
                setGPTError(true);
            } else {
                setGPTError(false);
                const gpt_res: string = data?.data?.chat_res;
                setQuestion(gpt_res);
                TextToSpeechStore.clear_speech();
                TextToSpeechStore.play_speech({
                    speech: gpt_res,
                    isMale: !AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
                setCurrentQ(currentQ + 1);
                setWAnswer('');
            }
        },
    });

    const on_press_next = () => {
        if (calculate_percentage() > global_variables.examWPassmark) {
            if (currentQ > __MAX_QUESTIONS__) {
                navigation.setOptions({
                    gestureEnabled: true,
                });
                navigation.push(
                    'HomeStack' as never,
                    {
                        screen: 'CongratulationsPage',
                        params: {
                            header_txt: route.params?.header_txt || '',
                            message_txt: route.params?.message_txt || '',
                            nextPage: route.params?.nextPage || 3,
                            hide_back_btn: route.params?.hide_back_btn || false,
                            exam_score: route.params?.exam_score || 0,
                            exam_level: route.params?.exam_level || 'Beginner',
                            incorrect_q: route.params?.incorrect_q || [],
                            anim_2: route.params?.anim_2 || false,
                            hide_emoji: route.params?.hide_emoji || false,
                            disable_sound: route.params?.disable_sound || false,
                        },
                    } as never,
                );
            } else {
                gpt_req_mutate({
                    messages: [
                        {
                            role: 'user',
                            content: `Generate a sentence for an English Language Writing Exam\n\nDifficulty Level: ${get_level_num()}/10\nNumber of Words: Between 8 and 12`,
                        },
                    ],
                });
            }
        } else {
            error_handler({
                navigation: navigation,
                error_mssg: `Keep going!\n\nYou need ${
                    global_variables.examWPassmark
                }% Writing Score to proceed.\n\nYour current score is ${Math.round(
                    calculate_percentage(),
                )}%\nYou can do it!`,
            });
        }
    };

    const play_question = no_double_clicks({
        execFunc: () => {
            TextToSpeechStore.clear_speech();
            if (question) {
                TextToSpeechStore.play_speech({
                    speech: question,
                    isMale: !AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
        },
    });

    const reload_question = no_double_clicks({
        execFunc: () => {
            setGPTError(false);
            gpt_req_mutate({
                messages: [
                    {
                        role: 'user',
                        content: `Generate a sentence for an English Language Writing Exam\n\nDifficulty Level: ${get_level_num()}/10\nNumber of Words: Between 8 and 12`,
                    },
                ],
            });
        },
    });

    useEffect(() => {
        gpt_req_mutate({
            messages: [
                {
                    role: 'user',
                    content: `Generate a sentence for an English Language Writing Exam\n\nDifficulty Level: ${get_level_num()}/10\nNumber of Words: Between 8 and 12`,
                },
            ],
        });
    }, [gpt_req_mutate, get_level_num]);

    useEffect(() => {
        if (wAnswer) {
            if (calculate_percentage() > global_variables.examWPassmark) {
                setAnswerStatus('Correct');
            } else {
                setAnswerStatus('Wrong');
            }
        } else {
            setAnswerStatus('NoChange');
        }
    }, [wAnswer, calculate_percentage]);

    useEffect(() => {
        navigation.setOptions({
            gestureEnabled: false,
        });
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            const handleBackPress = () => {
                TextToSpeechStore.clear_speech();
                if (Keyboard.isVisible()) {
                    Keyboard.dismiss();
                }
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            return () =>
                BackHandler.removeEventListener(
                    'hardwareBackPress',
                    handleBackPress,
                );
        }, []),
    );

    return (
        <View style={styles.ew_main}>
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
                <BasicText
                    inputText={'Exam (Writing)'}
                    textSize={20}
                    textWeight={700}
                />
            </View>
            <MiniAvatar
                marginHorizontal={22}
                marginTop={10}
                onPressVoice={play_question}
                isHomeWork
            />
            {!isLoading && question ? (
                <Fragment>
                    <View
                        style={{
                            flex: 1,
                            minHeight: 56,
                            borderRadius: 8,
                            borderColor:
                                answerStatus === 'Correct'
                                    ? Colors.Green3
                                    : answerStatus === 'Wrong'
                                    ? Colors.Red
                                    : Colors.Border,
                            borderWidth: 1,
                            backgroundColor: Colors.InputBackground,
                            marginHorizontal: 22,
                            marginTop: 10,
                            marginBottom: 10,
                        }}>
                        <TextInput
                            style={{
                                flex: 1,
                                fontFamily: fonts.Urbanist_500,
                                fontSize: 16,
                                marginHorizontal: 10,
                                borderWidth: 0,
                                marginVertical: 2,
                                color: Colors.Dark,
                                textAlignVertical: 'top',
                            }}
                            placeholder={'Enter the sentence you heard here...'}
                            placeholderTextColor={Colors.Grey}
                            onChangeText={(text: string) => {
                                setWAnswer(text);
                            }}
                            value={wAnswer}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                            inputMode={'text'}
                            autoFocus={false}
                            editable={true}
                            multiline
                            spellCheck={false}
                            keyboardType="visible-password"
                            secureTextEntry
                            autoComplete={'off'}
                            importantForAutofill="no"
                        />
                    </View>
                    <BasicButton
                        buttonText="Next"
                        marginHorizontal={22}
                        marginBottom={screen_height_less_than({
                            if_true: 10,
                            if_false: 35,
                        })}
                        marginTop={3}
                        execFunc={() => on_press_next()}
                        disableDebounce
                    />
                </Fragment>
            ) : (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    {isError || gptError ? (
                        <Fragment>
                            <BasicText
                                inputText={
                                    'Error loading Question\nPlease Try Again!'
                                }
                                textAlign="center"
                            />
                            <TextButton
                                buttonText="RELOAD"
                                marginTop={10}
                                execFunc={reload_question}
                            />
                        </Fragment>
                    ) : (
                        <BasicText inputText="Loading..." textSize={15} />
                    )}
                </View>
            )}
        </View>
    );
});

export default ExamWPage;

const styles = StyleSheet.create({
    ew_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
