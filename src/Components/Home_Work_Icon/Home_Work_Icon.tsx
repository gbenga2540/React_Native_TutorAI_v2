import React, { FunctionComponent } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import CheckIcon from '../../Images/SVGs/Check_Icon.svg';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { INTF_AssignedClass } from '../../Interface/Assigned_Class/Assigned_Class';
import { INTF_UserInfo } from '../../Interface/User_Info/User_Info';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { LessonTopicsStore } from '../../MobX/Lesson_Topics/Lesson_Topics';

interface HomeWorkIconProps {
    lesson_id: number;
    sub_lesson_id: number;
    is_completed: boolean;
    marginLeft?: number | 'auto';
    marginRight?: number | 'auto';
    marginTop?: number | 'auto';
    marginBottom?: number | 'auto';
    show_icon?: boolean;
    userLevel: INTF_AssignedClass;
    userInfo: INTF_UserInfo;
}
const HomeWorkIcon: FunctionComponent<HomeWorkIconProps> = ({
    lesson_id,
    sub_lesson_id,
    is_completed,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    show_icon,
    userLevel,
    userInfo,
}) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

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
            switch (userInfo?.level) {
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

    const get_completed_prev_hw = (): number[] => {
        const level_hw = userInfo?.lessons?.filter(
            item => item.id === lesson_id - 1,
        );

        if ((level_hw || [])?.length > 0) {
            return level_hw?.[0]?.score as number[];
        } else {
            return [];
        }
    };

    const get_completed_hw = (): number[] => {
        const level_hw = userInfo?.lessons?.filter(
            item => item.id === lesson_id,
        );

        if ((level_hw || [])?.length > 0) {
            return level_hw?.[0]?.score as number[];
        } else {
            return [];
        }
    };

    const nav_to_home_q = no_double_clicks({
        execFunc: () => {
            if (is_completed) {
                navigation.push(
                    'HomeStack' as never,
                    {
                        screen: 'HomeWorkQPage',
                        params: {
                            lesson_id: lesson_id,
                            sub_lesson_id: sub_lesson_id,
                            user_level: userLevel,
                            retake: is_completed || false,
                        },
                    } as never,
                );
            } else {
                if (
                    lesson_id === 101 ||
                    lesson_id === 201 ||
                    lesson_id === 301 ||
                    lesson_id === 401 ||
                    lesson_id === 501
                ) {
                    if (get_completed_hw()?.length >= sub_lesson_id) {
                        navigation.push(
                            'HomeStack' as never,
                            {
                                screen: 'HomeWorkQPage',
                                params: {
                                    lesson_id: lesson_id,
                                    sub_lesson_id: sub_lesson_id,
                                    user_level: userLevel,
                                    retake: is_completed || false,
                                },
                            } as never,
                        );
                    } else {
                        error_handler({
                            navigation: navigation,
                            header_mssg: 'Attention!',
                            error_mssg:
                                'Sorry, you are not allowed to proceed with this homework until you have completed the previous homework.',
                        });
                    }
                } else {
                    if (
                        get_prev_total_lessons({ l_id: lesson_id }) ===
                        get_completed_prev_hw()?.length
                    ) {
                        if (get_completed_hw()?.length >= sub_lesson_id) {
                            navigation.push(
                                'HomeStack' as never,
                                {
                                    screen: 'HomeWorkQPage',
                                    params: {
                                        lesson_id: lesson_id,
                                        sub_lesson_id: sub_lesson_id,
                                        user_level: userLevel,
                                        retake: is_completed || false,
                                    },
                                } as never,
                            );
                        } else {
                            error_handler({
                                navigation: navigation,
                                header_mssg: 'Attention!',
                                error_mssg:
                                    'Sorry, you are not allowed to proceed with this homework until you have completed the previous homework.',
                            });
                        }
                    } else {
                        error_handler({
                            navigation: navigation,
                            header_mssg: 'Attention!',
                            error_mssg:
                                'Sorry, you are not allowed to proceed with this homework until you have completed the previous homework.',
                        });
                    }
                }
            }
        },
    });

    if (show_icon) {
        return (
            <TouchableOpacity
                onPress={nav_to_home_q}
                activeOpacity={0.55}
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 5,
                    borderColor: is_completed
                        ? Colors.Primary
                        : Colors.LightGrey,
                    marginRight: marginRight || 0,
                    marginLeft: marginLeft || 0,
                    marginTop: marginTop || 0,
                    marginBottom: marginBottom || 0,
                }}>
                {is_completed && (
                    <View
                        style={{
                            position: 'absolute',
                            zIndex: 2,
                            backgroundColor: Colors.Primary,
                            width: 30,
                            height: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 30,
                            top: 1,
                            right: -8,
                        }}>
                        <CheckIcon color={Colors.White} />
                    </View>
                )}
                <Image
                    source={require('../../Images/Logos/Tutor_AI_Logo.png')}
                    style={{ width: 80, height: 80, borderRadius: 80 }}
                />
            </TouchableOpacity>
        );
    } else {
        return null;
    }
};

export default HomeWorkIcon;
