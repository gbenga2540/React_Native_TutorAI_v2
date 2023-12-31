import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    BackHandler,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { observer } from 'mobx-react';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { alphabets } from '../../Data/Alphabets/Alphabets';
import {
    RouteProp,
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import MiniAvatar from '../../Components/Mini_Avatar/Mini_Avatar';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import Sound from 'react-native-sound';
import { clamp_value } from '../../Utils/Clamp_Value/Clamp_Value';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { INTF_ExamsQ } from '../../Interface/Exams_Q/Exams_Q';
import {
    Beginner,
    PreIntermediate,
    Intermediate,
    UpperIntermediate,
    Confident,
} from '../../Data/Exams_Q/Exams_Q';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { seconds_to_minutes } from '../../Utils/Seconds_To_Minutes/Seconds_To_Minutes';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import TextButton from '../../Components/Text_Button/Text_Button';
import { global_variables } from '../../Configs/Global/Global_Variable';
import SelectableText from '../../Components/Selectable_Text/Selectable_Text';
import { getGoogleTranslate } from '../../Hooks/Get_Google_Translate/Get_Google_Translate';

const ExamQPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<any>>();
    const CurrentLevel = route.params?.CurrentLevel || 'Beginner';
    Sound.setCategory('Playback');

    const [userScore, setUserScore] = useState<number>(0);
    const [questions, setQuestions] = useState<INTF_ExamsQ[]>([]);
    const noOfQuestions = questions?.length;
    const [currentQ, setCurrentQ] = useState<number>(0);
    const [currentQue, setCurrentQue] = useState<string>('');
    const [answer, setAnswer] = useState<string>('');
    const [canAnswer, setCanAnswer] = useState<boolean>(true);
    const [answerUI, setAnswerUI] = useState<'NoChange' | 'Correct' | 'Wrong'>(
        'NoChange',
    );
    const [timer, setTimer] = useState<number>(30); //450
    const [hasSkipped, setHasSkipped] = useState<boolean>(false);

    const [showT, setShowT] = useState<boolean>(false);
    const [translation, setTranslation] = useState<string>('');
    const [incorrectQ, setIncorrectQ] = useState<
        {
            id: number;
            question: string;
            correct_answer: string;
            wrong_answer: string;
        }[]
    >([]);

    const { mutate: gpt_req_mutate } = useMutation(gpt_request, {
        onSettled: async data => {
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
                            words: [questions[currentQ]?.question],
                            target_lang:
                                (
                                    UserInfoStore?.user_info?.language as string
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
                                        content: `Translate "${questions[currentQ]?.question}" to ${UserInfoStore?.user_info?.language}. Note: your response should only be the translated text.`,
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

    const select_answers = no_double_clicks({
        execFunc: ({ selected }: { selected: string }) => {
            if (answer === selected) {
                setAnswer('');
            } else {
                setAnswer(selected);
            }
        },
    });

    const speak_question = no_double_clicks({
        execFunc: () => {
            if (currentQ < noOfQuestions) {
                TextToSpeechStore.play_speech({
                    speech: questions[currentQ]?.question
                        ?.replace('_', 'dash')
                        ?.replace(/_/g, ''),
                    isMale: !AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
        },
    });

    const on_press_next = no_double_clicks({
        execFunc: () => {
            setShowT(false);
            setTranslation('');
            if (currentQ < noOfQuestions) {
                const nextQuestionWrong = () => {
                    setIncorrectQ(prev => [
                        ...prev,
                        {
                            id: incorrectQ?.length + 1,
                            question: questions[currentQ]?.question,
                            wrong_answer: answer,
                            correct_answer: questions[currentQ]?.answer,
                        },
                    ]);
                    setAnswer('');
                    setAnswerUI('NoChange');
                    setCurrentQ(
                        clamp_value({
                            value: currentQ + 1,
                            minValue: 0,
                            maxValue: noOfQuestions,
                        }),
                    );
                    setCanAnswer(true);
                };
                const nextQuestion = () => {
                    setAnswer('');
                    setAnswerUI('NoChange');
                    setCurrentQ(
                        clamp_value({
                            value: currentQ + 1,
                            minValue: 0,
                            maxValue: noOfQuestions,
                        }),
                    );
                    setCanAnswer(true);
                };

                if (canAnswer) {
                    if (answer) {
                        setCanAnswer(false);
                        setTimer(30);
                        if (answer === questions[currentQ].answer) {
                            setUserScore(userScore + 1);
                            setAnswerUI('Correct');
                            const correct_sound = new Sound(
                                'correct.mp3',
                                Sound.MAIN_BUNDLE,
                                error => {
                                    if (error) {
                                        nextQuestion();
                                    } else {
                                        correct_sound.play(success => {
                                            if (success) {
                                                nextQuestion();
                                            } else {
                                                nextQuestion();
                                            }
                                        });
                                    }
                                },
                            );
                        } else {
                            setAnswerUI('Wrong');
                            const wrong_sound = new Sound(
                                'incorrect.mp3',
                                Sound.MAIN_BUNDLE,
                                error => {
                                    if (error) {
                                        nextQuestionWrong();
                                    } else {
                                        wrong_sound.play(success => {
                                            if (success) {
                                                nextQuestionWrong();
                                            } else {
                                                nextQuestionWrong();
                                            }
                                        });
                                    }
                                },
                            );
                        }
                    } else {
                        error_handler({
                            navigation: navigation,
                            error_mssg:
                                'One Answer is required for this Question!',
                        });
                    }
                }
            } else {
                if (noOfQuestions > 1) {
                    setHasSkipped(true);
                    if (route.params?.retake) {
                        if (
                            Math.floor((userScore / noOfQuestions) * 100) ===
                            100
                        ) {
                            navigation.setOptions({
                                gestureEnabled: true,
                            });
                            navigation.navigate('HomeStack', {
                                screen: 'ExamWPage',
                                params: {
                                    header_txt: 'Exam Completed.',
                                    message_txt: 'You scored 100%.',
                                    nextPage: 7,
                                    hide_back_btn: true,
                                    exam_score: Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    ),
                                    exam_level: UserInfoStore?.user_info?.level,
                                    incorrect_q: [],
                                },
                            });
                        } else if (
                            Math.floor((userScore / noOfQuestions) * 100) >
                            (UserInfoStore?.user_info?.exams?.filter(
                                item =>
                                    item?.level === route.params?.CurrentLevel,
                            )?.[0]?.score || 0)
                        ) {
                            navigation.setOptions({
                                gestureEnabled: true,
                            });
                            navigation.navigate('HomeStack', {
                                screen: 'ExamWPage',
                                params: {
                                    header_txt: 'Exam Completed.',
                                    message_txt: `You scored ${Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    )}%. ${
                                        [...incorrectQ]?.length > 0
                                            ? 'Would you like to find out why?'
                                            : ''
                                    }`,
                                    nextPage: 7,
                                    hide_back_btn: true,
                                    exam_score: Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    ),
                                    exam_level: UserInfoStore?.user_info?.level,
                                    incorrect_q: [...incorrectQ],
                                    anim_2: false,
                                },
                            });
                        } else {
                            navigation.setOptions({
                                gestureEnabled: true,
                            });
                            navigation.navigate('HomeStack', {
                                screen: 'ExamWPage',
                                params: {
                                    header_txt: 'Exam Completed.',
                                    message_txt: `You scored ${Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    )}%. which is less than your previous attempt. Would you like to find out why you got some answers wrong?`,
                                    nextPage: 3,
                                    incorrect_q: [...incorrectQ],
                                    hide_back_btn: true,
                                    hide_emoji: true,
                                    disable_sound: true,
                                    anim_2: true,
                                },
                            });
                        }
                    } else {
                        if (
                            (userScore / noOfQuestions) * 100 >=
                            global_variables.passMark
                        ) {
                            navigation.setOptions({
                                gestureEnabled: true,
                            });
                            navigation.navigate('HomeStack', {
                                screen: 'ExamWPage',
                                params: {
                                    header_txt: 'Exam Completed.',
                                    message_txt: `You scored ${Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    )}%. ${
                                        [...incorrectQ]?.length > 0
                                            ? 'Would you like to find out why?'
                                            : ''
                                    }`,
                                    nextPage: 7,
                                    hide_back_btn: true,
                                    exam_score: Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    ),
                                    exam_level: UserInfoStore?.user_info?.level,
                                    incorrect_q: [...incorrectQ],
                                    anim_2: false,
                                },
                            });
                        } else {
                            navigation.setOptions({
                                gestureEnabled: true,
                            });
                            navigation.navigate('HomeStack', {
                                screen: 'ExamWPage',
                                params: {
                                    header_txt: 'Exam Completed.',
                                    message_txt: `You have completed ${Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    )}% of the tasks! Not bad, but to gain access to the next level, we encourage you to strive for at least ${
                                        global_variables.passMark
                                    }% completion. Don't worry, we're here to support you every step of the way.\nWould you like to find out why you got some answers wrong?`,
                                    nextPage: 3,
                                    hide_back_btn: true,
                                    exam_score: Math.floor(
                                        (userScore / noOfQuestions) * 100,
                                    ),
                                    exam_level: UserInfoStore?.user_info?.level,
                                    incorrect_q: [...incorrectQ],
                                    anim_2: true,
                                    hide_emoji: true,
                                    disable_sound: true,
                                },
                            });
                        }
                    }
                }
            }
        },
    });

    useEffect(() => {
        setCurrentQue(questions[currentQ]?.question);
    }, [currentQ, questions]);

    useEffect(() => {
        setShowT(false);
        setTranslation('');
        TextToSpeechStore.clear_speech();
        if (currentQ < noOfQuestions && !hasSkipped) {
            if (currentQue !== questions[currentQ]?.question) {
                TextToSpeechStore.play_speech({
                    speech: questions[currentQ]?.question
                        ?.replace('_', 'dash')
                        ?.replace(/_/g, ''),
                    isMale: !AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
        }
    }, [
        currentQ,
        questions,
        noOfQuestions,
        userScore,
        navigation,
        route.params,
        incorrectQ,
        hasSkipped,
        currentQue,
    ]);

    useEffect(() => {
        switch (CurrentLevel) {
            case 'Beginner':
                // setQuestions(Beginner?.filter(item => item?.exam_id < 6));
                setQuestions(Beginner);
                break;
            case 'Pre-Intermediate':
                setQuestions(PreIntermediate);
                break;
            case 'Intermediate':
                setQuestions(Intermediate);
                break;
            case 'Upper-Intermediate':
                setQuestions(UpperIntermediate);
                break;
            case 'Confident':
                setQuestions(Confident);
                break;
            default:
                setQuestions(Beginner);
                break;
        }
    }, [CurrentLevel]);

    useEffect(() => {
        let intervalId: any;
        if (timer > 0 && canAnswer) {
            intervalId = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        }
        if (
            // timer === 0 &&
            !hasSkipped &&
            currentQ >= noOfQuestions &&
            noOfQuestions > 1 &&
            noOfQuestions - currentQ === 0
        ) {
            setHasSkipped(true);
            TextToSpeechStore.clear_speech();
            if (route.params?.retake) {
                if (Math.floor((userScore / noOfQuestions) * 100) === 100) {
                    navigation.setOptions({
                        gestureEnabled: true,
                    });
                    navigation.navigate('HomeStack', {
                        screen: 'ExamWPage',
                        params: {
                            header_txt: 'Exam Completed.',
                            message_txt: 'You scored 100%.',
                            nextPage: 7,
                            hide_back_btn: true,
                            exam_score: Math.floor(
                                (userScore / noOfQuestions) * 100,
                            ),
                            exam_level: UserInfoStore?.user_info?.level,
                            incorrect_q: [],
                        },
                    });
                } else if (
                    Math.floor((userScore / noOfQuestions) * 100) >
                    (UserInfoStore?.user_info?.exams?.filter(
                        item => item?.level === route.params?.CurrentLevel,
                    )?.[0]?.score || 0)
                ) {
                    navigation.setOptions({
                        gestureEnabled: true,
                    });
                    navigation.navigate('HomeStack', {
                        screen: 'ExamWPage',
                        params: {
                            header_txt: 'Exam Completed.',
                            message_txt: `You scored ${Math.floor(
                                (userScore / noOfQuestions) * 100,
                            )}%. ${
                                [...incorrectQ]?.length > 0
                                    ? 'Would you like to find out why?'
                                    : ''
                            }`,
                            nextPage: 7,
                            hide_back_btn: true,
                            exam_score: Math.floor(
                                (userScore / noOfQuestions) * 100,
                            ),
                            exam_level: UserInfoStore?.user_info?.level,
                            incorrect_q: [...incorrectQ],
                            anim_2: false,
                        },
                    });
                } else {
                    navigation.setOptions({
                        gestureEnabled: true,
                    });
                    navigation.navigate('HomeStack', {
                        screen: 'ExamWPage',
                        params: {
                            header_txt: 'Exam Completed.',
                            message_txt: `You scored ${Math.floor(
                                (userScore / noOfQuestions) * 100,
                            )}%. which is less than your previous attempt. Would you like to find out why you got some answers wrong?`,
                            nextPage: 3,
                            incorrect_q: [...incorrectQ],
                            hide_back_btn: true,
                            hide_emoji: true,
                            disable_sound: true,
                            anim_2: true,
                        },
                    });
                }
            } else {
                if (
                    (userScore / noOfQuestions) * 100 >=
                    global_variables.passMark
                ) {
                    navigation.setOptions({
                        gestureEnabled: true,
                    });
                    navigation.navigate('HomeStack', {
                        screen: 'ExamWPage',
                        params: {
                            header_txt: 'Exam Completed.',
                            message_txt: `You scored ${Math.floor(
                                (userScore / noOfQuestions) * 100,
                            )}%. ${
                                [...incorrectQ]?.length > 0
                                    ? 'Would you like to find out why?'
                                    : ''
                            }`,
                            nextPage: 7,
                            hide_back_btn: true,
                            exam_score: Math.floor(
                                (userScore / noOfQuestions) * 100,
                            ),
                            exam_level: UserInfoStore?.user_info?.level,
                            incorrect_q: [...incorrectQ],
                            anim_2: false,
                        },
                    });
                } else {
                    navigation.setOptions({
                        gestureEnabled: true,
                    });
                    navigation.navigate('HomeStack', {
                        screen: 'ExamWPage',
                        params: {
                            header_txt: 'Exam Completed.',
                            message_txt: `You have completed ${Math.floor(
                                (userScore / noOfQuestions) * 100,
                            )}% of the tasks! Not bad, but to gain access to the next level, we encourage you to strive for at least ${
                                global_variables.passMark
                            }% completion. Don't worry, we're here to support you every step of the way.\nWould you like to find out why you got some answers wrong?`,
                            nextPage: 3,
                            hide_back_btn: true,
                            exam_score: Math.floor(
                                (userScore / noOfQuestions) * 100,
                            ),
                            exam_level: UserInfoStore?.user_info?.level,
                            incorrect_q: [...incorrectQ],
                            anim_2: true,
                            hide_emoji: true,
                            disable_sound: true,
                        },
                    });
                }
            }
        }
        return () => clearInterval(intervalId);
    }, [
        timer,
        navigation,
        noOfQuestions,
        route.params,
        userScore,
        hasSkipped,
        incorrectQ,
        currentQ,
        canAnswer,
    ]);

    useEffect(() => {
        if (timer === 0 && !hasSkipped && currentQ < noOfQuestions) {
            const nextQuestionWrong = () => {
                setTimer(30);
                setAnswer('');
                setAnswerUI('NoChange');
                setCurrentQ(
                    clamp_value({
                        value: currentQ + 1,
                        minValue: 0,
                        maxValue: noOfQuestions,
                    }),
                );
                setCanAnswer(true);
            };
            const wrong_sound = new Sound(
                'incorrect.mp3',
                Sound.MAIN_BUNDLE,
                error => {
                    if (error) {
                        nextQuestionWrong();
                    } else {
                        wrong_sound.play(success => {
                            if (success) {
                                nextQuestionWrong();
                            } else {
                                nextQuestionWrong();
                            }
                        });
                    }
                },
            );
        }
    }, [currentQ, timer, hasSkipped, noOfQuestions]);

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
        <View style={styles.hw_main}>
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
                <BasicText inputText={'Exam'} textSize={20} textWeight={700} />
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
                isSubtitleIcon
                onPressVoice={speak_question}
                isHomeWork
            />
            <ScrollView style={{ flex: 1 }}>
                <View
                    style={{
                        flex: 1,
                        marginTop: 30,
                        marginBottom: 40,
                        marginHorizontal: 22,
                    }}>
                    {questions[currentQ]?.question ? (
                        <View
                            style={{
                                marginTop: 0,
                                marginBottom: 0,
                            }}>
                            {showT ? (
                                <BasicText
                                    inputText={translation}
                                    textSize={18}
                                    marginTop={4}
                                    marginBottom={7}
                                />
                            ) : (
                                <SelectableText
                                    inputText={questions[currentQ].question}
                                    textSize={18}
                                    marginTop={4}
                                    marginBottom={7}
                                />
                            )}
                            <TextButton
                                buttonText={
                                    showT
                                        ? 'Hide Translation'
                                        : 'Show Translation'
                                }
                                marginLeft={'auto'}
                                marginBottom={40}
                                execFunc={show_translation}
                                textColor={Colors.LightPink}
                            />
                            {questions[currentQ].options?.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() =>
                                        select_answers({ selected: item })
                                    }
                                    style={{
                                        flexDirection: 'row',
                                        borderWidth: 1,
                                        marginBottom: 8,
                                        padding: 5,
                                        borderColor:
                                            answer === item
                                                ? answerUI === 'Wrong'
                                                    ? Colors.Red
                                                    : answerUI === 'Correct'
                                                    ? Colors.Green3
                                                    : Colors.Primary
                                                : Colors.Grey,
                                        borderRadius: 10,
                                        backgroundColor:
                                            answer === item
                                                ? answerUI === 'Wrong'
                                                    ? Colors.Red
                                                    : answerUI === 'Correct'
                                                    ? Colors.Green3
                                                    : Colors.Primary
                                                : undefined,
                                        paddingVertical: 5,
                                        minHeight: 51,
                                        alignItems: 'center',
                                    }}>
                                    <BasicText
                                        inputText={alphabets[index]}
                                        marginRight={10}
                                        marginLeft={3}
                                        textWeight={700}
                                        textSize={20}
                                        textColor={
                                            answer === item
                                                ? Colors.White
                                                : Colors.Dark
                                        }
                                    />
                                    <View style={{ flex: 1 }}>
                                        <BasicText
                                            inputText={item}
                                            textSize={17}
                                            textColor={
                                                answer === item
                                                    ? Colors.White
                                                    : Colors.Dark
                                            }
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <BasicText inputText="Loading..." />
                        </View>
                    )}
                </View>
            </ScrollView>
            <BasicButton
                buttonText="Next"
                marginHorizontal={22}
                marginBottom={screen_height_less_than({
                    if_true: 10,
                    if_false: 35,
                })}
                marginTop={3}
                execFunc={() => on_press_next({})}
                disableDebounce
            />
        </View>
    );
});

export default ExamQPage;

const styles = StyleSheet.create({
    hw_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
