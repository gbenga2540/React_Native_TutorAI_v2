import React, { FunctionComponent, useCallback } from 'react';
import {
    BackHandler,
    Image,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BackButton from '../../Components/Back_Button/Back_Button';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { observer } from 'mobx-react';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import HomeWorkIcon from '../../Components/Home_Work_Icon/Home_Work_Icon';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { INTF_AssignedClass } from '../../Interface/Assigned_Class/Assigned_Class';

const HomeWorkArchivePage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const UserInfo = UserInfoStore?.user_info;

    //! Homework Total and Average
    const homework_done = (): { total: number; average: number } => {
        let total_hw: number = 0;
        let all_scores: number[] = [];
        UserInfo?.lessons?.map(item => {
            total_hw += item?.score?.length || 0;
            if ((item?.score || [])?.length > 0) {
                for (
                    let s_index = 0;
                    s_index < (item?.score as number[])?.length;
                    s_index++
                ) {
                    all_scores.push(item?.score?.[s_index] as number);
                }
            }
        });

        const average =
            all_scores?.reduce(
                (accumulator, currentVal) => accumulator + currentVal,
                0,
            ) / all_scores?.length;

        return { total: total_hw, average: Math.floor(average || 0) || 0 };
    };

    interface INTF_HW {
        lesson_id: number;
        sub_lesson_id: number;
        user_level: INTF_AssignedClass;
    }
    const get_completed_hw = ({
        level,
    }: {
        level: INTF_AssignedClass;
    }): INTF_HW[] => {
        if (level) {
            const level_hw = UserInfo?.lessons?.filter(
                item =>
                    item.id?.toString()?.[0] ===
                    (level === 'Confident'
                        ? '5'
                        : level === 'Upper-Intermediate'
                        ? '4'
                        : level === 'Intermediate'
                        ? '3'
                        : level === 'Pre-Intermediate'
                        ? '2'
                        : '1'),
            );

            if ((level_hw || [])?.length > 0) {
                const new_data: INTF_HW[] = [];

                level_hw?.map(item => {
                    if ((item?.score || [])?.length > 0) {
                        for (
                            let s_i = 0;
                            s_i < (item?.score || []).length;
                            s_i++
                        ) {
                            const data: INTF_HW = {
                                lesson_id: item?.id as number,
                                sub_lesson_id: s_i,
                                user_level: level,
                            };
                            new_data.push(data);
                        }
                    } else {
                        return [];
                    }
                });
                return new_data;
            } else {
                return [];
            }
        } else {
            return [];
        }
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
                    inputText="Homework Archives"
                    textWeight={700}
                    textSize={20}
                    marginLeft={15}
                />
            </View>
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
                        inputText={`${homework_done()?.average}% Pass`}
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
                        inputText={`${homework_done()?.total} Homework`}
                    />
                </View>
            </View>

            {get_completed_hw({ level: 'Beginner' })?.length === 0 &&
            get_completed_hw({ level: 'Pre-Intermediate' })?.length === 0 &&
            get_completed_hw({ level: 'Intermediate' })?.length === 0 &&
            get_completed_hw({ level: 'Upper-Intermediate' })?.length === 0 &&
            get_completed_hw({ level: 'Confident' })?.length === 0 ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <BasicText
                        inputText="No Record!"
                        textWeight={600}
                        textSize={16}
                    />
                </View>
            ) : (
                <ScrollView
                    style={{
                        flex: 1,
                        paddingTop: 14,
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 10,
                                      if_false: 25,
                                  })
                                : 10,
                    }}>
                    {(get_completed_hw({ level: 'Beginner' }) || [])?.length >
                        0 && (
                        <>
                            <BasicText
                                inputText="Beginner"
                                textWeight={600}
                                marginTop={30}
                                marginBottom={10}
                                textSize={20}
                                marginLeft={'auto'}
                                marginRight={'auto'}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    flex: 1,
                                    justifyContent: 'center',
                                }}>
                                {get_completed_hw({ level: 'Beginner' })?.map(
                                    item => (
                                        <HomeWorkIcon
                                            lesson_id={item.lesson_id}
                                            sub_lesson_id={item.sub_lesson_id}
                                            key={`${item.lesson_id} - ${item.sub_lesson_id}`}
                                            is_completed
                                            marginLeft={7}
                                            marginRight={7}
                                            marginBottom={14}
                                            show_icon
                                            userLevel={item.user_level}
                                            userInfo={UserInfo}
                                        />
                                    ),
                                )}
                            </View>
                        </>
                    )}
                    {(get_completed_hw({ level: 'Pre-Intermediate' }) || [])
                        ?.length > 0 && (
                        <>
                            <BasicText
                                inputText="Pre-Intermediate"
                                textWeight={600}
                                marginTop={20}
                                marginBottom={10}
                                textSize={20}
                                marginLeft={'auto'}
                                marginRight={'auto'}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    flex: 1,
                                    justifyContent: 'center',
                                }}>
                                {get_completed_hw({
                                    level: 'Pre-Intermediate',
                                })?.map(item => (
                                    <HomeWorkIcon
                                        lesson_id={item.lesson_id}
                                        sub_lesson_id={item.sub_lesson_id}
                                        key={`${item.lesson_id} - ${item.sub_lesson_id}`}
                                        is_completed
                                        marginLeft={7}
                                        marginRight={7}
                                        marginBottom={14}
                                        show_icon
                                        userLevel={item.user_level}
                                        userInfo={UserInfo}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                    {(get_completed_hw({ level: 'Intermediate' }) || [])
                        ?.length > 0 && (
                        <>
                            <BasicText
                                inputText="Intermediate"
                                textWeight={600}
                                marginTop={20}
                                marginBottom={10}
                                textSize={20}
                                marginLeft={'auto'}
                                marginRight={'auto'}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    flex: 1,
                                    justifyContent: 'center',
                                }}>
                                {get_completed_hw({
                                    level: 'Intermediate',
                                })?.map(item => (
                                    <HomeWorkIcon
                                        lesson_id={item.lesson_id}
                                        sub_lesson_id={item.sub_lesson_id}
                                        key={`${item.lesson_id} - ${item.sub_lesson_id}`}
                                        is_completed
                                        marginLeft={7}
                                        marginRight={7}
                                        marginBottom={14}
                                        show_icon
                                        userLevel={item.user_level}
                                        userInfo={UserInfo}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                    {(get_completed_hw({ level: 'Upper-Intermediate' }) || [])
                        ?.length > 0 && (
                        <>
                            <BasicText
                                inputText="Upper-Intermediate"
                                textWeight={600}
                                marginTop={20}
                                marginBottom={10}
                                textSize={20}
                                marginLeft={'auto'}
                                marginRight={'auto'}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    flex: 1,
                                    justifyContent: 'center',
                                }}>
                                {get_completed_hw({
                                    level: 'Upper-Intermediate',
                                })?.map(item => (
                                    <HomeWorkIcon
                                        lesson_id={item.lesson_id}
                                        sub_lesson_id={item.sub_lesson_id}
                                        key={`${item.lesson_id} - ${item.sub_lesson_id}`}
                                        is_completed
                                        marginLeft={7}
                                        marginRight={7}
                                        marginBottom={14}
                                        show_icon
                                        userLevel={item.user_level}
                                        userInfo={UserInfo}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                    {(get_completed_hw({ level: 'Confident' }) || [])?.length >
                        0 && (
                        <>
                            <BasicText
                                inputText="Confident"
                                textWeight={600}
                                marginTop={10}
                                marginBottom={10}
                                textSize={20}
                                marginLeft={'auto'}
                                marginRight={'auto'}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    flex: 1,
                                    justifyContent: 'center',
                                }}>
                                {get_completed_hw({ level: 'Confident' })?.map(
                                    item => (
                                        <HomeWorkIcon
                                            lesson_id={item.lesson_id}
                                            sub_lesson_id={item.sub_lesson_id}
                                            key={`${item.lesson_id} - ${item.sub_lesson_id}`}
                                            is_completed
                                            marginLeft={7}
                                            marginRight={7}
                                            marginBottom={14}
                                            show_icon
                                            userLevel={item.user_level}
                                            userInfo={UserInfo}
                                        />
                                    ),
                                )}
                            </View>
                        </>
                    )}

                    <View
                        style={{
                            marginBottom: 50,
                        }}>
                        {''}
                    </View>
                </ScrollView>
            )}
        </View>
    );
});

export default HomeWorkArchivePage;

const styles = StyleSheet.create({
    lesson_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
