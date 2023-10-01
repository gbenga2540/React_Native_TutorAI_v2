import React, {
    FunctionComponent,
    ReactElement,
    Suspense,
    useEffect,
    useState,
} from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import LessonCard from '../../Components/Lesson_Card/Lesson_Card';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import { observer } from 'mobx-react';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { INTF_LessonTopics } from '../../Interface/Lesson/Lesson';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';

const LessonPage: FunctionComponent = observer(() => {
    const [showSpinner, setShowSpinner] = useState<boolean>(false);

    const UserLevel = UserInfoStore.user_info?.level || 'Beginner';
    const [lessons, setLessons] = useState<INTF_LessonTopics[]>(
        LessonTopicsStore.beginner_topics || [],
    );
    const UserLessonScore = UserInfoStore.user_info?.lessons || [];

    const is_lesson_complete = ({ lesson_id }: { lesson_id: number }) => {
        const currentLesson = UserLessonScore?.filter(
            l_score => l_score?.id === lesson_id,
        );
        switch (UserLevel) {
            case 'Beginner':
                return (
                    currentLesson?.[0]?.lessons ===
                    LessonTopicsStore.beginner_topics?.filter(
                        item => item?.lesson_id === lesson_id,
                    )?.[0]?.lesson_sub_topic?.length
                );
            case 'Pre-Intermediate':
                return (
                    currentLesson?.[0]?.lessons ===
                    LessonTopicsStore.pre_intermediate_topics?.filter(
                        item => item?.lesson_id === lesson_id,
                    )?.[0]?.lesson_sub_topic?.length
                );
            case 'Intermediate':
                return (
                    currentLesson?.[0]?.lessons ===
                    LessonTopicsStore.intermediate_topics?.filter(
                        item => item?.lesson_id === lesson_id,
                    )?.[0]?.lesson_sub_topic?.length
                );
            case 'Upper-Intermediate':
                return (
                    currentLesson?.[0]?.lessons ===
                    LessonTopicsStore.upper_intermediate_topics?.filter(
                        item => item?.lesson_id === lesson_id,
                    )?.[0]?.lesson_sub_topic?.length
                );
            case 'Confident':
                return (
                    currentLesson?.[0]?.lessons ===
                    LessonTopicsStore.confident_topics?.filter(
                        item => item?.lesson_id === lesson_id,
                    )?.[0]?.lesson_sub_topic?.length
                );
            default:
                return (
                    currentLesson?.[0]?.lessons ===
                    LessonTopicsStore.beginner_topics?.filter(
                        item => item?.lesson_id === lesson_id,
                    )?.[0]?.lesson_sub_topic?.length
                );
        }
    };

    useEffect(() => {
        const set_lessons_data = () => {
            switch (UserLevel) {
                case 'Beginner':
                    setLessons(LessonTopicsStore.beginner_topics || []);
                    break;
                case 'Pre-Intermediate':
                    setLessons(LessonTopicsStore.pre_intermediate_topics || []);
                    break;
                case 'Intermediate':
                    setLessons(LessonTopicsStore.intermediate_topics || []);
                    break;
                case 'Upper-Intermediate':
                    setLessons(
                        LessonTopicsStore.upper_intermediate_topics || [],
                    );
                    break;
                case 'Confident':
                    setLessons(LessonTopicsStore.confident_topics || []);
                    break;
                default:
                    setLessons(LessonTopicsStore.beginner_topics || []);
                    break;
            }
        };
        set_lessons_data();
    }, [UserLevel]);

    return (
        <View style={styles.lesson_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
            <OverlaySpinner
                showSpinner={showSpinner}
                setShowSpinner={setShowSpinner}
            />
            <View style={styles.l_header_cont}>
                <BasicText
                    inputText="Lessons"
                    marginTop={'auto'}
                    marginBottom={18}
                    textSize={25}
                    textWeight={700}
                />
            </View>
            <View
                style={{
                    paddingHorizontal: 4,
                    marginTop: 14,
                    paddingBottom: 20,
                }}>
                <BasicText
                    inputText="Assigned Class"
                    marginLeft={22}
                    textColor={Colors.Black}
                    textWeight={700}
                    textSize={20}
                />
                <View
                    style={{
                        flexDirection: 'row',
                        marginBottom: 3,
                    }}>
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
                            marginLeft: 22,
                            paddingLeft: 10,
                            paddingRight: 4,
                        }}>
                        <BasicText
                            inputText={
                                (UserInfoStore?.user_info?.level as string) ||
                                'Beginner'
                            }
                            textColor={Colors.White}
                            textSize={18}
                            marginRight={3}
                            textWeight={600}
                        />
                    </View>
                </View>
                {lessons?.length > 0 && (
                    <Suspense fallback={null}>
                        <FlatList
                            windowSize={4}
                            ListHeaderComponent={() =>
                                (
                                    <View style={{ marginTop: 20 }}>{''}</View>
                                ) as ReactElement<any>
                            }
                            data={lessons}
                            keyExtractor={item => item.lesson_index as any}
                            renderItem={({ item, index }) => (
                                <LessonCard
                                    lesson={item}
                                    current_index={index}
                                    last_index={
                                        lessons?.length <= 1
                                            ? 0
                                            : lessons?.length - 1
                                    }
                                    is_complete={is_lesson_complete({
                                        lesson_id: item?.lesson_id,
                                    })}
                                    setShowSpinner={setShowSpinner}
                                    key={index}
                                />
                            )}
                            style={{
                                paddingHorizontal: 18,
                            }}
                            ListFooterComponent={() =>
                                (
                                    <View style={{ marginBottom: 130 }}>
                                        {''}
                                    </View>
                                ) as ReactElement<any>
                            }
                        />
                    </Suspense>
                )}
            </View>
        </View>
    );
});

export default LessonPage;

const styles = StyleSheet.create({
    lesson_main: {
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
