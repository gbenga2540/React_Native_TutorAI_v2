import React, { FunctionComponent, Suspense, useCallback } from 'react';
import {
    BackHandler,
    FlatList,
    Image,
    Keyboard,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import LessonCard from '../../Components/Lesson_Card/Lesson_Card';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BackButton from '../../Components/Back_Button/Back_Button';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { INTF_LessonTopics } from '../../Interface/Lesson/Lesson';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { observer } from 'mobx-react';
import { INTF_AssignedClass } from '../../Interface/Assigned_Class/Assigned_Class';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';

const LessonArchivePage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const L_Beginner = LessonTopicsStore.beginner_topics;
    const L_PreIntermediate = LessonTopicsStore.pre_intermediate_topics;
    const L_Intermediate = LessonTopicsStore.intermediate_topics;
    const L_UpperIntermediate = LessonTopicsStore.upper_intermediate_topics;
    const L_Confident = LessonTopicsStore.confident_topics;

    const UserInfo = UserInfoStore?.user_info;

    const UserLevel = UserInfo?.level || 'Beginner';

    const get_level_lessons = ({
        level,
    }: {
        level: INTF_AssignedClass;
    }): {
        _id?: string | undefined;
        id?: number | undefined;
        score?: number[];
    }[] => {
        if ((UserInfo?.lessons?.length || 0) >= 1) {
            return (
                UserInfo?.lessons?.filter(
                    item =>
                        item?.id?.toString()?.[0] ===
                        (level === 'Confident'
                            ? '5'
                            : level === 'Upper-Intermediate'
                            ? '4'
                            : level === 'Intermediate'
                            ? '3'
                            : level === 'Pre-Intermediate'
                            ? '2'
                            : '1'),
                ) || []
            );
        } else {
            return [];
        }
    };
    const B_LessonsDone = get_level_lessons({ level: 'Beginner' });
    const P_LessonsDone = get_level_lessons({ level: 'Pre-Intermediate' });
    const I_LessonsDone = get_level_lessons({ level: 'Intermediate' });
    const U_LessonsDone = get_level_lessons({ level: 'Upper-Intermediate' });
    const C_LessonsDone = get_level_lessons({ level: 'Confident' });

    const get_lessons_done_id = (): number[] => {
        switch (UserLevel) {
            case 'Beginner':
                return [...B_LessonsDone?.map(item => item?.id)] as number[];
            case 'Pre-Intermediate':
                return [
                    ...B_LessonsDone?.map(item => item?.id),
                    ...P_LessonsDone?.map(item => item?.id),
                ] as number[];
            case 'Intermediate':
                return [
                    ...B_LessonsDone?.map(item => item?.id),
                    ...P_LessonsDone?.map(item => item?.id),
                    ...I_LessonsDone?.map(item => item?.id),
                ] as number[];
            case 'Upper-Intermediate':
                return [
                    ...B_LessonsDone?.map(item => item?.id),
                    ...P_LessonsDone?.map(item => item?.id),
                    ...I_LessonsDone?.map(item => item?.id),
                    ...U_LessonsDone?.map(item => item?.id),
                ] as number[];
            case 'Confident':
                return [
                    ...B_LessonsDone?.map(item => item?.id),
                    ...P_LessonsDone?.map(item => item?.id),
                    ...I_LessonsDone?.map(item => item?.id),
                    ...U_LessonsDone?.map(item => item?.id),
                    ...C_LessonsDone?.map(item => item?.id),
                ] as number[];
            default:
                return [...B_LessonsDone?.map(item => item?.id)] as number[];
        }
    };
    const lessonsDoneID: number[] = get_lessons_done_id();

    const get_lessons_done = (): INTF_LessonTopics[] => {
        const get_topics = ({ level }: { level: INTF_AssignedClass }) => {
            return [
                ...lessonsDoneID
                    .filter(
                        l_id =>
                            l_id.toString()?.[0] ===
                            (level === 'Confident'
                                ? '5'
                                : level === 'Upper-Intermediate'
                                ? '4'
                                : level === 'Intermediate'
                                ? '3'
                                : level === 'Pre-Intermediate'
                                ? '2'
                                : '1'),
                    )
                    .map(
                        item =>
                            (level === 'Confident'
                                ? L_Confident
                                : level === 'Upper-Intermediate'
                                ? L_UpperIntermediate
                                : level === 'Intermediate'
                                ? L_Intermediate
                                : level === 'Pre-Intermediate'
                                ? L_PreIntermediate
                                : L_Beginner
                            ).filter(lesson => lesson.lesson_id === item)?.[0],
                    ),
            ];
        };

        switch (UserLevel) {
            case 'Beginner':
                return [...get_topics({ level: 'Beginner' })];
            case 'Pre-Intermediate':
                return [
                    ...get_topics({ level: 'Beginner' }),
                    ...get_topics({ level: 'Pre-Intermediate' }),
                ];
            case 'Intermediate':
                return [
                    ...get_topics({ level: 'Beginner' }),
                    ...get_topics({ level: 'Pre-Intermediate' }),
                    ...get_topics({ level: 'Intermediate' }),
                ];
            case 'Upper-Intermediate':
                return [
                    ...get_topics({ level: 'Beginner' }),
                    ...get_topics({ level: 'Pre-Intermediate' }),
                    ...get_topics({ level: 'Intermediate' }),
                    ...get_topics({ level: 'Upper-Intermediate' }),
                ];
            case 'Confident':
                return [
                    ...get_topics({ level: 'Beginner' }),
                    ...get_topics({ level: 'Pre-Intermediate' }),
                    ...get_topics({ level: 'Intermediate' }),
                    ...get_topics({ level: 'Upper-Intermediate' }),
                    ...get_topics({ level: 'Confident' }),
                ];
            default:
                return [...get_topics({ level: 'Beginner' })];
        }
    };

    const finalize_lessons_list = () => {
        switch (UserInfo?.initialLevel) {
            case 'Beginner':
                return get_lessons_done();
            case 'Pre-Intermediate':
                return get_lessons_done()?.filter(
                    item => item?.lesson_id?.toString()?.[0] !== '1',
                );
            case 'Intermediate':
                return get_lessons_done()?.filter(
                    item =>
                        item?.lesson_id?.toString()?.[0] !== '1' ||
                        item?.lesson_id?.toString()?.[0] !== '2',
                );
            case 'Upper-Intermediate':
                return get_lessons_done()?.filter(
                    item =>
                        item?.lesson_id?.toString()?.[0] !== '1' ||
                        item?.lesson_id?.toString()?.[0] !== '2' ||
                        item?.lesson_id?.toString()?.[0] !== '3',
                );
            case 'Confident':
                return get_lessons_done()?.filter(
                    item =>
                        item?.lesson_id?.toString()?.[0] !== '1' ||
                        item?.lesson_id?.toString()?.[0] !== '2' ||
                        item?.lesson_id?.toString()?.[0] !== '3' ||
                        item?.lesson_id?.toString()?.[0] !== '4',
                );
            default:
                return get_lessons_done();
        }
    };

    const lessonsDone: INTF_LessonTopics[] = finalize_lessons_list() || [];

    const get_lesson_count = () => {
        const UserLessonsScore = UserInfo?.lessons;
        let total = 0;
        lessonsDone?.map(item => {
            total +=
                UserLessonsScore?.filter(
                    l_item => l_item?.id === item?.lesson_id,
                )?.[0]?.lessons || 0;
        });
        return total;
    };

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

    return (
        <View style={styles.lesson_main}>
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
                    inputText="Lesson Archives"
                    textWeight={700}
                    textSize={20}
                    marginLeft={15}
                />
            </View>
            <View
                style={{
                    paddingHorizontal: 4,
                    marginTop: 14,
                    flex: 1,
                    paddingBottom:
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_true: 10,
                                  if_false: 35,
                              })
                            : 20,
                }}>
                <Image
                    source={require('../../Images/Lessons/Lessons.png')}
                    style={{
                        width: 155,
                        height: 80,
                        marginTop: 10,
                        marginBottom: 10,
                        alignSelf: 'center',
                    }}
                />
                <View
                    style={{
                        flexDirection: 'row',
                        marginBottom: 6,
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            marginRight: 10,
                            paddingHorizontal: 15,
                            paddingVertical: 9,
                            backgroundColor: Colors.LightPurple2,
                            borderRadius: 10,
                        }}>
                        <BasicText
                            inputText={`${
                                get_lesson_count() *
                                ((UserInfo?.study_target as number) === 60
                                    ? 60
                                    : 30)
                            }mins`}
                        />
                    </View>
                    <View
                        style={{
                            marginLeft: 10,
                            paddingHorizontal: 15,
                            paddingVertical: 9,
                            backgroundColor: Colors.LightPurple2,
                            borderRadius: 10,
                        }}>
                        <BasicText
                            inputText={`${get_lesson_count()} Lesson${
                                get_lesson_count() === 1 ? '' : 's'
                            }`}
                        />
                    </View>
                </View>
                <Suspense fallback={null}>
                    {lessonsDone.length > 0 && (
                        <FlatList
                            windowSize={4}
                            data={lessonsDone}
                            keyExtractor={item => item.lesson_id as any}
                            renderItem={({ item, index }) => (
                                <LessonCard
                                    lesson={item}
                                    current_index={index}
                                    last_index={
                                        lessonsDone?.length <= 1
                                            ? 0
                                            : lessonsDone?.length - 1
                                    }
                                    is_complete
                                    key={index}
                                    isArchives
                                />
                            )}
                            style={{
                                paddingHorizontal: 18,
                                paddingTop: 14,
                            }}
                        />
                    )}
                </Suspense>
            </View>
        </View>
    );
});

export default LessonArchivePage;

const styles = StyleSheet.create({
    lesson_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
