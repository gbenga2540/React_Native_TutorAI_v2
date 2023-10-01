import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useState,
} from 'react';
import {
    StyleSheet,
    View,
    Image,
    TouchableOpacity,
    Platform,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import { INTF_LessonTopics } from '../../Interface/Lesson/Lesson';
import ArcInnerIcon from '../../Images/SVGs/Arc_Inner_Icon.svg';
import ArcOuterIcon from '../../Images/SVGs/Arc_Outer_Icon.svg';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BasicText from '../Basic_Text/Basic_Text';
import { observer } from 'mobx-react-lite';
import { useMutation } from 'react-query';
import { activate_lesson } from '../../Configs/Queries/Lesson/Lesson';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { INTF_UserInfo } from '../../Interface/User_Info/User_Info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_USER_INFO } from '@env';
import SInfo from 'react-native-sensitive-info';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';

interface LessonCardProps {
    lesson: INTF_LessonTopics;
    current_index: number;
    last_index: number;
    disabled?: boolean;
    is_complete?: boolean;
    setShowSpinner?: Dispatch<SetStateAction<boolean>>;
    isArchives?: boolean;
}
const LessonCard: FunctionComponent<LessonCardProps> = observer(
    ({
        lesson,
        current_index,
        last_index,
        disabled,
        is_complete,
        setShowSpinner,
        isArchives,
    }) => {
        const navigation = useNavigation<NativeStackNavigationProp<any>>();
        const UserInfo = UserInfoStore?.user_info;
        const IS_SIXTY_MIN = UserInfo?.study_target === 60 || false;
        const UserLessonScore = UserInfo?.lessons || [];
        const [showSub, setShowSub] = useState<boolean>(false);

        const is_lesson_complete = is_complete || false;

        //! No of Lessons that has already been paid for that lesson ID
        const no_of_subs =
            UserLessonScore?.filter(item => item?.id === lesson?.lesson_id)?.[0]
                ?.lessons || 0;

        const get_prev_total_lessons = ({ l_id }: { l_id: number }): number => {
            if (
                l_id === 101 ||
                l_id === 201 ||
                l_id === 301 ||
                l_id === 401 ||
                l_id === 501
            ) {
                return 0;
            } else {
                switch (UserInfo?.level) {
                    case 'Beginner':
                        return LessonTopicsStore.beginner_topics.filter(
                            item => item?.lesson_id === l_id - 1,
                        )?.[0]?.lesson_sub_topic?.length;
                    case 'Pre-Intermediate':
                        return LessonTopicsStore.pre_intermediate_topics.filter(
                            item => item?.lesson_id === l_id - 1,
                        )?.[0]?.lesson_sub_topic?.length;
                    case 'Intermediate':
                        return LessonTopicsStore.intermediate_topics.filter(
                            item => item?.lesson_id === l_id - 1,
                        )?.[0]?.lesson_sub_topic?.length;
                    case 'Upper-Intermediate':
                        return LessonTopicsStore.upper_intermediate_topics.filter(
                            item => item?.lesson_id === l_id - 1,
                        )?.[0]?.lesson_sub_topic?.length;
                    case 'Confident':
                        return LessonTopicsStore.confident_topics.filter(
                            item => item?.lesson_id === l_id - 1,
                        )?.[0]?.lesson_sub_topic?.length;
                    default:
                        return LessonTopicsStore.beginner_topics.filter(
                            item => item?.lesson_id === l_id - 1,
                        )?.[0]?.lesson_sub_topic?.length;
                }
            }
        };

        const { mutate: activate_lesson_mutate } = useMutation(
            activate_lesson,
            {
                onMutate: () => {
                    setShowSpinner !== undefined && setShowSpinner(true);
                },

                onSettled: async (data, _error, variables, _context) => {
                    setShowSpinner !== undefined && setShowSpinner(false);
                    if (data?.error) {
                        error_handler({
                            navigation: navigation,
                            error_mssg:
                                'Welcome back to our lessons! We are thrilled to see you again and deeply appreciate your commitment to continue learning with us.\n\nKindly proceed to the Subscription Page to conveniently settle the payment for the upcoming lessons. Thank you!',
                            show_sub: data?.data
                                ?.toString()
                                ?.includes(
                                    'Lesson Payment Exhausted, Please Re-subscribe!',
                                ),
                            header_mssg: 'Attention!',
                        });
                    } else {
                        const newData = data?.data;
                        const oldLessons =
                            UserInfoStore?.user_info?.lessons !== undefined
                                ? [...UserInfoStore?.user_info?.lessons]
                                : [];

                        if (oldLessons?.length > 0) {
                            const exist = oldLessons?.findIndex(
                                obj => obj?.id === newData?.id,
                            );
                            if (exist !== -1) {
                                oldLessons[exist] = newData;
                            } else {
                                oldLessons?.push(newData);
                            }
                        } else {
                            oldLessons?.push(newData);
                        }

                        const newUserInfo: INTF_UserInfo = {
                            ...UserInfoStore?.user_info,
                            lessons: oldLessons,
                        };

                        const proceed = () => {
                            UserInfoStore?.set_user_info({
                                user_info: newUserInfo,
                            });
                            proceed_to_lesson({
                                l_id: variables?.lessonNum - 1,
                            });
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
                        } catch (err) {
                            proceed();
                        }
                    }
                },
            },
        );

        const proceed_to_lesson = ({ l_id }: { l_id: number }) => {
            navigation.navigate('HomeStack', {
                screen: 'LGrammarPage',
                params: {
                    topic: lesson?.lesson_topic,
                    sub_topic: lesson.lesson_sub_topic[l_id],
                    lesson_id: l_id,
                    is_sixty_min: IS_SIXTY_MIN,
                },
            });
        };

        // !Total Homework Done for a specific Subject
        const total_homework_done = (): number => {
            const my_lessons = UserLessonScore?.filter(
                item => item?.id === lesson.lesson_id,
            );
            if (my_lessons?.length > 0) {
                return my_lessons?.[0]?.score?.length || 0;
            } else {
                return 0;
            }
        };

        const nav_to_lesson = no_double_clicks({
            execFunc: ({ index }: { index: number }) => {
                const c_index = index + 1;
                // !These are free lessons
                if (
                    (lesson?.lesson_id === 101 && c_index === 1) ||
                    (lesson?.lesson_id === 201 && c_index === 1) ||
                    (lesson?.lesson_id === 301 && c_index === 1) ||
                    (lesson?.lesson_id === 401 && c_index === 1) ||
                    (lesson?.lesson_id === 501 && c_index === 1)
                ) {
                    proceed_to_lesson({ l_id: index });
                } else {
                    //! Is the number of lessons on this lessonID containing the index of th lesson chosen. if true open, but if the index of the lesson chosen is higher, then the user has to pay or subscribe to add to the lessons in his lessonID
                    if (no_of_subs >= c_index) {
                        proceed_to_lesson({ l_id: index });
                    } else {
                        if (
                            lesson?.lesson_id === 101 ||
                            lesson?.lesson_id === 201 ||
                            lesson?.lesson_id === 301 ||
                            lesson?.lesson_id === 401 ||
                            lesson?.lesson_id === 501
                        ) {
                            if (Math.abs(no_of_subs - c_index) > 1) {
                                error_handler({
                                    navigation: navigation,
                                    error_mssg:
                                        'Sorry, you are not allowed to proceed to the subsequent lessons until you have studied the previous one and completed the homework.',
                                    header_mssg: 'Attention!',
                                });
                            } else {
                                if (total_homework_done() === index) {
                                    activate_lesson_mutate({
                                        userId: UserInfoStore?.user_info
                                            ?._id as string,
                                        lessonId: lesson?.lesson_id as number,
                                        lessonNum: c_index,
                                    });
                                } else {
                                    error_handler({
                                        navigation: navigation,
                                        error_mssg:
                                            'Sorry, you are not allowed to proceed to the subsequent lessons until you have studied the previous one and completed the homework.',
                                        header_mssg: 'Attention!',
                                    });
                                }
                            }
                        } else {
                            //! Checking the number of assignment scores with the no of lessons in the previous subjects
                            if (
                                (UserLessonScore?.filter(
                                    item => item?.id === lesson.lesson_id - 1,
                                )?.[0]?.score?.length || 0) !==
                                get_prev_total_lessons({
                                    l_id: lesson.lesson_id,
                                })
                            ) {
                                error_handler({
                                    navigation: navigation,
                                    error_mssg:
                                        'Sorry, you are not allowed to proceed to the subsequent lessons until you have studied the previous one and completed the homework.',
                                    header_mssg: 'Attention!',
                                });
                            } else {
                                if (c_index === 1) {
                                    activate_lesson_mutate({
                                        userId: UserInfoStore?.user_info
                                            ?._id as string,
                                        lessonId: lesson?.lesson_id as number,
                                        lessonNum: c_index,
                                    });
                                } else if (Math.abs(no_of_subs - c_index) > 1) {
                                    error_handler({
                                        navigation: navigation,
                                        error_mssg:
                                            'Sorry, you are not allowed to proceed to the subsequent lessons until you have studied the previous one and completed the homework.',
                                        header_mssg: 'Attention!',
                                    });
                                } else {
                                    if (total_homework_done() === index) {
                                        activate_lesson_mutate({
                                            userId: UserInfoStore?.user_info
                                                ?._id as string,
                                            lessonId:
                                                lesson?.lesson_id as number,
                                            lessonNum: c_index,
                                        });
                                    } else {
                                        error_handler({
                                            navigation: navigation,
                                            error_mssg:
                                                'Sorry, you are not allowed to proceed to the subsequent lessons until you have studied the previous one and completed the homework.',
                                            header_mssg: 'Attention!',
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        const open_lesson = no_double_clicks({
            execFunc: () => {
                setShowSub(!showSub);
            },
        });

        return (
            <View
                style={{
                    marginBottom:
                        current_index === last_index
                            ? Platform.OS === 'ios'
                                ? 67
                                : 22
                            : 17,
                }}>
                <TouchableOpacity
                    onPress={open_lesson}
                    disabled={disabled || false}
                    activeOpacity={0.5}
                    style={[
                        styles.lesson_main,
                        {
                            backgroundColor: is_lesson_complete
                                ? Colors.Primary
                                : Colors.LightPurple3,
                        },
                    ]}>
                    <ArcInnerIcon
                        style={{ position: 'absolute', right: 0 }}
                        color={
                            is_lesson_complete
                                ? Colors.ArcInner_A
                                : Colors.ArcInner_I
                        }
                    />
                    <ArcOuterIcon
                        style={{ position: 'absolute', right: 0 }}
                        color={
                            is_lesson_complete
                                ? Colors.ArcOuter_A
                                : Colors.ArcOuter_I
                        }
                    />
                    <View style={{ flexDirection: 'row' }}>
                        <View
                            style={{
                                marginLeft: 12,
                                marginTop: 10,
                                marginRight: 4,
                                width: 100,
                                height: 100,
                                borderRadius: 100,
                                borderWidth: 2,
                                borderColor: is_lesson_complete
                                    ? Colors.ArcInner_A
                                    : Colors.ArcInner_I,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Image
                                source={require('../../Images/Logos/Tutor_AI_Logo.png')}
                                style={{
                                    borderRadius: 90,
                                    width: 90,
                                    height: 90,
                                }}
                            />
                        </View>

                        <View
                            style={{
                                width: 200,
                                paddingTop: 26,
                                paddingBottom: 12,
                            }}>
                            <BasicText
                                inputText={`Subject ${lesson?.lesson_index} ${
                                    isArchives
                                        ? lesson?.lesson_id?.toString()?.[0] ===
                                          '1'
                                            ? ' - Beginner'
                                            : lesson?.lesson_id?.toString()?.[0] ===
                                              '2'
                                            ? ' - Pre-Intermediate'
                                            : lesson?.lesson_id?.toString()?.[0] ===
                                              '3'
                                            ? ' - Intermediate'
                                            : lesson?.lesson_id?.toString()?.[0] ===
                                              '4'
                                            ? ' - Upper-Intermediate'
                                            : ' - Confident'
                                        : ''
                                }`}
                                textWeight={500}
                                textSize={15}
                                textColor={
                                    is_lesson_complete
                                        ? Colors.White
                                        : Colors.Black
                                }
                            />
                            <BasicText
                                inputText={lesson?.lesson_topic as string}
                                textWeight={600}
                                textSize={18}
                                textColor={
                                    is_lesson_complete
                                        ? Colors.White
                                        : Colors.Black
                                }
                            />
                        </View>
                    </View>
                </TouchableOpacity>
                {showSub && !isArchives && (
                    <>
                        {lesson.lesson_sub_topic.map((item, index) => (
                            <TouchableOpacity
                                activeOpacity={0.55}
                                onPress={() => nav_to_lesson({ index: index })}
                                style={{
                                    marginBottom: 1,
                                    marginTop: 8,
                                    backgroundColor:
                                        no_of_subs >= index + 1
                                            ? Colors.LightPurple2
                                            : Colors.LightGrey,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 11,
                                }}
                                key={index}>
                                <BasicText
                                    inputText={`Lesson ${index + 1}`}
                                    textWeight={700}
                                    textSize={17}
                                />
                                <BasicText inputText={item} textSize={15} />
                            </TouchableOpacity>
                        ))}
                    </>
                )}
                {showSub && isArchives && (
                    <>
                        {lesson.lesson_sub_topic
                            .filter((l_item, index) => index < no_of_subs)
                            ?.map((item, index) => (
                                <TouchableOpacity
                                    activeOpacity={0.55}
                                    onPress={() =>
                                        nav_to_lesson({ index: index })
                                    }
                                    style={{
                                        marginBottom: 1,
                                        marginTop: 8,
                                        backgroundColor:
                                            no_of_subs >= index + 1
                                                ? Colors.LightPurple2
                                                : Colors.LightGrey,
                                        borderRadius: 10,
                                        paddingHorizontal: 12,
                                        paddingVertical: 11,
                                    }}
                                    key={index}>
                                    <BasicText
                                        inputText={`Lesson ${index + 1}`}
                                        textWeight={700}
                                        textSize={17}
                                    />
                                    <BasicText inputText={item} textSize={15} />
                                </TouchableOpacity>
                            ))}
                    </>
                )}
            </View>
        );
    },
);

export default LessonCard;

const styles = StyleSheet.create({
    lesson_main: {
        minHeight: 120,
        borderRadius: 15,
    },
});
