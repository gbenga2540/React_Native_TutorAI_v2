import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    Image,
    TouchableOpacity,
    Platform,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import { fonts } from '../../Configs/Fonts/Fonts';
import StarIcon from '../../Images/SVGs/Star_Icon.svg';
import ProgressBar from '../../Components/Progress_Bar/Progress_Bar';
import SimpleBIcon from '../../Images/SVGs/Simple_B_Icon.svg';
import FireIcon from '../../Images/SVGs/Fire_Icon.svg';
import CheckMark from '../../Components/Check_Mark/Check_Mark';
import Feather from 'react-native-vector-icons/Feather';
import VocabularyIcon from '../../Images/SVGs/Vocabulary_Icon.svg';
import StatsReportIcon from '../../Images/SVGs/Stats_Report_Icon.svg';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { observer } from 'mobx-react';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { http_link_fix } from '../../Utils/HTTP_Link_Fix/HTTP_Link_Fix';
import { get_day_from_date } from '../../Utils/Get_Day_From_Date/Get_Day_From_Date';
import { INTF_AssignedClass } from '../../Interface/Assigned_Class/Assigned_Class';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { INTF_LessonTopics } from '../../Interface/Lesson/Lesson';
import { global_variables } from '../../Configs/Global/Global_Variable';
import { pushShowNotification } from '../../Notifications/Notification';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';

