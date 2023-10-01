import React, { FunctionComponent, useEffect, useState } from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import BackButton from '../../Components/Back_Button/Back_Button';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import TextDivider from '../../Components/Text_Divider/Text_Divider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import SubscriptionPlan from '../../Components/Subscription_Plan/Subscription_Plan';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { convert_sub_data } from '../../Utils/Convert_Sub_Data/Convert_Sub_Data';
import { INTF_Subscription } from '../../Interface/Subscription/Subscription';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { observer } from 'mobx-react';
import { useQuery } from 'react-query';
import { QueryTags } from '../../Configs/Queries/Query_Tags/Query_Tags';
import { get_subscriptions } from '../../Configs/Queries/Subscription/Subscription';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';

const SubscriptionPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [subPlan, setSubPlan] = useState<number>(1);
    const [subTarget, setSubTarget] = useState<number>(30);
    const [subData, setSubData] = useState<INTF_Subscription[]>([]);

    const { data, isError } = useQuery(
        QueryTags({}).SubscriptionData,
        get_subscriptions,
        {},
    );

    useEffect(() => {
        const tempPlan = subData?.filter(
            item => item.plan === `plan_${subPlan}`,
        );
        if (tempPlan?.length > 0) {
            setSubTarget(tempPlan?.[0]?.thirty_mins ? 30 : 60);
        }
    }, [subPlan, subData]);

    const nav_to_p_details_page = no_double_clicks({
        execFunc: () => {
            navigation.push(
                'HomeStack' as never,
                { screen: 'PersonalDetailsPage' } as never,
            );
        },
    });

    useEffect(() => {
        if (!data?.error || !isError || (data.data || [])?.length > 0) {
            setSubData(
                convert_sub_data({
                    data: data?.data as {
                        id?: number | undefined;
                        no_of_lessons?: number | undefined;
                        price?: number | undefined;
                        plan?: string | undefined;
                        _id?: string | undefined;
                        thirty_mins?: boolean | undefined;
                        discount?: number | undefined;
                    }[],
                }) as INTF_Subscription[],
            );
        }
    }, [data, isError]);

    const nav_to_select_payment_page = no_double_clicks({
        execFunc: () => {
            if (data?.data?.length > 0) {
                if (UserInfoStore.user_info?.study_target === subTarget) {
                    navigation.push(
                        'HomeStack' as never,
                        {
                            screen: 'SelectPaymentPage',
                            params: {
                                paymentPlan: subData.filter(
                                    item => item?.id === subPlan,
                                )?.[0]?.plan,
                                allPlans: data?.data,
                            },
                        } as never,
                    );
                } else {
                    error_handler({
                        navigation: navigation,
                        header_mssg: 'Attention!',
                        error_mssg: `You cannot subscribe to this\n${
                            UserInfoStore?.user_info?.study_target === 30
                                ? 60
                                : 30
                        }-minute plan because you are currently on a ${
                            UserInfoStore?.user_info?.study_target
                        }-minute plan.`,
                        switch_plans: true,
                    });
                }
            } else {
                error_handler({
                    navigation: navigation,
                    header_mssg: 'Attention!',
                    error_mssg: 'Subscription plans not found!',
                });
            }
        },
    });

    return (
        <View style={styles.sub_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
            <OverlaySpinner
                showSpinner={subData?.length === 0}
                hideBackButton
            />
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
                    inputText="Subscription"
                    textSize={20}
                    textWeight={700}
                    marginLeft={10}
                />
                <Image
                    source={require('../../Images/Icons/Subscription_Crown.png')}
                    style={{
                        marginLeft: 10,
                        width: 35,
                        height: 35,
                    }}
                />
            </View>
            <ScrollView style={{ flex: 1 }}>
                <View
                    style={{
                        backgroundColor: Colors.Border,
                        marginHorizontal: 22,
                        marginTop: 40,
                        borderRadius: 15,
                        padding: 20,
                        paddingBottom: screen_height_less_than({
                            if_true: 5,
                            if_false: 20,
                        }),
                    }}>
                    <BasicText
                        inputText="30-minute Subscription Plan"
                        textSize={17}
                        textWeight={600}
                        textAlign="center"
                    />
                    <TextDivider
                        singleLine
                        marginTop={8}
                        marginBottom={
                            UserInfoStore?.user_info?.study_target !== 30
                                ? 10
                                : 30
                        }
                    />
                    {UserInfoStore?.user_info?.study_target !== 30 && (
                        <Text
                            style={{
                                marginTop: 4,
                                marginBottom: 10,
                            }}>
                            <BasicText
                                inputText="Do you want to switch to this plan? If yes tap "
                                textSize={15}
                                textWeight={600}
                                textAlign="center"
                            />
                            <BasicText
                                execFunc={() => nav_to_p_details_page({})}
                                inputText="here."
                                textWeight={700}
                                textColor={Colors.Primary}
                                textSize={15}
                            />
                        </Text>
                    )}
                    {subData?.length > 0 &&
                        subData
                            ?.sort((a, b) =>
                                a.no_of_lessons > b.no_of_lessons
                                    ? 1
                                    : a.no_of_lessons < b.no_of_lessons
                                    ? -1
                                    : 0,
                            )
                            ?.filter(s_item => s_item.thirty_mins)
                            ?.map((item, index) => (
                                <SubscriptionPlan
                                    subscription={item}
                                    index={item?.id}
                                    key={index}
                                    activeSubPlan={subPlan}
                                    setActiveSubPlan={setSubPlan}
                                />
                            ))}
                </View>
                <View
                    style={{
                        backgroundColor: Colors.Border,
                        marginHorizontal: 22,
                        marginTop: 40,
                        borderRadius: 15,
                        padding: 20,
                        paddingBottom: screen_height_less_than({
                            if_true: 5,
                            if_false: 20,
                        }),
                    }}>
                    <BasicText
                        inputText="60-minute Subscription Plan"
                        textSize={17}
                        textWeight={600}
                        textAlign="center"
                    />
                    <TextDivider
                        singleLine
                        marginTop={8}
                        marginBottom={
                            UserInfoStore?.user_info?.study_target !== 60
                                ? 10
                                : 30
                        }
                    />
                    {UserInfoStore?.user_info?.study_target !== 60 && (
                        <Text
                            style={{
                                marginTop: 4,
                                marginBottom: 10,
                            }}>
                            <BasicText
                                inputText="Do you want to switch to this plan? If yes tap "
                                textSize={15}
                                textWeight={600}
                                textAlign="center"
                            />
                            <BasicText
                                execFunc={() => nav_to_p_details_page({})}
                                inputText="here."
                                textWeight={700}
                                textColor={Colors.Primary}
                                textSize={15}
                            />
                        </Text>
                    )}
                    {subData?.length > 0 &&
                        subData
                            ?.sort((a, b) =>
                                a.no_of_lessons > b.no_of_lessons
                                    ? 1
                                    : a.no_of_lessons < b.no_of_lessons
                                    ? -1
                                    : 0,
                            )
                            ?.filter(s_item => !s_item.thirty_mins)
                            ?.map((item, index) => (
                                <SubscriptionPlan
                                    subscription={item}
                                    index={item?.id}
                                    key={index}
                                    activeSubPlan={subPlan}
                                    setActiveSubPlan={setSubPlan}
                                />
                            ))}
                </View>
                <View style={{ marginBottom: 30 }}>{''}</View>
            </ScrollView>
            <BasicButton
                buttonText="Continue"
                marginHorizontal={22}
                marginTop={2}
                marginBottom={
                    Platform.OS === 'ios'
                        ? screen_height_less_than({
                              if_true: 10,
                              if_false: 40,
                          })
                        : 20
                }
                execFunc={() => nav_to_select_payment_page({})}
            />
        </View>
    );
});

export default SubscriptionPage;

const styles = StyleSheet.create({
    sub_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
