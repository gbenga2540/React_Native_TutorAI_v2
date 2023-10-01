import React, { FunctionComponent, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { INTF_LessonTopics } from '../../Interface/Lesson/Lesson';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { observer } from 'mobx-react';
import HomeWorkIcon from '../../Components/Home_Work_Icon/Home_Work_Icon';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';

const HomeWorkPage: FunctionComponent = observer(() => {
    const CurrentLevel = UserInfoStore?.user_info?.level || 'Beginner';
    const [currentLessons, setCurrentLessons] = useState<INTF_LessonTopics[]>(
        LessonTopicsStore.beginner_topics,
    );

    const UserLessonsScore = UserInfoStore?.user_info?.lessons || [];
    const UserLevel = UserInfoStore?.user_info?.level || 'Beginner';

    const noOfLessons =
        UserLevel === 'Confident'
            ? LessonTopicsStore.confident_topics.length
            : UserLevel === 'Upper-Intermediate'
            ? LessonTopicsStore.upper_intermediate_topics.length
            : UserLevel === 'Intermediate'
            ? LessonTopicsStore.intermediate_topics.length
            : UserLevel === 'Pre-Intermediate'
            ? LessonTopicsStore.pre_intermediate_topics.length
            : LessonTopicsStore.beginner_topics.length;

    const show_homework_icon = ({
        lesson_id,
        sub_lesson_id,
    }: {
        lesson_id: number;
        sub_lesson_id: number;
    }) => {
        const my_lessons = UserLessonsScore?.filter(
            item => item?.id === lesson_id,
        );
        if (my_lessons?.length > 0) {
            if (my_lessons?.[0].lessons === 0) {
                return false;
            } else if (
                ((my_lessons?.[0]?.lessons as number) || 0) > sub_lesson_id
            ) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    const is_homework_completed = ({
        lesson_id,
        sub_lesson_id,
    }: {
        lesson_id: number;
        sub_lesson_id: number;
    }) => {
        const my_lessons = UserLessonsScore?.filter(
            item => item?.id === lesson_id,
        );

        if (my_lessons?.length > 0) {
            if (my_lessons?.[0]?.score?.length === 0) {
                return false;
            } else if (
                ((my_lessons?.[0]?.score as number[]) || [])?.length >
                sub_lesson_id
            ) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

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

    const total_homework_done = (): string => {
        let homework_done = 0;
        const my_lessons = UserLessonsScore?.filter(
            item => item?.id?.toString()?.[0] === get_level_number(),
        );

        if (my_lessons?.length > 0) {
            my_lessons.map(item => {
                homework_done += item?.score?.length || 0;
            });
            return homework_done.toString();
        } else {
            return '0';
        }
    };

    const total_homework_or_lessons = (): string => {
        let total_lessons = 0;
        if (currentLessons?.length > 0) {
            currentLessons?.map(item => {
                total_lessons += item?.lesson_sub_topic?.length;
            });
            return total_lessons?.toString();
        } else {
            return '0';
        }
    };

    useEffect(() => {
        switch (CurrentLevel) {
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
    }, [CurrentLevel]);

    return (
        <View style={styles.hw_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
            <View style={styles.l_header_cont}>
                <BasicText
                    inputText="Homework"
                    marginBottom={18}
                    marginTop={'auto'}
                    textSize={25}
                    textWeight={700}
                />
            </View>
            <View
                style={{
                    alignSelf: 'center',
                    width: 250,
                    height: 100,
                    backgroundColor: Colors.LightPrimary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                    borderRadius: 15,
                    marginBottom: 3,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                        style={{
                            backgroundColor: Colors.Primary,
                            minWidth: 30,
                            height: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 3,
                            borderRadius: 5,
                        }}>
                        <BasicText
                            inputText={total_homework_done()}
                            textWeight={700}
                            textSize={16}
                            marginTop={3}
                            textColor={Colors.White}
                        />
                    </View>
                    <BasicText
                        inputText=" / "
                        textWeight={700}
                        textSize={20}
                        marginTop={3}
                        textColor={Colors.Primary}
                    />
                    <View
                        style={{
                            backgroundColor: Colors.Primary,
                            minWidth: 30,
                            height: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 3,
                            borderRadius: 5,
                        }}>
                        <BasicText
                            inputText={total_homework_or_lessons()}
                            textWeight={700}
                            textSize={16}
                            marginTop={3}
                            textColor={Colors.White}
                        />
                    </View>
                </View>
                <BasicText
                    inputText={
                        total_homework_or_lessons() === total_homework_done()
                            ? 'Completed'
                            : 'Ongoing'
                    }
                    textWeight={700}
                    textSize={20}
                    marginTop={5}
                    textColor={Colors.Primary}
                />
            </View>
            <ScrollView style={{ flex: 1 }}>
                <View
                    style={{
                        marginTop: 30,
                        marginBottom: 40,
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        flex: 1,
                        justifyContent: 'center',
                    }}>
                    {currentLessons?.length > 0 &&
                        currentLessons?.map((item, index) =>
                            item.lesson_sub_topic.map((st_item, st_index) => {
                                return (
                                    <HomeWorkIcon
                                        lesson_id={item?.lesson_id}
                                        sub_lesson_id={st_index}
                                        key={`${index} - ${st_index}`}
                                        is_completed={is_homework_completed({
                                            lesson_id: item.lesson_id,
                                            sub_lesson_id: st_index,
                                        })}
                                        marginLeft={7}
                                        marginRight={7}
                                        marginBottom={14}
                                        show_icon={show_homework_icon({
                                            lesson_id: item.lesson_id,
                                            sub_lesson_id: st_index,
                                        })}
                                        userLevel={CurrentLevel}
                                        userInfo={UserInfoStore.user_info}
                                    />
                                );
                            }),
                        )}
                </View>
                {(UserInfoStore?.user_info?.lessons?.filter(
                    obj =>
                        obj?.score !== null &&
                        obj?.score !== undefined &&
                        obj?.id?.toString()?.[0] === get_level_number(),
                )?.length || 0) !== noOfLessons && (
                    <BasicText
                        inputText="Study more Lessons to Unlock more Homeworks"
                        textAlign="center"
                        width={230}
                        marginLeft={'auto'}
                        marginRight={'auto'}
                    />
                )}
            </ScrollView>
        </View>
    );
});

export default HomeWorkPage;

const styles = StyleSheet.create({
    hw_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    l_header_cont: {
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
    },
});