const HomePage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const UserInfo = UserInfoStore?.user_info;
    const UserLevel = UserInfo?.level || 'Beginner';
    const UserLessonsScore = useMemo(
        () => UserInfo?.lessons || [],
        [UserInfo?.lessons],
    );

    const [examTShow, setExamTShow] = useState<INTF_AssignedClass>(null);
    const [currentLessons, setCurrentLessons] = useState<INTF_LessonTopics[]>(
        LessonTopicsStore.beginner_topics,
    );

    const take_exam = no_double_clicks({
        execFunc: () => {
            navigation.navigate('HomeStack', {
                screen: 'ExamQPage',
                params: { CurrentLevel: examTShow },
            });
        },
    });

    const nav_to_voc_page = no_double_clicks({
        execFunc: () => {
            navigation.push(
                'HomeStack' as never,
                {
                    screen: 'VocabularyPage',
                } as never,
            );
        },
    });

    const get_level_number = () => {
        switch (UserInfoStore?.user_info?.level) {
            case 'Beginner':
                return '1';
            case 'Pre-Intermediate':
                return '2';
            case 'Intermediate':
                return '3';
            case 'Upper-Intermediate':
                return '4';
            case 'Confident':
                return '5';
            default:
                return '1';
        }
    };

    // !Total Homework Done
    const total_homework_done = useCallback((): number => {
        let homework_done = 0;
        const my_lessons = UserLessonsScore?.filter(
            item => item?.id?.toString()?.[0] === get_level_number(),
        );

        if (my_lessons?.length > 0) {
            my_lessons.map(item => {
                homework_done += item?.score?.length || 0;
            });
            return homework_done;
        } else {
            return 0;
        }
    }, [UserLessonsScore]);

    // !Total Homework/Lessons
    const total_homework_or_lessons = useCallback((): number => {
        let total_lessons = 0;
        if (currentLessons?.length > 0) {
            currentLessons?.map(item => {
                total_lessons += item?.lesson_sub_topic?.length;
            });
            return total_lessons;
        } else {
            return 0;
        }
    }, [currentLessons]);

    // !Total Lessons Done
    const total_lessons_done = (): number => {
        let _total_lessons = 0;
        const my_lessons = UserLessonsScore?.filter(
            item => item?.id?.toString()?.[0] === get_level_number(),
        );
        if (my_lessons?.length > 0) {
            my_lessons.map(item => {
                _total_lessons += item?.lessons || 0;
            });
            return _total_lessons;
        } else {
            return 0;
        }
    };

    useEffect(() => {
        switch (UserLevel) {
            case 'Beginner':
                setCurrentLessons(LessonTopicsStore.beginner_topics);
                break;
            case 'Pre-Intermediate':
                setCurrentLessons(LessonTopicsStore.pre_intermediate_topics);
                break;
            case 'Intermediate':
                setCurrentLessons(LessonTopicsStore.intermediate_topics);
                break;
            case 'Upper-Intermediate':
                setCurrentLessons(LessonTopicsStore.upper_intermediate_topics);
                break;
            case 'Confident':
                setCurrentLessons(LessonTopicsStore.confident_topics);
                break;
            default:
                setCurrentLessons(LessonTopicsStore.beginner_topics);
                break;
        }
    }, [UserLevel]);

    useEffect(() => {
        if (total_homework_done() === total_homework_or_lessons()) {
            const my_lessons = UserInfo.lessons?.filter(
                item => item?.id?.toString()?.[0] === get_level_number(),
            );

            //! Add all scores into one array
            const all_scores: number[] = [];
            my_lessons?.map(item => {
                item?.score?.map(data => {
                    all_scores.push(data);
                });
            });

            if (all_scores?.length > 0) {
                const average =
                    all_scores?.reduce(
                        (accumulator, currentVal) => accumulator + currentVal,
                        0,
                    ) / all_scores?.length;
                //! Current Level Homework Average is greater than the minimum required for exam
                if (average >= global_variables.examPassMark) {
                    if (UserInfo?.initialLevel === UserInfo?.level) {
                        //! Basically asking if the exam has been passed at Confident Stage
                        if (
                            UserInfo?.level === 'Confident' &&
                            (UserInfo?.exams?.filter(
                                item => item?.level === 'Confident',
                            )?.[0]?.score || 0) >= global_variables.examPassMark
                        ) {
                            setExamTShow(null);
                        } else {
                            setExamTShow(UserInfo?.level || null);
                            pushShowNotification({
                                title: 'Tutor AI Exam Notification',
                                message: `${UserInfo?.level} Level Exam Ready! Please, check the Home Page to begin your Exam. Goodluck!`,
                            });
                        }
                    } else {
                        //! Basically asking if the exam has been passed at Confident Stage
                        if (
                            UserInfo?.level === 'Confident' &&
                            (UserInfo?.exams?.filter(
                                item => item?.level === 'Confident',
                            )?.[0]?.score || 0) >= global_variables.examPassMark
                        ) {
                            setExamTShow(null);
                        } else {
                            if (UserInfo?.level === 'Beginner') {
                                setExamTShow('Beginner');
                                pushShowNotification({
                                    title: 'Tutor AI Exam Notification',
                                    message:
                                        'Beginner Level Exam Ready! Please, check the Home Page to begin your Exam. Goodluck!',
                                });
                            } else {
                                const return_prev_level =
                                    (): INTF_AssignedClass => {
                                        switch (UserInfo?.level) {
                                            case 'Pre-Intermediate':
                                                return 'Beginner';
                                            case 'Intermediate':
                                                return 'Pre-Intermediate';
                                            case 'Upper-Intermediate':
                                                return 'Intermediate';
                                            case 'Confident':
                                                return 'Upper-Intermediate';
                                            default:
                                                return 'Beginner';
                                        }
                                    };

                                //! Checking previous level exam score to know if student is eligible for the next exam
                                if (
                                    (UserInfo?.exams?.filter(
                                        item =>
                                            item?.level === return_prev_level(),
                                    )?.[0]?.score || 0) >=
                                    global_variables.examPassMark
                                ) {
                                    setExamTShow(UserInfo?.level || null);
                                    pushShowNotification({
                                        title: 'Tutor AI Exam Notification',
                                        message: `${UserInfo?.level} Level Exam Ready! Please, check the Home Page to begin your Exam. Goodluck!`,
                                    });
                                } else {
                                    setExamTShow(null);
                                }
                            }
                        }
                    }
                } else {
                    setExamTShow(null);
                }
            } else {
                setExamTShow(null);
            }
        } else {
            setExamTShow(null);
        }
    }, [total_homework_done, total_homework_or_lessons, UserInfo]);

    return (
        <View style={styles.home_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
            <View style={styles.h_header_cont}>
                <View style={styles.h_header_txt_c}>
                    <BasicText
                        inputText={`Hello, ${
                            UserInfoStore?.user_info?.fullname?.split(' ')?.[0]
                        }`}
                        textSize={22}
                        textWeight={700}
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <BasicText
                            inputText={
                                examTShow !== null
                                    ? `${examTShow} Exam`
                                    : `${
                                          total_homework_done() ===
                                          total_lessons_done()
                                              ? 'No'
                                              : '1'
                                      } Pending Homework`
                            }
                            textSize={13}
                            textFamily={fonts.OpenSans_400}
                        />
                        <View
                            style={{
                                width: 5.5,
                                height: 5.5,
                                borderRadius: 5.5,
                                marginHorizontal: 3,
                                backgroundColor: Colors.Black,
                            }}
                        />
                        <BasicText
                            inputText={
                                (UserInfo?.payment || 0) === 1
                                    ? '1 Subscription Left'
                                    : (UserInfo?.payment || 0) > 1
                                    ? `${UserInfo.payment} Subscriptions Left`
                                    : '0 Subscriptions Left'
                            }
                            textSize={13}
                            textFamily={fonts.OpenSans_400}
                        />
                    </View>
                </View>
                <Image
                    source={
                        UserInfoStore?.user_info?.dp?.url
                            ? {
                                  uri: http_link_fix({
                                      http_link: UserInfoStore?.user_info?.dp
                                          ?.url as string,
                                  }),
                              }
                            : require('../../Images/Extra/default_user_dp_light.jpg')
                    }
                    style={styles.h_header_img}
                />
            </View>
            <ScrollView
                style={{
                    flex: 1,
                    paddingHorizontal: 18,
                    paddingTop: 22,
                    marginHorizontal: 2,
                }}>
                <View
                    style={{
                        height: 140,
                        backgroundColor: Colors.DarkPurple,
                        borderRadius: 20,
                        flexDirection: 'row',
                    }}>
                    <View
                        style={{
                            marginLeft: 25,
                            marginTop: 30,
                            zIndex: 1,
                        }}>
                        <BasicText
                            inputText="Assigned Class"
                            textColor={Colors.White}
                            textWeight={700}
                            textSize={20}
                        />
                        <View
                            style={{
                                backgroundColor: Colors.Primary,
                                minWidth: 133,
                                height: 42,
                                marginTop: 10,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 11,
                                flexDirection: 'row',
                                paddingLeft: 10,
                                paddingRight: 4,
                            }}>
                            <BasicText
                                inputText={UserLevel}
                                textColor={Colors.White}
                                textWeight={600}
                                textSize={17}
                                marginRight={3}
                            />
                        </View>
                    </View>
                    <Image
                        source={require('../../Images/Home/HPA_1.png')}
                        style={{
                            width: 180,
                            height: 133,
                            resizeMode: 'contain',
                            marginLeft: 'auto',
                            marginRight: 20,
                            marginTop: 'auto',
                        }}
                    />
                </View>
                {examTShow !== null && (
                    <>
                        <BasicText
                            inputText={`${examTShow} Exam`}
                            textColor={Colors.Black}
                            textWeight={700}
                            textSize={20}
                            marginTop={24}
                            marginBottom={10}
                        />
                        <BasicButton
                            buttonText="Take Exam"
                            execFunc={() => take_exam({})}
                        />
                    </>
                )}
                <BasicText
                    inputText="Access Classroom"
                    textColor={Colors.Black}
                    textWeight={700}
                    textSize={20}
                    marginTop={24}
                />
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 14,
                        marginBottom: 30,
                    }}>
                    <View
                        style={{
                            flex: 1,
                            marginRight: 11,
                        }}>
                        <TouchableOpacity
                            onPress={no_double_clicks({
                                execFunc: () => {
                                    navigation.navigate('HomeTab', {
                                        screen: 'LessonPage',
                                    });
                                },
                            })}
                            activeOpacity={0.55}
                            style={{
                                backgroundColor: Colors.Primary,
                                height: 145,
                                borderRadius: 15,
                            }}>
                            <BasicText
                                inputText="Lessons"
                                textWeight={700}
                                textColor={Colors.White}
                                marginTop={17}
                                marginLeft={17}
                                textSize={19}
                            />
                            <ProgressBar
                                marginTop={15}
                                progress={Math.floor(
                                    (total_lessons_done() /
                                        total_homework_or_lessons()) *
                                        100,
                                )}
                                height={4}
                                backgroundColor={Colors.White}
                                progressBackgroundColor={Colors.DeepBlue}
                                marginHorizontal={17}
                            />
                            <BasicText
                                inputText={`${total_lessons_done()}/${total_homework_or_lessons()}`}
                                textWeight={700}
                                textColor={Colors.White}
                                marginTop={5}
                                marginLeft={17}
                                textSize={15}
                            />
                            <Image
                                source={require('../../Images/Home/HPA_3.png')}
                                style={{
                                    width: 100,
                                    height: 80,
                                    resizeMode: 'contain',
                                    position: 'absolute',
                                    bottom: -3.5,
                                    right: 10,
                                }}
                            />
                            <StarIcon
                                width={35}
                                height={35}
                                color={Colors.White}
                                style={{
                                    position: 'absolute',
                                    bottom: 11,
                                    left: 20,
                                }}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={no_double_clicks({
                                execFunc: () => {
                                    navigation.navigate('HomeTab', {
                                        screen: 'HomeWorkPage',
                                    });
                                },
                            })}
                            activeOpacity={0.55}
                            style={{
                                backgroundColor: Colors.LightPrimary,
                                marginTop: 25,
                                height: 145,
                                borderRadius: 15,
                            }}>
                            <BasicText
                                inputText="Homework"
                                textWeight={700}
                                textColor={Colors.Primary}
                                marginTop={17}
                                marginLeft={17}
                                textSize={19}
                            />
                            <ProgressBar
                                marginTop={15}
                                progress={Math.floor(
                                    (total_homework_done() /
                                        total_homework_or_lessons()) *
                                        100,
                                )}
                                height={4}
                                backgroundColor={Colors.White}
                                progressBackgroundColor={Colors.DeepBlue}
                                marginHorizontal={17}
                            />
                            <BasicText
                                inputText={
                                    Math.floor(
                                        (total_homework_done() /
                                            total_homework_or_lessons()) *
                                            100,
                                    )?.toString() + '%'
                                }
                                textColor={Colors.Primary}
                                marginTop={5}
                                marginLeft={17}
                                textSize={15}
                                textFamily={fonts.OpenSans_700}
                            />
                            <Image
                                source={require('../../Images/Home/HPA_4.png')}
                                style={{
                                    width: 100,
                                    height: 72,
                                    resizeMode: 'contain',
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 10,
                                }}
                            />
                            <StarIcon
                                width={35}
                                height={35}
                                color={Colors.Primary}
                                style={{
                                    position: 'absolute',
                                    bottom: 11,
                                    left: 20,
                                }}
                            />
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            marginLeft: 11,
                        }}>
                        <TouchableOpacity
                            onPress={nav_to_voc_page}
                            activeOpacity={0.55}
                            style={{
                                backgroundColor: Colors.Pink,
                                height: 206,
                                borderRadius: 15,
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 15,
                                    marginLeft: 17,
                                    marginRight: 17,
                                }}>
                                <BasicText
                                    inputText="Vocabulary"
                                    textWeight={700}
                                    textColor={Colors.White}
                                    textSize={19}
                                />
                                <Feather
                                    name="chevron-right"
                                    color={Colors.White}
                                    size={25}
                                    style={{
                                        marginTop: 2,
                                    }}
                                />
                            </View>
                            <BasicText
                                inputText="Learn new English Words"
                                textColor={Colors.White}
                                textSize={12}
                                textWeight={700}
                                marginTop={5}
                                marginLeft={17}
                                marginRight={17}
                                width={135}
                            />
                            <VocabularyIcon
                                style={{
                                    width: 100,
                                    height: 100,
                                    position: 'absolute',
                                    alignSelf: 'center',
                                    bottom: -3,
                                }}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.55}
                            onPress={no_double_clicks({
                                execFunc: () => {
                                    navigation.push(
                                        'HomeStack' as never,
                                        {
                                            screen: 'ReportPage',
                                        } as never,
                                    );
                                },
                            })}
                            style={{
                                backgroundColor: Colors.LightPrimary,
                                marginTop: 25,
                                height: 84,
                                borderRadius: 15,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                <BasicText
                                    inputText="View Report"
                                    textColor={Colors.Primary}
                                    textSize={20}
                                    textWeight={700}
                                    marginLeft={'auto'}
                                    marginRight={'auto'}
                                />
                                <StatsReportIcon
                                    color={Colors.Primary}
                                    width={22}
                                    height={22}
                                    style={{
                                        marginLeft: 3,
                                    }}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
                <View
                    style={{
                        height: 140,
                        backgroundColor: Colors.DarkPurple,
                        borderRadius: 20,
                        flexDirection: 'row',
                    }}>
                    <SimpleBIcon
                        width={60}
                        height={60}
                        color={Colors.Primary}
                        style={{
                            marginLeft: 22,
                            marginTop: 25,
                        }}
                    />
                    <View
                        style={{
                            marginLeft: 24,
                            marginTop: 12,
                            alignItems: 'center',
                        }}>
                        <BasicText
                            inputText="You’re on Fire"
                            textWeight={700}
                            textColor={Colors.White}
                            textSize={20}
                            textAlign="center"
                        />
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: 5,
                            }}>
                            <FireIcon width={22} height={22} />
                            <BasicText
                                inputText={get_day_from_date({
                                    input_date: new Date(Date.now()),
                                })?.toString()}
                                textFamily={fonts.OpenSans_700}
                                textColor={Colors.White}
                                textSize={20}
                            />
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 10,
                            }}>
                            {[...Array(7)]?.map((item, index) => (
                                <CheckMark
                                    key={index}
                                    day_num={index + 1}
                                    isCompleted={
                                        get_day_from_date({
                                            input_date: new Date(Date.now()),
                                        }) >=
                                        index + 1
                                    }
                                />
                            ))}
                        </View>
                    </View>
                </View>
                <View style={{ marginBottom: 50 }}>{''}</View>
            </ScrollView>
        </View>
    );
});

export default HomePage;

const styles = StyleSheet.create({
    home_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    h_header_cont: {
        height:
            Platform.OS === 'ios'
                ? screen_height_less_than({
                      if_true: 90,
                      if_false: 120,
                  })
                : 75,
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
    h_header_txt_c: {
        marginTop: 'auto',
        marginBottom: 12,
    },
    h_header_img: {
        width: 50,
        height: 50,
        marginLeft: 'auto',
        marginRight: 22,
        marginTop: 'auto',
        marginBottom: 12,
        borderRadius: 50,
    },
});
