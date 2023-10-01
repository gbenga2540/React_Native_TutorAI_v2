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
import { INTF_HomeWork } from '../../Interface/HomeWork/HomeWork';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { alphabets } from '../../Data/Alphabets/Alphabets';
import {
    RouteProp,
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import BackButton from '../../Components/Back_Button/Back_Button';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import MiniAvatar from '../../Components/Mini_Avatar/Mini_Avatar';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import Sound from 'react-native-sound';
import { clamp_value } from '../../Utils/Clamp_Value/Clamp_Value';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { useMutation } from 'react-query';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import TextButton from '../../Components/Text_Button/Text_Button';
import { global_variables } from '../../Configs/Global/Global_Variable';
import SelectableText from '../../Components/Selectable_Text/Selectable_Text';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { getGoogleTranslate } from '../../Hooks/Get_Google_Translate/Get_Google_Translate';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';

const HomeWorkQPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<any>>();
    Sound.setCategory('Playback');

    const get_lesson_topic = (): { topic: string; sub_topic: string } => {
        const all_data = LessonTopicsStore.all_topics;

        const hw_topic = all_data.filter(
            item => item.lesson_id === route.params?.lesson_id,
        )?.[0];

        return {
            topic: hw_topic.lesson_topic,
            sub_topic: hw_topic.lesson_sub_topic[route.params?.sub_lesson_id],
        };
    };

    const __NO_OF_HOMEWORK__ = 5;
    const GPT_HOMEWORK_PROMPT = `Generate a set of multiple choice questions and answers for an English lesson on the topic of [TOPIC]. Include [NUMBER_OF_QUESTIONS] questions. For each question, provide four options (A, B, C, and D), and indicate the correct answer using the format: 'Correct answer: [A/B/C/D]'.\n\nTopic: '${
        get_lesson_topic()?.topic
    }: ${
        get_lesson_topic()?.sub_topic
    }'\nNumber of questions: ${__NO_OF_HOMEWORK__}\n\nQuestion 1:\n[QUESTION_1]\nA) [OPTION_A_1]\nB) [OPTION_B_1]\nC) [OPTION_C_1]\nD) [OPTION_D_1]\nCorrect answer: [CORRECT_ANSWER_1]\n\nQuestion 2:\n[QUESTION_2]\nA) [OPTION_A_2]\nB) [OPTION_B_2]\nC) [OPTION_C_2]\nD) [OPTION_D_2]\nCorrect answer: [CORRECT_ANSWER_2]\n\n\n...\n\n\nQuestion [NUMBER_OF_QUESTIONS]:\n[QUESTION_N]\nA) [OPTION_A_N]\nB) [OPTION_B_N]\nC) [OPTION_C_N]\nD) [OPTION_D_N]\nCorrect answer: [CORRECT_ANSWER_N]`;

    const [errorFound, setErrorFound] = useState<boolean>(false);
    const [userScore, setUserScore] = useState<number>(0);
    const [questions, setQuestions] = useState<INTF_HomeWork[]>([]);
    const [currentQue, setCurrentQue] = useState<string>('');
    const noOfQuestions = questions?.length;
    const [currentQ, setCurrentQ] = useState<number>(0);
    const [answer, setAnswer] = useState<string>('');
    const [canAnswer, setCanAnswer] = useState<boolean>(true);
    const [answerUI, setAnswerUI] = useState<'NoChange' | 'Correct' | 'Wrong'>(
        'NoChange',
    );
    const [showWhy, setShowWhy] = useState<boolean>(false);
    const [sDisableSW, setSDisableSW] = useState<boolean>(false);

    const [showT, setShowT] = useState<boolean>(false);
    const [translation, setTranslation] = useState<string>('');

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [gptAnswer, setGPTAnswer] = useState<string>('');
    const [showSpinner, setShowSpinner] = useState<boolean>(false);

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

    const { mutate: gpt_que_exp_mutate } = useMutation(gpt_request, {
        onMutate: () => {
            setSDisableSW(true);
            setShowSpinner(true);
        },
        onSettled: async data => {
            if (!data?.error) {
                if (data?.data?.chat_res) {
                    setGPTAnswer(data?.data?.chat_res);
                    TextToSpeechStore.clear_speech();
                    TextToSpeechStore.play_speech({
                        speech: data?.data?.chat_res,
                        isMale: !AvatarVoiceStore.is_avatar_male,
                        femaleVoice: AvatarVoiceStore.avatar_female_voice,
                        maleVoice: AvatarVoiceStore.avatar_male_voice,
                        speechRate: SpeechControllerStore.rate,
                    });
                    setOpenModal(true);
                }
            }
            setSDisableSW(false);
            setShowSpinner(false);
        },
    });

    const convert_data = ({ data }: { data: string }): INTF_HomeWork[] => {
        const t_questions = data.split('\n\n');
        const parsedQuestions: INTF_HomeWork[] = [];

        t_questions.forEach(questionText => {
            const questionLines = questionText.split('\n');
            if (questionLines.length === 7) {
                const questionObj = {
                    question: questionLines[1],
                    options: [],
                    answer: questionLines[6].split(': ')[1],
                    lesson_id: route.params?.lesson_id,
                };
                for (let i = 2; i < questionLines.length - 1; i++) {
                    const optionText = questionLines[i].substring(2);
                    questionObj.options.push(optionText?.trim() as never);
                }
                parsedQuestions.push(questionObj);
            }
        });

        const finalQuestions: INTF_HomeWork[] = [];
        parsedQuestions.map(item => {
            const answer_index: number =
                item.answer === 'A'
                    ? 0
                    : item.answer === 'B'
                    ? 1
                    : item.answer === 'C'
                    ? 2
                    : 3;
            const p_questions = {
                question: item.question,
                options: item.options,
                answer: item.options[answer_index],
                lesson_id: item.lesson_id,
            };
            finalQuestions.push(p_questions);
        });
        return finalQuestions;
    };

    const {
        mutate: gpt_gen_que_mutate,
        isError,
        isLoading,
    } = useMutation(gpt_request, {
        onMutate: () => {
            setSDisableSW(true);
            setShowSpinner(true);
            setErrorFound(false);
        },
        onSettled: data => {
            if (data?.error) {
                setSDisableSW(false);
                setShowSpinner(false);
            } else {
                if (data?.data?.chat_res) {
                    const p_questions = convert_data({
                        data: data?.data?.chat_res,
                    });
                    setSDisableSW(false);
                    setShowSpinner(false);
                    if (p_questions?.length === __NO_OF_HOMEWORK__) {
                        setQuestions(p_questions);
                    } else {
                        setErrorFound(true);
                    }
                } else {
                    setSDisableSW(false);
                    setShowSpinner(false);
                }
            }
        },
    });

    useEffect(() => {
        setErrorFound(false);
        gpt_gen_que_mutate({
            messages: [{ role: 'user', content: GPT_HOMEWORK_PROMPT }],
        });
    }, [gpt_gen_que_mutate, GPT_HOMEWORK_PROMPT]);

    const close_translate = no_double_clicks({
        execFunc: () => {
            setOpenModal(false);
            setGPTAnswer('');
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

    const explain_answer = no_double_clicks({
        execFunc: () => {
            const GPT_PROMPT = `Act as an English Tutor:\nExplain why the answer to the question "${questions[currentQ]?.question}" is "${questions[currentQ]?.answer}" and not "${answer}"?.\nNote: Keep your answer short, please.`;
            gpt_que_exp_mutate({
                messages: [{ role: 'user', content: GPT_PROMPT }],
            });
        },
    });

    const refetch_homework = no_double_clicks({
        execFunc: () => {
            setErrorFound(false);
            gpt_gen_que_mutate({
                messages: [{ role: 'user', content: GPT_HOMEWORK_PROMPT }],
            });
        },
    });

    const next_question = no_double_clicks({
        execFunc: () => {
            if (currentQ < noOfQuestions) {
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
            } else {
                if (noOfQuestions > 1) {
                    if (route.params?.retake) {
                        if (
                            Math.floor((userScore / noOfQuestions) * 100) ===
                            100
                        ) {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: 'You scored 100%',
                                        nextPage: 6,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                    },
                                } as never,
                            );
                        } else if (
                            Math.floor((userScore / noOfQuestions) * 100) >
                            (UserInfoStore?.user_info?.lessons?.filter(
                                item => item?.id === route.params?.lesson_id,
                            )?.[0]?.score?.[route.params?.lesson_id] || 0)
                        ) {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: `You scored ${Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        )}%`,
                                        nextPage: 6,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                    },
                                } as never,
                            );
                        } else {
                            if (
                                Math.floor((userScore / noOfQuestions) * 100) >=
                                global_variables.passMark
                            ) {
                                navigation.push(
                                    'HomeStack' as never,
                                    {
                                        screen: 'CongratulationsPage',
                                        params: {
                                            header_txt: 'Homework Completed.',
                                            message_txt: `You scored ${Math.floor(
                                                (userScore / noOfQuestions) *
                                                    100,
                                            )}%`,
                                            nextPage: 6,
                                            hide_back_btn: true,
                                            lesson_id: route.params?.lesson_id,
                                            sub_lesson_id:
                                                route.params?.sub_lesson_id,
                                            lesson_score: Math.floor(
                                                (userScore / noOfQuestions) *
                                                    100,
                                            ),
                                        },
                                    } as never,
                                );
                            } else {
                                navigation.push(
                                    'HomeStack' as never,
                                    {
                                        screen: 'CongratulationsPage',
                                        params: {
                                            header_txt: 'Homework Completed.',
                                            message_txt: `You have completed ${Math.floor(
                                                (userScore / noOfQuestions) *
                                                    100,
                                            )}% of the tasks! Not bad, but to gain access to the next lesson, we encourage you to strive for at least ${
                                                global_variables.passMark
                                            }% completion. Don't worry, we're here to support you every step of the way. We are offering additional tasks to help you achieve your goal. Remember, your progress is key to unlocking the next level of learning. Simply tap the "Start" button to keep moving forward! You can do it!`,
                                            nextPage: 9,
                                            hide_back_btn: true,
                                            hide_emoji: true,
                                            disable_sound: true,
                                            anim_2: true,
                                            show_start: true,
                                            lesson_id: route.params?.lesson_id,
                                            sub_lesson_id:
                                                route.params?.sub_lesson_id,
                                            user_level:
                                                route.params?.user_level,
                                        },
                                    } as never,
                                );
                            }
                        }
                    } else {
                        if (
                            Math.floor((userScore / noOfQuestions) * 100) >=
                            global_variables.passMark
                        ) {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: `You scored ${Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        )}%`,
                                        nextPage: 6,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                    },
                                } as never,
                            );
                        } else {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: `You have completed ${Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        )}% of the tasks! Not bad, but to gain access to the next lesson, we encourage you to strive for at least ${
                                            global_variables.passMark
                                        }% completion. Don't worry, we're here to support you every step of the way. We are offering additional tasks to help you achieve your goal. Remember, your progress is key to unlocking the next level of learning. Simply tap the "Start" button to keep moving forward! You can do it!`,
                                        nextPage: 9,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                        hide_emoji: true,
                                        anim_2: true,
                                        disable_sound: true,
                                        show_start: true,
                                        user_level: route.params?.user_level,
                                    },
                                } as never,
                            );
                        }
                    }
                }
            }
            setShowWhy(false);
        },
    });

    const on_press_next = no_double_clicks({
        execFunc: () => {
            setShowT(false);
            setTranslation('');
            if (currentQ < noOfQuestions) {
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
                                        // nextQuestion();
                                        setShowWhy(true);
                                    } else {
                                        wrong_sound.play(success => {
                                            if (success) {
                                                // nextQuestion();
                                                setShowWhy(true);
                                            } else {
                                                // nextQuestion();
                                                setShowWhy(true);
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
                    if (route.params?.retake) {
                        if (
                            Math.floor((userScore / noOfQuestions) * 100) ===
                            100
                        ) {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: 'You scored 100%',
                                        nextPage: 6,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                    },
                                } as never,
                            );
                        } else if (
                            Math.floor((userScore / noOfQuestions) * 100) >
                            (UserInfoStore?.user_info?.lessons?.filter(
                                item => item?.id === route.params?.lesson_id,
                            )?.[0]?.score?.[route.params?.lesson_id] || 0)
                        ) {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: `You scored ${Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        )}%`,
                                        nextPage: 6,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                    },
                                } as never,
                            );
                        } else {
                            if (
                                Math.floor((userScore / noOfQuestions) * 100) >=
                                global_variables.passMark
                            ) {
                                navigation.push(
                                    'HomeStack' as never,
                                    {
                                        screen: 'CongratulationsPage',
                                        params: {
                                            header_txt: 'Homework Completed.',
                                            message_txt: `You scored ${Math.floor(
                                                (userScore / noOfQuestions) *
                                                    100,
                                            )}%`,
                                            nextPage: 6,
                                            hide_back_btn: true,
                                            lesson_id: route.params?.lesson_id,
                                            sub_lesson_id:
                                                route.params?.sub_lesson_id,
                                            lesson_score: Math.floor(
                                                (userScore / noOfQuestions) *
                                                    100,
                                            ),
                                        },
                                    } as never,
                                );
                            } else {
                                navigation.push(
                                    'HomeStack' as never,
                                    {
                                        screen: 'CongratulationsPage',
                                        params: {
                                            header_txt: 'Homework Completed.',
                                            message_txt: `You have completed ${Math.floor(
                                                (userScore / noOfQuestions) *
                                                    100,
                                            )}% of the tasks! Not bad, but to gain access to the next lesson, we encourage you to strive for at least ${
                                                global_variables.passMark
                                            }% completion. Don't worry, we're here to support you every step of the way. We are offering additional tasks to help you achieve your goal. Remember, your progress is key to unlocking the next level of learning. Simply tap the "Start" button to keep moving forward! You can do it!`,
                                            nextPage: 9,
                                            hide_back_btn: true,
                                            hide_emoji: true,
                                            disable_sound: true,
                                            anim_2: true,
                                            show_start: true,
                                            lesson_id: route.params?.lesson_id,
                                            sub_lesson_id:
                                                route.params?.sub_lesson_id,
                                            user_level:
                                                route.params?.user_level,
                                        },
                                    } as never,
                                );
                            }
                        }
                    } else {
                        if (
                            Math.floor((userScore / noOfQuestions) * 100) >=
                            global_variables.passMark
                        ) {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: `You scored ${Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        )}%`,
                                        nextPage: 6,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                    },
                                } as never,
                            );
                        } else {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Homework Completed.',
                                        message_txt: `You have completed ${Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        )}% of the tasks! Not bad, but to gain access to the next lesson, we encourage you to strive for at least ${
                                            global_variables.passMark
                                        }% completion. Don't worry, we're here to support you every step of the way. We are offering additional tasks to help you achieve your goal. Remember, your progress is key to unlocking the next level of learning. Simply tap the "Start" button to keep moving forward! You can do it!`,
                                        nextPage: 9,
                                        hide_back_btn: true,
                                        lesson_id: route.params?.lesson_id,
                                        sub_lesson_id:
                                            route.params?.sub_lesson_id,
                                        lesson_score: Math.floor(
                                            (userScore / noOfQuestions) * 100,
                                        ),
                                        hide_emoji: true,
                                        anim_2: true,
                                        disable_sound: true,
                                        show_start: true,
                                        user_level: route.params?.user_level,
                                    },
                                } as never,
                            );
                        }
                    }
                }
            }
        },
        debounceTime: 1200,
    });

    useEffect(() => {
        setCurrentQue(questions[currentQ]?.question);
    }, [currentQ, questions]);

    useEffect(() => {
        setShowT(false);
        setTranslation('');
        TextToSpeechStore.clear_speech();
        if (currentQ < noOfQuestions) {
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
        currentQue,
    ]);

    useFocusEffect(
        useCallback(() => {
            const handleBackPress = () => {
                TextToSpeechStore.clear_speech();
                if (Keyboard.isVisible()) {
                    Keyboard.dismiss();
                }
                navigation.goBack();
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            return () =>
                BackHandler.removeEventListener(
                    'hardwareBackPress',
                    handleBackPress,
                );
        }, [navigation]),
    );

    if (isError || errorFound) {
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
                    <BackButton />
                    <BasicText
                        inputText="HomeWork"
                        textSize={20}
                        textWeight={700}
                        marginLeft={10}
                    />
                </View>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <BasicText
                        inputText="An Error Occured! Please make sure your are connected to the Internet and Try Again!"
                        width={270}
                        textAlign={'center'}
                    />
                </View>
                <BasicButton
                    execFunc={() => refetch_homework({})}
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
    } else {
        return (
            <View style={styles.hw_main}>
                <CustomStatusBar backgroundColor={Colors.Background} />
                <OverlaySpinner
                    showSpinner={
                        showSpinner || questions?.length === 0 || isLoading
                    }
                    setShowSpinner={setShowSpinner}
                />
                {openModal && (
                    <View
                        style={{
                            flex: 1,
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            zIndex: 11,
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            justifyContent: 'flex-end',
                        }}>
                        <View
                            style={{
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
                            }}>
                            <TextButton
                                buttonText="Close"
                                marginLeft={'auto'}
                                marginRight={16}
                                marginTop={13}
                                execFunc={close_translate}
                                textColor={Colors.Red}
                                marginBottom={7}
                            />
                            <BasicText
                                inputText="Explanation:"
                                marginLeft={22}
                                marginRight={22}
                                textWeight={700}
                                textSize={17}
                                marginBottom={4}
                            />
                            <ScrollView
                                style={{
                                    minHeight: 150,
                                    maxHeight: screen_height_less_than({
                                        min_height: 500,
                                        if_false: 530,
                                        if_true: 400,
                                    }),
                                    marginBottom: screen_height_less_than({
                                        if_true: 10,
                                        if_false: 35,
                                    }),
                                }}>
                                <BasicText
                                    inputText={gptAnswer}
                                    marginLeft={22}
                                    marginRight={22}
                                    textSize={16}
                                />
                            </ScrollView>
                        </View>
                    </View>
                )}
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
                    <BackButton />
                    <BasicText
                        inputText="HomeWork"
                        textSize={20}
                        textWeight={700}
                        marginLeft={10}
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
                                {questions[currentQ].options?.map(
                                    (item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() =>
                                                select_answers({
                                                    selected: item,
                                                })
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
                                                            : answerUI ===
                                                              'Correct'
                                                            ? Colors.Green3
                                                            : Colors.Primary
                                                        : Colors.Grey,
                                                borderRadius: 10,
                                                backgroundColor:
                                                    answer === item
                                                        ? answerUI === 'Wrong'
                                                            ? Colors.Red
                                                            : answerUI ===
                                                              'Correct'
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
                                    ),
                                )}
                            </View>
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                {questions?.length !== 0 && (
                                    <BasicText
                                        inputText="Click Next to Proceed..."
                                        textWeight={600}
                                        textSize={16}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
                {showWhy ? (
                    <View
                        style={{
                            marginTop: 3,
                            marginBottom: screen_height_less_than({
                                if_true: 10,
                                if_false: 35,
                            }),
                            marginHorizontal: 22,
                            flexDirection: 'row',
                        }}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <BasicButton
                                buttonText="Find Out Why"
                                backgroundColor={Colors.LightPink}
                                execFunc={() => explain_answer({})}
                                disabled={sDisableSW}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <BasicButton
                                buttonText="Next"
                                execFunc={() => next_question({})}
                            />
                        </View>
                    </View>
                ) : (
                    <BasicButton
                        buttonText="Next"
                        marginHorizontal={22}
                        marginBottom={screen_height_less_than({
                            if_true: 10,
                            if_false: 35,
                        })}
                        marginTop={3}
                        execFunc={() => on_press_next({})}
                        disableDebounce={false}
                    />
                )}
            </View>
        );
    }
});

export default HomeWorkQPage;

const styles = StyleSheet.create({
    hw_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
