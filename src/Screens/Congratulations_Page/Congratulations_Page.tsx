import React, { FunctionComponent, useEffect, useState } from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    CommonActions,
    RouteProp,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { fonts } from '../../Configs/Fonts/Fonts';
import Colors from '../../Configs/Colors/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BackButton from '../../Components/Back_Button/Back_Button';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import Sound from 'react-native-sound';
import { useMutation } from 'react-query';
import {
    increase_lessons,
    update_study_target,
} from '../../Configs/Queries/Users/Users';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import {
    set_exam_score,
    set_homework_score,
} from '../../Configs/Queries/Lesson/Lesson';
import SInfo from 'react-native-sensitive-info';
import { INTF_UserInfo } from '../../Interface/User_Info/User_Info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_USER_INFO } from '@env';
import { INTF_AssignedClass } from '../../Interface/Assigned_Class/Assigned_Class';
import { gpt_request } from '../../Configs/Queries/Chat/Chat';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { AvatarVoiceStore } from '../../MobX/Avatar_Voice/Avatar_Voice';
import { SpeechControllerStore } from '../../MobX/Speech_Controller/Speech_Controller';
import { observer } from 'mobx-react';
import { global_variables } from '../../Configs/Global/Global_Variable';
import { ReTestStore } from '../../MobX/Re_Test/Re_Test';
import { info_handler } from '../../Utils/Info_Handler/Info_Handler';

const CongratulationsPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<any>>();

    const secondChance = ReTestStore.testCount < 3 || false;
    const isTakingTest = ReTestStore.isTakingTest || false;

    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [disableButton, setDisableButton] = useState<boolean>(false);
    const [sDisableSW, setSDisableSW] = useState<boolean>(false);

    const incorrectQ: {
        id: number;
        question: string;
        correct_answer: string;
        wrong_answer: string;
    }[] = route.params?.incorrect_q || [];

    const { mutate: update_study_target_mutate } = useMutation(
        update_study_target,
        {
            onMutate: () => {
                setDisableButton(true);
                setShowSpinner(true);
            },
            onSettled: async data => {
                if (data?.error) {
                    setShowSpinner(false);
                    setDisableButton(false);
                    error_handler({
                        navigation: navigation,
                        error_mssg:
                            'An error occured while trying to update Study Target!',
                        svr_error_mssg: data?.data,
                    });
                } else {
                    const prevUserInfo = UserInfoStore?.user_info;

                    const update_info_proceed = () => {
                        setShowSpinner(false);
                        setDisableButton(false);

                        UserInfoStore.set_user_info({
                            user_info: {
                                ...prevUserInfo,
                                study_target: 60,
                            },
                        });

                        info_handler({
                            navigation: navigation,
                            proceed_type: 4,
                            success_mssg:
                                'Your Personal Details has been updated successfully!',
                            svr_success_mssg: '',
                            hide_back_btn: true,
                            hide_header: false,
                        });
                    };

                    try {
                        await SInfo.setItem(
                            SECURE_STORAGE_USER_INFO,
                            JSON.stringify({
                                user_info: {
                                    ...prevUserInfo,
                                    study_target: 60,
                                },
                            }),
                            {
                                sharedPreferencesName: SECURE_STORAGE_NAME,
                                keychainService: SECURE_STORAGE_NAME,
                            },
                        )
                            .catch(err => {
                                err && update_info_proceed();
                            })
                            .then(() => {
                                update_info_proceed();
                            });
                    } catch (error) {
                        update_info_proceed();
                    }
                }
            },
        },
    );

    const { mutate: gpt_que_exp_mutate } = useMutation(gpt_request, {
        onMutate: () => {
            setSDisableSW(true);
            setShowSpinner(true);
        },
        onSettled: async data => {
            if (!data?.error) {
                if (data?.data?.chat_res) {
                    TextToSpeechStore.clear_speech();
                    TextToSpeechStore.play_speech({
                        speech: data?.data?.chat_res,
                        isMale: !AvatarVoiceStore.is_avatar_male,
                        femaleVoice: AvatarVoiceStore.avatar_female_voice,
                        maleVoice: AvatarVoiceStore.avatar_male_voice,
                        speechRate: SpeechControllerStore.rate,
                    });
                }
            }
            setShowSpinner(false);
            setSDisableSW(false);
        },
    });

    const pre_gpt_questions = ({
        data,
    }: {
        data: {
            id: number;
            question: string;
            correct_answer: string;
            wrong_answer: string;
        }[];
    }) => {
        let result = '';

        data.forEach((question, index) => {
            const questionNumber = index + 1;
            const explanation = `Explain why the answer to "${question.question}" is "${question.correct_answer}" and not "${question.wrong_answer}".\n`;

            result += `${questionNumber}. ${explanation} `;
        });

        return result.trim();
    };

    const explain_answer = no_double_clicks({
        execFunc: () => {
            if (incorrectQ?.length > 0) {
                const GPT_PROMPT = `Act as an English Tutor:\n\n${pre_gpt_questions(
                    { data: incorrectQ },
                )}\n\nNote: Keep your answer short for each of the questions, please. Explain all items in the array as stated above`;
                gpt_que_exp_mutate({
                    messages: [{ role: 'user', content: GPT_PROMPT }],
                });
            }
        },
    });

    const { mutate: increase_lessons_mutate } = useMutation(increase_lessons, {
        onMutate: () => {
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
                        'Something went wrong! Please go back and press Continue again.',
                    svr_error_mssg: data?.data,
                });
            } else {
                const prevInfo = UserInfoStore?.user_info;
                UserInfoStore.set_user_info({
                    user_info: {
                        ...prevInfo,
                        payment:
                            (prevInfo?.payment || 0) +
                            (route.params?.noOfLessons || 0),
                    },
                });

                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'HomeStack',
                            },
                        ],
                    }),
                );
            }
        },
    });

    const { mutate: set_hw_score_mutate } = useMutation(set_homework_score, {
        onMutate: () => {
            setShowSpinner(true);
        },
        onSettled: async data => {
            setShowSpinner(false);
            if (data?.error) {
                error_handler({
                    navigation: navigation,
                    error_mssg: 'Something went wrong!',
                    svr_error_mssg: data?.data,
                });
            } else {
                const oldLessons =
                    UserInfoStore?.user_info?.lessons !== undefined
                        ? [...UserInfoStore?.user_info?.lessons]
                        : [];

                const updateScoreById = ({
                    lesson_data,
                    lesson_id,
                    sub_lesson_id,
                    lesson_score,
                }: {
                    lesson_data: {
                        _id?: string | undefined;
                        id?: number | undefined;
                        score?: number[];
                    }[];
                    lesson_id: number;
                    sub_lesson_id: number;
                    lesson_score: number;
                }) => {
                    return lesson_data.map(obj => {
                        const scores: number[] = obj?.score || [];
                        if (obj.id === lesson_id) {
                            return {
                                ...obj,
                                score:
                                    (scores?.length || 0) > sub_lesson_id
                                        ? scores.map((val, ind) => {
                                              return ind === sub_lesson_id
                                                  ? lesson_score
                                                  : val;
                                          })
                                        : (scores?.length || 0) > 0
                                        ? [...scores, lesson_score]
                                        : [lesson_score],
                            };
                        }
                        return obj;
                    });
                };

                const newUserInfo: INTF_UserInfo = {
                    ...UserInfoStore?.user_info,
                    lessons: updateScoreById({
                        lesson_data: oldLessons,
                        lesson_id: route.params?.lesson_id,
                        sub_lesson_id: route.params?.sub_lesson_id,
                        lesson_score: route.params?.lesson_score,
                    }),
                };

                const proceed = () => {
                    UserInfoStore?.set_user_info({
                        user_info: newUserInfo,
                    });
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'HomeStack',
                                },
                            ],
                        }),
                    );
                };

                try {
                    await SInfo.setItem(
                        SECURE_STORAGE_USER_INFO,
                        JSON.stringify({
                            user_info: newUserInfo,
                        }),
                        {
                            sharedPreferencesName: SECURE_STORAGE_NAME,
                            keychainService: SECURE_STORAGE_NAME,
                        },
                    )
                        .catch(err => {
                            err && proceed();
                        })
                        .then(() => {
                            proceed();
                        });
                } catch (error) {
                    proceed();
                }
            }
        },
    });

    const { mutate: set_exam_score_mutate } = useMutation(set_exam_score, {
        onMutate: () => {
            setShowSpinner(true);
        },
        onSettled: async data => {
            setShowSpinner(false);
            if (data?.error) {
                error_handler({
                    navigation: navigation,
                    error_mssg: 'Something went wrong!',
                    svr_error_mssg: data?.data,
                });
            } else {
                const oldExams =
                    UserInfoStore?.user_info?.exams !== undefined
                        ? [...UserInfoStore?.user_info?.exams]
                        : [];

                const updateScoreById = ({
                    exam_data,
                    exam_level,
                    exam_score,
                }: {
                    exam_data: {
                        _id?: string;
                        level?: INTF_AssignedClass;
                        score?: number | null;
                    }[];
                    exam_level: INTF_AssignedClass;
                    exam_score: number;
                }) => {
                    return exam_data.map(obj => {
                        if (obj.level === exam_level) {
                            return {
                                ...obj,
                                score: exam_score,
                            };
                        }
                        return obj;
                    });
                };

                const newUserInfo: INTF_UserInfo = {
                    ...UserInfoStore?.user_info,
                    exams: updateScoreById({
                        exam_data: oldExams,
                        exam_level: route.params?.exam_level,
                        exam_score: route.params?.exam_score,
                    }),
                    level: data?.data?.level_up
                        ? data?.data?.level
                        : UserInfoStore?.user_info?.level,
                };

                const proceed = () => {
                    UserInfoStore?.set_user_info({
                        user_info: newUserInfo,
                    });

                    if (data?.data?.level_up) {
                        navigation.push(
                            'HomeStack' as never,
                            {
                                screen: 'CongratulationsPage',
                                params: {
                                    header_txt: 'Level Information!',
                                    message_txt: `Your level has been updated to ${data.data?.level}`,
                                    nextPage: 3,
                                    hide_back_btn: false,
                                    disable_sound: true,
                                },
                            } as never,
                        );
                    } else {
                        if (data?.data?.level === 'Confident') {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: '',
                                    params: {
                                        header_txt: 'Congratulation!',
                                        message_txt:
                                            'You have successfully completed all Lessons and Exams on Tutor AI',
                                        nextPage: 3,
                                        hide_back_btn: false,
                                        disable_sound: true,
                                    },
                                } as never,
                            );
                        } else {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'CongratulationsPage',
                                    params: {
                                        header_txt: 'Level Information!',
                                        message_txt: `A Pass mark of ${global_variables.passMark}% is required to move to the next level. Unfortunately, you scored ${route.params?.exam_score}%.`,
                                        nextPage: 3,
                                        hide_back_btn: false,
                                        hide_emoji: true,
                                        disable_sound: true,
                                        anim_2: true,
                                    },
                                } as never,
                            );
                        }
                    }
                };

                try {
                    await SInfo.setItem(
                        SECURE_STORAGE_USER_INFO,
                        JSON.stringify({
                            user_info: newUserInfo,
                        }),
                        {
                            sharedPreferencesName: SECURE_STORAGE_NAME,
                            keychainService: SECURE_STORAGE_NAME,
                        },
                    )
                        .catch(err => {
                            err && proceed();
                        })
                        .then(() => {
                            proceed();
                        });
                } catch (error) {
                    proceed();
                }
            }
        },
    });

    const retake_test = no_double_clicks({
        execFunc: () => {
            ReTestStore.disable_re_test();
            navigation.push(
                'AuthStack' as never,
                { screen: 'PreTestPage' } as never,
            );
        },
    });

    const proceed = no_double_clicks({
        execFunc: () => {
            TextToSpeechStore.clear_speech();
            switch (route.params?.nextPage) {
                case 1:
                    navigation.push(
                        'AuthStack' as never,
                        {
                            screen: 'PreAvatarPage',
                        } as never,
                    );
                    break;
                case 2:
                    navigation.push(
                        'HomeStack' as never,
                        { screen: 'HomePage' } as never,
                    );
                    break;
                case 3:
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'HomeStack',
                                },
                            ],
                        }),
                    );
                    break;
                case 4:
                    navigation.push(
                        'AuthStack' as never,
                        { screen: 'OnboardingPage' } as never,
                    );
                    break;
                case 5:
                    increase_lessons_mutate({
                        userAuth: UserInfoStore.user_info.accessToken as string,
                        noOfLessons: route.params?.noOfLessons,
                    });
                    break;
                case 6:
                    set_hw_score_mutate({
                        userAuth: UserInfoStore?.user_info
                            ?.accessToken as string,
                        lessonId: route.params.lesson_id,
                        subLessonId: route.params?.sub_lesson_id,
                        lessonScore: route.params?.lesson_score,
                    });
                    break;
                case 7:
                    set_exam_score_mutate({
                        userAuth: UserInfoStore?.user_info
                            ?.accessToken as string,
                        examLevel: route.params.exam_level,
                        examScore: route.params?.exam_score,
                    });
                    break;
                case 8:
                    update_study_target_mutate({
                        uid: UserInfoStore?.user_info?._id as string,
                        studyTarget: 60,
                    });
                    break;
                case 9:
                    navigation.push(
                        'HomeStack' as never,
                        {
                            screen: 'HomeWorkQPage',
                            params: {
                                lesson_id: route.params?.lesson_id,
                                sub_lesson_id: route.params?.sub_lesson_id,
                                user_level: route.params?.user_level,
                                retake: false,
                            },
                        } as never,
                    );
                    break;
                default:
                    navigation.push(
                        'AuthStack' as never,
                        {
                            screen: 'OnboardingPage',
                        } as never,
                    );
                    break;
            }
        },
    });

    useEffect(() => {
        Sound.setCategory('Playback');
        const congrats_sound = new Sound(
            'congrats.mp3',
            Sound.MAIN_BUNDLE,
            error => {
                if (error) {
                    return;
                } else {
                    if (route.params?.disable_sound) {
                        return;
                    } else {
                        congrats_sound.play(success => {
                            if (success) {
                                return;
                            } else {
                                return;
                            }
                        });
                    }
                }
            },
        );
        return () => {
            congrats_sound.release();
        };
    }, [route.params?.disable_sound]);

    return (
        <View style={{ flex: 1 }}>
            <CustomStatusBar
                backgroundColor={Colors.Background}
                lightContent={false}
            />
            <OverlaySpinner
                showSpinner={showSpinner}
                setShowSpinner={setShowSpinner}
            />
            <ScrollView
                style={{
                    flex: 1,
                    backgroundColor: Colors.Background,
                }}>
                <View style={styles.cgt_main}>
                    <View
                        style={{
                            marginLeft: 22,
                            marginTop: navigation?.canGoBack()
                                ? Platform.OS === 'ios'
                                    ? 56
                                    : 25
                                : Platform.OS === 'ios'
                                ? 70
                                : 25,
                            marginBottom: 15,
                        }}>
                        {!route.params?.hide_back_btn &&
                            navigation.canGoBack() && <BackButton />}
                    </View>
                    <LottieView
                        style={{
                            transform: [{ scale: 1 }],
                            width: 280,
                            minWidth: 280,
                            maxWidth: 280,
                            position: 'relative',
                            alignSelf: 'center',
                        }}
                        source={
                            route.params?.anim_2
                                ? require('../../Animations/An_Error_Occured.json')
                                : require('../../Animations/Congratulations.json')
                        }
                        autoPlay
                        loop={true}
                        resizeMode="cover"
                        speed={1.7}
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 30,
                        }}>
                        <Text
                            style={[
                                styles.e_m_err_txt,
                                styles.e_m_err_txt_h,
                                {
                                    fontSize: 28,
                                },
                            ]}>
                            {route?.params?.header_txt || ''}
                        </Text>
                        {route.params?.hide_emoji ? null : (
                            <Image
                                style={{
                                    width: 30,
                                    height: 30,
                                    marginLeft: 4,
                                }}
                                source={require('../../Images/Icons/Congratulations.png')}
                            />
                        )}
                    </View>
                    <Text
                        style={[
                            styles.e_m_err_txt,
                            {
                                marginTop: 10,
                                maxWidth: 280,
                            },
                        ]}>
                        {route?.params?.message_txt || ''}
                    </Text>
                </View>
            </ScrollView>
            {incorrectQ?.length > 0 ? (
                <View
                    style={{
                        flexDirection: 'row',
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 10,
                                      if_false: 40,
                                  })
                                : 20,
                        backgroundColor: Colors.Background,
                    }}>
                    <View style={{ flex: 1, marginLeft: 22, marginRight: 5 }}>
                        <BasicButton
                            disabled={sDisableSW}
                            buttonText="Find Out Why"
                            execFunc={() => explain_answer({})}
                            backgroundColor={Colors.LightPink}
                        />
                    </View>
                    <View style={{ flex: 1, marginRight: 22, marginLeft: 5 }}>
                        <BasicButton
                            disabled={disableButton}
                            buttonText={
                                route.params?.show_start ? 'Start' : 'Continue'
                            }
                            execFunc={() => proceed({})}
                        />
                    </View>
                </View>
            ) : secondChance &&
              isTakingTest &&
              (route.params?.show_retake || false) ? (
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: Colors.Background,
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 10,
                                      if_false: 40,
                                  })
                                : 20,
                    }}>
                    <View style={{ flex: 1, marginLeft: 22, marginRight: 5 }}>
                        <BasicButton
                            disabled={disableButton}
                            buttonText="Retake Test"
                            execFunc={() => retake_test({})}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 5, marginRight: 22 }}>
                        <BasicButton
                            disabled={disableButton}
                            buttonText={
                                route.params?.show_start ? 'Start' : 'Continue'
                            }
                            execFunc={() => proceed({})}
                        />
                    </View>
                </View>
            ) : (
                <BasicButton
                    disabled={disableButton}
                    buttonText={route.params?.show_start ? 'Start' : 'Continue'}
                    marginHorizontal={22}
                    execFunc={() => proceed({})}
                    marginBottom={
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_true: 10,
                                  if_false: 40,
                              })
                            : 20
                    }
                />
            )}
        </View>
    );
});

export default CongratulationsPage;

const styles = StyleSheet.create({
    cgt_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    e_m_bb: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        marginTop: 30,
        marginLeft: 5,
        marginBottom: 20,
    },
    e_m_err_txt: {
        textAlign: 'center',
        alignSelf: 'center',
        fontFamily: fonts.Urbanist_500,
        fontSize: 16,
        color: Colors.DarkGrey,
    },
    e_m_err_txt_h: {
        fontFamily: fonts.Urbanist_700,
        fontSize: 19,
        color: Colors.Primary,
    },
});
