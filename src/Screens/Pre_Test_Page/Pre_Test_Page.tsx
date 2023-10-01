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
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import MiniAvatar from '../../Components/Mini_Avatar/Mini_Avatar';
import { observer } from 'mobx-react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import ProficiencyQuestion from '../../Sections/Proficiency_Question/Proficiency_Question';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { INTF_AssignedClass } from '../../Interface/Assigned_Class/Assigned_Class';
import { clamp_value } from '../../Utils/Clamp_Value/Clamp_Value';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { compare_array_contents } from '../../Utils/Compare_Array_Content/Compare_Array_Content';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import ListeningQuestion from '../../Sections/Listening_Question/Listening_Question';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import {
    INTF_ProficiencyAnswers,
    INTF_ProficiencyTest,
} from '../../Interface/Tests/Proficiency';
import { INTF_ListeningTest } from '../../Interface/Tests/Listening';
import {
    INTF_WritingAnswer,
    INTF_WritingTest,
} from '../../Interface/Tests/Writing';
import WritingQuestion from '../../Sections/Writing_Question/Writing_Question';
import { useMutation, useQuery } from 'react-query';
import { update_level } from '../../Configs/Queries/Users/Users';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_USER_INFO } from '@env';
import SInfo from 'react-native-sensitive-info';
import { seconds_to_minutes } from '../../Utils/Seconds_To_Minutes/Seconds_To_Minutes';
import Sound from 'react-native-sound';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { ReTestStore } from '../../MobX/Re_Test/Re_Test';
// import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import { global_variables } from '../../Configs/Global/Global_Variable';
import { INTF_ListeningAnswers } from '../../Interface/Tests/Listening';
import { QueryTags } from '../../Configs/Queries/Query_Tags/Query_Tags';
import { get_all_pre_test } from '../../Configs/Queries/PreTest/PreTest';
import {
    convert_to_ListeningA,
    convert_to_ListeningT,
    convert_to_ProficiencyA,
    convert_to_ProficiencyT,
    convert_to_writingA,
    convert_to_writingT,
} from '../../Utils/Convert_Pre_Test_Data/Convert_Pre_Test_Data';
import {
    INTF_Server_Listening,
    INTF_Server_Proficiency,
    INTF_Server_Writing,
} from '../../Interface/Server_Pre_Test/Server_Pre_Test';

const PreTestPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    Sound.setCategory('Playback');

    const [renderPage, setRenderPage] = useState<boolean>(false);
    const [proficiencyT, setProficiencyT] = useState<INTF_ProficiencyTest[]>(
        [],
    );
    const [proficiencyA, setProficiencyA] = useState<INTF_ProficiencyAnswers[]>(
        [],
    );
    const [listeningT, setListeningT] = useState<INTF_ListeningTest[]>([]);
    const [listeningA, setListeningA] = useState<INTF_ListeningAnswers[]>([]);
    const [writingT, setWritingT] = useState<INTF_WritingTest[]>([]);
    const [writingA, setWritingA] = useState<INTF_WritingAnswer[]>([]);
    const [writingAudio, setWritingAudio] = useState<number>(0);

    const [timer, setTimer] = useState<number>(30);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [disableButton, setDisableButton] = useState<boolean>(false);
    const [hasNav, setHasNav] = useState<boolean>(false);
    const [canAnswer, setCanAnswer] = useState<boolean>(true);

    const { mutate: update_level_mutate } = useMutation(update_level, {
        onMutate: () => {
            TextToSpeechStore.clear_speech();
            setDisableButton(true);
            setShowSpinner(true);
        },
        onSettled: async data => {
            setShowSpinner(false);
            setDisableButton(false);
            if (data?.error) {
                error_handler({
                    navigation: navigation,
                    error_mssg:
                        "An error occured while trying to save User's Preferences!",
                    svr_error_mssg: data?.data,
                });
            } else {
                const TempUserInfo = UserInfoStore.user_info;

                const proceed = () => {
                    UserInfoStore.set_user_info({
                        user_info: {
                            ...TempUserInfo,
                            level: assignedLevel,
                        },
                    });
                    ReTestStore.retake_test();
                    navigation.setOptions({
                        gestureEnabled: true,
                    });
                    navigation.push(
                        'AuthStack' as never,
                        {
                            screen: 'CongratulationsPage',
                            params: {
                                header_txt: 'You did well.',
                                message_txt: `You have been assigned to ${assignedLevel} Class.`,
                                nextPage: 4,
                                hide_back_btn: true,
                                show_retake: true,
                            },
                        } as never,
                    );
                };
                try {
                    await SInfo.setItem(
                        SECURE_STORAGE_USER_INFO,
                        JSON.stringify({
                            user_info: {
                                ...TempUserInfo,
                                level: assignedLevel,
                            },
                        }),
                        {
                            sharedPreferencesName: SECURE_STORAGE_NAME,
                            keychainService: SECURE_STORAGE_NAME,
                        },
                    )
                        .catch((error: any) => {
                            error && proceed();
                        })
                        .then(() => {
                            proceed();
                        });
                } catch (err) {
                    proceed();
                }
            }
        },
    });

    // CONTROLS
    const [assignedLevel, setAssignedLevel] =
        useState<INTF_AssignedClass>(null);
    const [stage, setStage] = useState<'Proficiency' | 'Listening' | 'Writing'>(
        'Proficiency',
    );
    const [answerUI, setAnswerUI] = useState<'NoChange' | 'Correct' | 'Wrong'>(
        'NoChange',
    );

    const [pQuestions, setPQuestions] = useState<INTF_ProficiencyTest[] | null>(
        null,
    );
    const noOfQuestions = pQuestions?.length;
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [pAnswers, setPAnswers] = useState<number[]>([]);
    const [allAnswers, setAllAnswers] = useState<number[]>([]);

    const [lQuestions, setLQuestions] = useState<INTF_ListeningTest | null>(
        null,
    );
    const [lAnswer, setLAnswer] = useState<number | null>(null);
    const [lAnswerUI, setLAnswerUI] = useState<
        'NoChange' | 'Correct' | 'Wrong'
    >('NoChange');
    const [lAnswerWrong, setLAnswerWrong] = useState<boolean>(false);
    const l_answer = listeningA.filter(
        item => item?.level === assignedLevel,
    )?.[0]?.answer_index;

    const [wQuestions, setWQuestions] = useState<INTF_WritingTest | null>(null);
    const [wAnswer, setWAnswer] = useState<string>('');
    const [wAnswerStatus, setWAnswerStatus] = useState<
        'NoChange' | 'Wrong' | 'Correct'
    >('NoChange');

    const {
        data: allPreTestData,
        isError: allPreTestError,
        isLoading: allPreTestLoading,
        refetch: refetchPreTest,
    } = useQuery(QueryTags({}).PreTest, get_all_pre_test, {
        retry: 3,
        refetchIntervalInBackground: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    const reload_pre_test = no_double_clicks({
        execFunc: () => {
            refetchPreTest();
        },
    });

    useEffect(() => {
        if (!allPreTestData?.error) {
            // Process Proficiency Tests
            const prof_test = (allPreTestData?.data?.proficiency ||
                []) as INTF_Server_Proficiency[];
            if (prof_test?.length > 0) {
                const temp_pT = convert_to_ProficiencyT({
                    data: prof_test?.sort((a, b) => a?.id - b?.id) || [],
                });
                const temp_pA = convert_to_ProficiencyA({
                    data: prof_test?.sort((a, b) => a?.id - b?.id) || [],
                });
                setProficiencyT(temp_pT);
                setProficiencyA(temp_pA);
            }

            // Process Listening Tests
            const list_test = (allPreTestData?.data?.listening ||
                []) as INTF_Server_Listening[];
            if (list_test?.length > 0) {
                const temp_lT = convert_to_ListeningT({
                    data: list_test?.sort((a, b) => a?.id - b?.id) || [],
                });
                const temp_lA = convert_to_ListeningA({
                    data: list_test?.sort((a, b) => a?.id - b?.id) || [],
                });
                setListeningT(temp_lT);
                setListeningA(temp_lA);
            }

            // Process Writing Tests
            const writing_test = (allPreTestData?.data?.writing ||
                []) as INTF_Server_Writing[];
            if (writing_test?.length > 0) {
                const temp_wT = convert_to_writingT({
                    data: writing_test?.sort((a, b) => a?.id - b?.id) || [],
                });
                const temp_wA = convert_to_writingA({
                    data: writing_test?.sort((a, b) => a?.id - b?.id) || [],
                })?.map(item => {
                    return {
                        id: item?.id,
                        englishLevel: item?.englishLevel,
                        level: item?.level,
                        question: item?.question
                            ?.replace('?', '')
                            ?.replace('.', ''),
                    };
                });
                setWritingT(temp_wT);
                setWritingA(temp_wA);
            }
        }
    }, [allPreTestData]);

    useEffect(() => {
        if (
            assignedLevel === null &&
            proficiencyT?.length > 0 &&
            listeningT?.length > 0 &&
            writingT?.length > 0 &&
            proficiencyA?.length > 0 &&
            listeningA?.length > 0 &&
            writingA?.length > 0
        ) {
            setPQuestions(
                proficiencyT?.filter(item => item.englishLevel === 'A2'),
            );
            setLQuestions(
                listeningT?.filter(item => item.englishLevel === 'A2')[0],
            );
            setWQuestions(
                writingT?.filter(item => item.englishLevel === 'A2')[0],
            );
            setAssignedLevel('Beginner');
            setRenderPage(true);
        }
    }, [
        assignedLevel,
        proficiencyT,
        listeningT,
        writingT,
        proficiencyA,
        listeningA,
        writingA,
    ]);

    const calculate_percentage = useCallback(
        ({ level, input }: { level: INTF_AssignedClass; input: string }) => {
            const questionObj = writingA.find(item => item.level === level) as {
                id: number;
                englishLevel: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
                level: INTF_AssignedClass;
                question: string;
            };
            const questionText = questionObj.question;
            const questionWords = questionText
                .toLowerCase()
                .split(/\s+/)
                .filter(word => word.trim() !== '');
            const userWords = input
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
        },
        [writingA],
    );

    const speak_question = no_double_clicks({
        execFunc: () => {
            TextToSpeechStore.clear_speech();
            if (stage === 'Proficiency') {
                if (currentQuestion < (noOfQuestions || -1)) {
                    TextToSpeechStore.play_speech({
                        speech:
                            pQuestions?.[currentQuestion]?.question?.word
                                ?.replace('_', 'dash')
                                ?.replace(/_/g, '') || '',
                        isMale: AvatarVoiceStore.is_avatar_male,
                        femaleVoice: AvatarVoiceStore.avatar_female_voice,
                        maleVoice: AvatarVoiceStore.avatar_male_voice,
                        speechRate: SpeechControllerStore.rate,
                    });
                }
            } else if (stage === 'Listening') {
                TextToSpeechStore.play_speech({
                    speech:
                        'Listen to the following and select the appropraite answer.\n' +
                        lQuestions?.question,
                    isMale: AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
        },
    });

    const speak_question_left = no_double_clicks({
        execFunc: () => {
            TextToSpeechStore.clear_speech();
            if (
                stage === 'Writing' &&
                wQuestions?.question?.length !== undefined
            ) {
                setWritingAudio(
                    clamp_value({
                        value: writingAudio - 1,
                        minValue: 0,
                        maxValue: wQuestions?.question.length - 1,
                    }),
                );
                TextToSpeechStore.play_speech({
                    speech: wQuestions?.question[writingAudio - 1] || '',
                    isMale: AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
        },
    });

    const speak_question_right = no_double_clicks({
        execFunc: () => {
            TextToSpeechStore.clear_speech();
            if (
                stage === 'Writing' &&
                wQuestions?.question?.length !== undefined
            ) {
                setWritingAudio(
                    clamp_value({
                        value: writingAudio + 1,
                        minValue: 0,
                        maxValue: wQuestions?.question?.length - 1,
                    }),
                );
                TextToSpeechStore.play_speech({
                    speech: wQuestions?.question[writingAudio + 1] || '',
                    isMale: AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
        },
    });

    const start_writing_test = () => {
        setLAnswerWrong(false);
        setStage('Writing');
        TextToSpeechStore.play_speech({
            speech:
                'To begin your Writing Test, press the button at the bottom-left or bottom-right of the Avatar to Listen to the Previous or Next Dictation. \nThe first Dictation is ' +
                wQuestions?.question[0] +
                '\nPress the bottom-right button to listen to the next Dictation.',
            isMale: AvatarVoiceStore.is_avatar_male,
            femaleVoice: AvatarVoiceStore.avatar_female_voice,
            maleVoice: AvatarVoiceStore.avatar_male_voice,
            speechRate: SpeechControllerStore.rate,
        });
    };

    // const { mutate: gpt_que_exp_mutate } = useMutation(gpt_request, {
    //     onMutate: () => {
    //         setDisableButton(true);
    //         setShowSpinner(true);
    //     },
    //     onSettled: async data => {
    //         if (!data?.error) {
    //             if (data?.data?.chat_res) {
    //                 TextToSpeechStore.clear_speech();
    //                 TextToSpeechStore.play_speech({
    //                     speech: data?.data?.chat_res,
    //                     isMale: AvatarVoiceStore.is_avatar_male,
    //                     femaleVoice: AvatarVoiceStore.avatar_female_voice,
    //                     maleVoice: AvatarVoiceStore.avatar_male_voice,
    //                     speechRate: SpeechControllerStore.rate,
    //                 });
    //             }
    //         }
    //         setShowSpinner(false);
    //         setDisableButton(false);
    //     },
    // });

    // const find_out_why = no_double_clicks({
    //     execFunc: () => {
    //         if (lAnswer === null) {
    //             const GPT_PROMPT = `Act as an English Tutor:\n\nExplain why the answer to "${lQuestions?.question}" is "${lQuestions?.options[l_answer]}".\n\nNote: Keep your answer short for the questions, please`;
    //             gpt_que_exp_mutate({
    //                 messages: [{ role: 'user', content: GPT_PROMPT }],
    //             });
    //         } else {
    //             const GPT_PROMPT = `Act as an English Tutor:\n\nExplain why the answer to "${lQuestions?.question}" is "${lQuestions?.options[l_answer]}" and not "${lQuestions?.options[lAnswer]}". \n\nNote: Keep your answer short for the questions, please`;
    //             gpt_que_exp_mutate({
    //                 messages: [{ role: 'user', content: GPT_PROMPT }],
    //             });
    //         }
    //     },
    // });

    const on_press_next = () => {
        if (stage === 'Proficiency') {
            TextToSpeechStore.clear_speech();
            if (currentQuestion < (noOfQuestions || 1)) {
                const currentQuestionInfo = pQuestions?.[currentQuestion];
                const answersToQuestion = proficiencyA.filter(
                    item => item?.id === currentQuestionInfo?.id,
                );

                const nextQuestion = () => {
                    setPAnswers([]);
                    setAnswerUI('NoChange');
                    setCurrentQuestion(
                        clamp_value({
                            value: currentQuestion + 1,
                            minValue: 0,
                            maxValue: noOfQuestions,
                        }),
                    );
                    setCanAnswer(true);
                };

                if (canAnswer) {
                    if (currentQuestionInfo?.multiple_choice) {
                        if (pAnswers?.length !== 2) {
                            error_handler({
                                navigation: navigation,
                                error_mssg:
                                    'Two Answers are required for this Question!',
                            });
                        } else {
                            setAllAnswers(prev => {
                                const old = prev;
                                old.push(
                                    compare_array_contents({
                                        arr1: answersToQuestion[0]
                                            .answers_index,
                                        arr2: pAnswers,
                                    })
                                        ? 1
                                        : 0,
                                );
                                return old;
                            });
                            setCanAnswer(false);
                            setTimer(30);
                            if (
                                compare_array_contents({
                                    arr1: answersToQuestion[0].answers_index,
                                    arr2: pAnswers,
                                })
                            ) {
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
                                            nextQuestion();
                                        } else {
                                            wrong_sound.play(success => {
                                                if (success) {
                                                    nextQuestion();
                                                } else {
                                                    nextQuestion();
                                                }
                                            });
                                        }
                                    },
                                );
                            }
                        }
                    } else {
                        if (pAnswers?.length !== 1) {
                            error_handler({
                                navigation: navigation,
                                error_mssg:
                                    'One Answer is required for this Question!',
                            });
                        } else {
                            setAllAnswers(prev => {
                                const old = prev;
                                old.push(
                                    compare_array_contents({
                                        arr1: answersToQuestion[0]
                                            .answers_index,
                                        arr2: pAnswers,
                                    })
                                        ? 1
                                        : 0,
                                );
                                return old;
                            });
                            setCanAnswer(false);
                            setTimer(30);
                            if (
                                compare_array_contents({
                                    arr1: answersToQuestion[0].answers_index,
                                    arr2: pAnswers,
                                })
                            ) {
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
                                            nextQuestion();
                                        } else {
                                            wrong_sound.play(success => {
                                                if (success) {
                                                    nextQuestion();
                                                } else {
                                                    nextQuestion();
                                                }
                                            });
                                        }
                                    },
                                );
                            }
                        }
                    }
                }
            }
        } else if (stage === 'Listening') {
            if (lAnswer !== null) {
                switch (assignedLevel) {
                    case 'Beginner':
                        setWQuestions(
                            writingT.filter(
                                item => item.englishLevel === 'A2',
                            )[0],
                        );
                        break;
                    case 'Pre-Intermediate':
                        setWQuestions(
                            writingT.filter(
                                item => item.englishLevel === 'B1',
                            )[0],
                        );
                        break;
                    case 'Intermediate':
                        setWQuestions(
                            writingT.filter(
                                item => item.englishLevel === 'B2',
                            )[0],
                        );
                        break;
                    case 'Upper-Intermediate':
                        setWQuestions(
                            writingT.filter(
                                item => item.englishLevel === 'C1',
                            )[0],
                        );
                        break;
                    case 'Confident':
                        setWQuestions(
                            writingT.filter(
                                item => item.englishLevel === 'C2',
                            )[0],
                        );
                        break;
                    default:
                        setWQuestions(
                            writingT.filter(
                                item => item.englishLevel === 'A2',
                            )[0],
                        );
                        break;
                }
                TextToSpeechStore.clear_speech();

                const show_find_out_why = () => {
                    setLAnswerWrong(true);
                };

                if (lAnswer === l_answer) {
                    setLAnswerUI('Correct');
                    const correct_sound = new Sound(
                        'correct.mp3',
                        Sound.MAIN_BUNDLE,
                        error => {
                            if (error) {
                                start_writing_test();
                            } else {
                                correct_sound.play(success => {
                                    if (success) {
                                        start_writing_test();
                                    } else {
                                        start_writing_test();
                                    }
                                });
                            }
                        },
                    );
                } else {
                    setLAnswerUI('Wrong');
                    const wrong_sound = new Sound(
                        'incorrect.mp3',
                        Sound.MAIN_BUNDLE,
                        error => {
                            if (error) {
                                show_find_out_why();
                            } else {
                                wrong_sound.play(success => {
                                    if (success) {
                                        show_find_out_why();
                                    } else {
                                        show_find_out_why();
                                    }
                                });
                            }
                        },
                    );
                }
            } else {
                error_handler({
                    navigation: navigation,
                    error_mssg: 'One Answer is required for this Question!',
                });
            }
        } else if (stage === 'Writing') {
            if (
                calculate_percentage({
                    input: wAnswer,
                    level: assignedLevel,
                }) > global_variables.writingPassMark
            ) {
                update_level_mutate({
                    uid: UserInfoStore?.user_info?._id as string,
                    level: assignedLevel,
                });
            } else {
                error_handler({
                    navigation: navigation,
                    error_mssg:
                        'Please, Attempt the Writing Test to the best of your ability!\n\nThis error is shown as a result of not inputing all sentences in the Writing Test.\n\nPlease return back to the page and use the "Arrow Buttons" below the "Avatar" to cycle through all the Sentences.',
                });
            }
        }
    };

    useEffect(() => {
        if (stage === 'Proficiency') {
            if (currentQuestion >= (noOfQuestions || 1)) {
                const score = allAnswers?.filter(item => item === 1)?.length;

                if (assignedLevel === 'Beginner' && score >= 7) {
                    setPQuestions(
                        proficiencyT.filter(item => item.englishLevel === 'B1'),
                    );
                    setAllAnswers([]);
                    setPAnswers([]);
                    setCurrentQuestion(0);
                    setAssignedLevel('Pre-Intermediate');
                } else if (assignedLevel === 'Pre-Intermediate' && score >= 7) {
                    setPQuestions(
                        proficiencyT.filter(item => item.englishLevel === 'B2'),
                    );
                    setAllAnswers([]);
                    setPAnswers([]);
                    setCurrentQuestion(0);
                    setAssignedLevel('Intermediate');
                } else if (assignedLevel === 'Intermediate' && score >= 6) {
                    setPQuestions(
                        proficiencyT.filter(item => item.englishLevel === 'C1'),
                    );
                    setAllAnswers([]);
                    setPAnswers([]);
                    setCurrentQuestion(0);
                    setAssignedLevel('Upper-Intermediate');
                } else if (
                    assignedLevel === 'Upper-Intermediate' &&
                    score >= 6
                ) {
                    setAssignedLevel('Confident');
                    setLQuestions(
                        listeningT.filter(
                            item => item.englishLevel === 'C2',
                        )[0],
                    );
                    TextToSpeechStore.clear_speech();
                    setHasNav(true);
                    setStage('Listening');
                    TextToSpeechStore.play_speech({
                        speech: 'To begin your Listening Test, press the button at the bottom-right of the Avatar.\nNote that you can always press the button again to Listen once more.',
                        isMale: AvatarVoiceStore.is_avatar_male,
                        femaleVoice: AvatarVoiceStore.avatar_female_voice,
                        maleVoice: AvatarVoiceStore.avatar_male_voice,
                        speechRate: SpeechControllerStore.rate,
                    });
                } else {
                    switch (assignedLevel) {
                        case 'Beginner':
                            setLQuestions(
                                listeningT.filter(
                                    item => item.englishLevel === 'A2',
                                )[0],
                            );
                            break;
                        case 'Pre-Intermediate':
                            setLQuestions(
                                listeningT.filter(
                                    item => item.englishLevel === 'B1',
                                )[0],
                            );
                            break;
                        case 'Intermediate':
                            setLQuestions(
                                listeningT.filter(
                                    item => item.englishLevel === 'B2',
                                )[0],
                            );
                            break;
                        case 'Upper-Intermediate':
                            setLQuestions(
                                listeningT.filter(
                                    item => item.englishLevel === 'C1',
                                )[0],
                            );
                            break;
                        case 'Confident':
                            setLQuestions(
                                listeningT.filter(
                                    item => item.englishLevel === 'C2',
                                )[0],
                            );
                            break;
                        default:
                            setLQuestions(
                                listeningT.filter(
                                    item => item.englishLevel === 'A2',
                                )[0],
                            );
                            break;
                    }
                    TextToSpeechStore.clear_speech();
                    setHasNav(true);
                    setStage('Listening');
                    TextToSpeechStore.play_speech({
                        speech: 'To begin your Listening Test, press the button at the bottom-right of the Avatar.\nNote that you can always press the button again to Listen once more.',
                        isMale: AvatarVoiceStore.is_avatar_male,
                        femaleVoice: AvatarVoiceStore.avatar_female_voice,
                        maleVoice: AvatarVoiceStore.avatar_male_voice,
                        speechRate: SpeechControllerStore.rate,
                    });
                }
            }
        }
    }, [
        currentQuestion,
        noOfQuestions,
        allAnswers,
        stage,
        assignedLevel,
        lQuestions?.question,
        proficiencyT,
        listeningT,
    ]);

    // Play the Question automatically on Question Change
    useEffect(() => {
        if (stage === 'Proficiency') {
            if (currentQuestion < (noOfQuestions || -1)) {
                TextToSpeechStore.play_speech({
                    speech:
                        pQuestions?.[currentQuestion]?.question?.word?.replace(
                            /_/g,
                            '',
                        ) || '',
                    isMale: AvatarVoiceStore.is_avatar_male,
                    femaleVoice: AvatarVoiceStore.avatar_female_voice,
                    maleVoice: AvatarVoiceStore.avatar_male_voice,
                    speechRate: SpeechControllerStore.rate,
                });
            }
        }
    }, [currentQuestion, noOfQuestions, stage, pQuestions]);

    useEffect(() => {
        if (stage === 'Proficiency' && !hasNav && timer === 0) {
            setTimer(30);
            setPAnswers([]);
            setAnswerUI('NoChange');
            setCurrentQuestion(
                clamp_value({
                    value: currentQuestion + 1,
                    minValue: 0,
                    maxValue: noOfQuestions,
                }),
            );
            setCanAnswer(true);
        }
    }, [timer, hasNav, stage, currentQuestion, noOfQuestions]);

    // Timer Sequence
    useEffect(() => {
        let intervalId: any;
        if (
            stage === 'Proficiency' &&
            timer > 0 &&
            !hasNav &&
            canAnswer &&
            renderPage
        ) {
            intervalId = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [timer, stage, hasNav, canAnswer, renderPage]);

    // Can retake test
    const retestCount = ReTestStore.testCount;
    useEffect(() => {
        if (retestCount === 1) {
            ReTestStore.start_test();
        }
    }, [retestCount]);

    useEffect(() => {
        if (wAnswer?.length < 1) {
            setWAnswerStatus('NoChange');
        } else {
            if (
                calculate_percentage({
                    input: wAnswer,
                    level: assignedLevel,
                }) > global_variables.writingPassMark
            ) {
                setWAnswerStatus('Correct');
            } else {
                setWAnswerStatus('Wrong');
            }
        }
    }, [wAnswer.length, wAnswer, assignedLevel, calculate_percentage]);

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

    if (
        !allPreTestLoading &&
        (allPreTestError || allPreTestData?.error) &&
        !renderPage
    ) {
        return (
            <View style={[styles.pre_test_main, { zIndex: 2 }]}>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <BasicText
                        inputText="Error Loading Pre-Test Data. Please Try Again!"
                        width={250}
                        textAlign={'center'}
                    />
                </View>
                <BasicButton
                    execFunc={() => reload_pre_test({})}
                    buttonText="RELOAD"
                    marginHorizontal={22}
                    marginBottom={
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_false: 35,
                                  if_true: 10,
                              })
                            : 20
                    }
                />
            </View>
        );
    }

    if (allPreTestLoading && !renderPage) {
        return (
            <View style={[styles.pre_test_main, { zIndex: 3 }]}>
                <OverlaySpinner showSpinner={true} hideBackButton />
            </View>
        );
    }

    if (
        renderPage &&
        !allPreTestError &&
        allPreTestData?.error === false &&
        !allPreTestLoading
    ) {
        return (
            <View style={styles.pre_test_main}>
                <CustomStatusBar backgroundColor={Colors.Background} />
                <OverlaySpinner
                    showSpinner={showSpinner}
                    setShowSpinner={setShowSpinner}
                />
                <View
                    style={{
                        marginTop:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 45,
                                      if_false: 65,
                                  })
                                : screen_height_less_than({
                                      if_true: 8,
                                      if_false: 25,
                                  }),
                        marginHorizontal: 22,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <BasicText
                        inputText="Pre-Test"
                        textSize={20}
                        textWeight={700}
                        marginLeft={10}
                    />
                    {stage === 'Proficiency' && (
                        <BasicText
                            inputText={seconds_to_minutes({
                                time: timer,
                            })}
                            marginLeft={'auto'}
                            textWeight={600}
                            textColor={Colors.Primary}
                        />
                    )}
                </View>
                <MiniAvatar
                    marginTop={15}
                    marginBottom={4}
                    marginHorizontal={22}
                    isSubtitleIcon
                    isWritingTest={stage === 'Writing'}
                    onPressVoice={speak_question}
                    onPressVoiceLeft={speak_question_left}
                    onPressVoiceRight={speak_question_right}
                />
                {stage === 'Proficiency' && (
                    <Fragment>
                        {pQuestions?.[currentQuestion] ? (
                            <ScrollView style={{ flex: 1 }}>
                                <ProficiencyQuestion
                                    marginTop={20}
                                    marginLeft={22}
                                    marginRight={22}
                                    question={
                                        pQuestions?.[currentQuestion] || ''
                                    }
                                    answers={pAnswers}
                                    setAnswers={setPAnswers}
                                    answerUI={answerUI}
                                />
                                <View style={{ marginBottom: 50 }}>{''}</View>
                            </ScrollView>
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                <BasicText
                                    inputText="Loading..."
                                    textWeight={600}
                                    textSize={17}
                                />
                            </View>
                        )}
                    </Fragment>
                )}
                {stage === 'Listening' && (
                    <Fragment>
                        {lQuestions ? (
                            <ScrollView style={{ flex: 1 }}>
                                <BasicText
                                    inputText="Listening Test"
                                    marginLeft={22}
                                    marginTop={20}
                                    textSize={20}
                                    textWeight={700}
                                />
                                <ListeningQuestion
                                    marginTop={2}
                                    marginLeft={22}
                                    marginRight={22}
                                    question={lQuestions}
                                    answer={lAnswer}
                                    setAnswer={setLAnswer}
                                    answerUI={lAnswerUI}
                                />
                                <View style={{ marginBottom: 50 }}>{''}</View>
                            </ScrollView>
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                <BasicText
                                    inputText="Loading..."
                                    textWeight={600}
                                    textSize={17}
                                />
                            </View>
                        )}
                    </Fragment>
                )}
                {stage === 'Writing' && (
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <Fragment>
                            {wQuestions ? (
                                <View style={{ flex: 1 }}>
                                    <BasicText
                                        inputText={`Remember to use the "Arrows" to cycle through all questions. There are ${wQuestions?.question?.length} questions in Total.`}
                                        marginLeft={22}
                                        marginRight={22}
                                        marginTop={8}
                                        textWeight={600}
                                    />
                                    <WritingQuestion
                                        marginTop={8}
                                        marginBottom={10}
                                        marginLeft={22}
                                        marginRight={22}
                                        question={wQuestions}
                                        placeHolderText={
                                            wQuestions?.question?.length === 8
                                                ? 'Using the format below, type what you hear here...\n\n1. The first statement...\n2. The second statement...\n3. ...\n4. ...\n5. ...\n6. ...\n7. ...\n8. ...'
                                                : wQuestions?.question
                                                      ?.length === 6
                                                ? 'Using the format below, type what you hear here...\n\n1. The first statement...\n2. The second statement...\n3. ...\n4. ...\n5. ...\n6. ...'
                                                : wQuestions?.question
                                                      ?.length === 4
                                                ? 'Using the format below, type what you hear here...\n\n1. The first statement...\n2. The second statement...\n3. ...\n4. ...'
                                                : 'Using the format below, type what you hear here...\n\n1. The first statement...\n2. The second statement...'
                                        }
                                        answer={wAnswer}
                                        setAnswer={setWAnswer}
                                        answerStatus={wAnswerStatus}
                                    />
                                </View>
                            ) : (
                                <View
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    <BasicText
                                        inputText="Loading..."
                                        textWeight={600}
                                        textSize={17}
                                    />
                                </View>
                            )}
                        </Fragment>
                        <BasicButton
                            buttonText="Next"
                            disabled={disableButton}
                            marginHorizontal={22}
                            marginBottom={screen_height_less_than({
                                if_true: 10,
                                if_false: 35,
                            })}
                            marginTop={3}
                            execFunc={on_press_next}
                            disableDebounce
                        />
                    </KeyboardAvoidingView>
                )}
                {stage !== 'Writing' && !lAnswerWrong && (
                    <BasicButton
                        buttonText="Next"
                        disabled={disableButton}
                        marginHorizontal={22}
                        marginBottom={screen_height_less_than({
                            if_true: 10,
                            if_false: 35,
                        })}
                        marginTop={3}
                        execFunc={on_press_next}
                        disableDebounce
                    />
                )}
                {stage !== 'Writing' && lAnswerWrong && (
                    <View
                        style={{
                            marginBottom: screen_height_less_than({
                                if_true: 10,
                                if_false: 35,
                            }),
                            flexDirection: 'row',
                            marginTop: 3,
                            marginHorizontal: 22,
                        }}>
                        {/* <View style={{ flex: 1, marginRight: 0 }}>
                            <BasicButton
                                buttonText="Find Out Why"
                                disabled={disableButton}
                                execFunc={() => find_out_why({})}
                                backgroundColor={Colors.LightPink}
                                disableDebounce
                            />
                        </View> */}
                        <View style={{ flex: 1, marginLeft: 0 }}>
                            <BasicButton
                                buttonText="Continue"
                                disabled={disableButton}
                                execFunc={start_writing_test}
                                disableDebounce
                            />
                        </View>
                    </View>
                )}
            </View>
        );
    } else {
        return null;
    }
});

export default PreTestPage;

const styles = StyleSheet.create({
    pre_test_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
