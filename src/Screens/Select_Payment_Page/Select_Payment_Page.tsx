import React, { Fragment, FunctionComponent, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, Modal } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import BackButton from '../../Components/Back_Button/Back_Button';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import TextDivider from '../../Components/Text_Divider/Text_Divider';
import {
    CommonActions,
    RouteProp,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { payment_methods_data } from '../../Data/Payment_Methods/Payment_Methods';
import PaymentMethod from '../../Components/Payment_Mathod/Payment_Mathod';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import {
    INTF_PaymentPlan,
    INTF_Subscription,
} from '../../Interface/Subscription/Subscription';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { useMutation } from 'react-query';
import {
    paypal_intent,
    stripe_intent,
    update_payment_history,
} from '../../Configs/Queries/Payment/Payment';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import { useStripe } from '@stripe/stripe-react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { AdminStore } from '../../MobX/Admin/Admin';
import { convert_sub_data } from '../../Utils/Convert_Sub_Data/Convert_Sub_Data';
import PayWithFlutterwave from 'flutterwave-react-native';
import { useQueryClient } from 'react-query';
import { QueryTags } from '../../Configs/Queries/Query_Tags/Query_Tags';

const SelectPaymentPage: FunctionComponent = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<any>>();
    const queryClient = useQueryClient();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const paymentPlan: INTF_PaymentPlan = route.params?.paymentPlan;

    const [showModal, setShowModal] = useState<boolean>(false);
    const [paypalLink, setPaypalLink] = useState<string>('');

    const flutterwaveKey = AdminStore.admin_data?.flutterwave_public_key || '';
    const [subPM, setSubPM] = useState<number>(1);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [disableButton, setDisableButton] = useState<boolean>(false);
    const [pHistoryID, setPHistoryID] = useState<string>('');

    const pricing =
        (route.params?.allPlans as {
            id?: number | undefined;
            no_of_lessons?: number | undefined;
            price?: number | undefined;
            plan?: string | undefined;
            _id?: string | undefined;
            thirty_mins?: boolean | undefined;
            discount?: number | undefined;
        }[]) || [];

    const sub_data =
        (pricing || [])?.length > 0
            ? (convert_sub_data({
                  data: pricing as {
                      id?: number | undefined;
                      no_of_lessons?: number | undefined;
                      price?: number | undefined;
                      plan?: string | undefined;
                      _id?: string | undefined;
                  }[],
              }) as INTF_Subscription[])
            : ([] as INTF_Subscription[]);

    interface FWRedirectParams {
        status: 'successful' | 'cancelled';
        transaction_id?: string;
        tx_ref: string;
    }

    const handleOnRedirect = (data: FWRedirectParams) => {
        if (data.status === 'successful') {
            handle_final_payments();
            return;
        }
    };

    const generateTransactionRef = (length: number) => {
        let result = '';
        const characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength),
            );
        }
        return `flw_tx_ref_${result}`;
    };

    const { mutate: stripe_intent_mutate } = useMutation(stripe_intent, {
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
                    error_mssg: 'Something went wrong!',
                    svr_error_mssg: data?.data,
                });
            } else {
                const client_secret: string = data?.data?.cl_secret;
                setPHistoryID(data?.data?.p_history?._id);

                const initResponse = await initPaymentSheet({
                    merchantDisplayName: 'Tutor AI, Inc.',
                    paymentIntentClientSecret: client_secret,
                    defaultBillingDetails: {
                        name: 'Tutor AI',
                    },
                });

                if (initResponse.error) {
                    error_handler({
                        navigation: navigation,
                        error_mssg: 'Something went wrong!',
                        svr_error_mssg: initResponse.error.message,
                    });
                } else {
                    const paymentResponse = await presentPaymentSheet();

                    if (paymentResponse.error) {
                        if (paymentResponse.error.code !== 'Canceled') {
                            error_handler({
                                navigation: navigation,
                                error_mssg: 'Something went wrong!',
                                svr_error_mssg: paymentResponse.error.message,
                            });
                        }
                    } else {
                        handle_final_payments();
                    }
                }
            }
        },
    });

    const handle_final_payments = () => {
        if (pHistoryID) {
            update_payment_history_mutate({
                userAuth: UserInfoStore?.user_info?.accessToken as string,
                ph_id: pHistoryID,
            });
        } else {
            navigation.push(
                'HomeStack' as never,
                {
                    screen: 'CongratulationsPage',
                    params: {
                        header_txt: 'Payment Successful!',
                        message_txt: `You have successfully paid for ${
                            sub_data.filter(
                                item =>
                                    item?.plan === route.params?.paymentPlan,
                            )?.[0]?.no_of_lessons
                        } Lessons!`,
                        nextPage: 5,
                        noOfLessons: sub_data.filter(
                            item => item?.plan === route.params?.paymentPlan,
                        )?.[0]?.no_of_lessons,
                        hide_back_btn: true,
                    },
                } as never,
            );
        }
    };

    const { mutate: paypal_intent_mutate } = useMutation(paypal_intent, {
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
                    error_mssg: 'Something went wrong!',
                    svr_error_mssg: data?.data,
                });
            } else {
                setPaypalLink(data?.data?.cl_secret);
                setPHistoryID(data?.data?.p_history?._id);
                setShowModal(true);
            }
        },
    });

    const { mutate: update_payment_history_mutate } = useMutation(
        update_payment_history,
        {
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
                        error_mssg: 'Something went wrong!',
                        svr_error_mssg: data?.data,
                    });
                } else {
                    navigation.push(
                        'HomeStack' as never,
                        {
                            screen: 'CongratulationsPage',
                            params: {
                                header_txt: 'Payment Successful!',
                                message_txt: `You have successfully paid for ${
                                    sub_data.filter(
                                        item =>
                                            item?.plan ===
                                            route.params?.paymentPlan,
                                    )?.[0]?.no_of_lessons
                                } Lessons!`,
                                nextPage: 5,
                                noOfLessons: sub_data.filter(
                                    item =>
                                        item?.plan ===
                                        route.params?.paymentPlan,
                                )?.[0]?.no_of_lessons,
                                hide_back_btn: true,
                            },
                        } as never,
                    );
                }
            },
        },
    );

    const pay_with_paypal = () => {
        if (paymentPlan) {
            paypal_intent_mutate({
                userAuth: UserInfoStore?.user_info?.accessToken as string,
                userPlan: paymentPlan,
            });
        } else {
            error_handler({
                navigation: navigation,
                error_mssg: 'No Payment Plan Selected!',
            });
        }
    };

    const pay_with_stripe = () => {
        if (paymentPlan) {
            stripe_intent_mutate({
                userAuth: UserInfoStore?.user_info?.accessToken as string,
                userPlan: paymentPlan,
            });
        } else {
            error_handler({
                navigation: navigation,
                error_mssg: 'No Payment Plan Selected!',
            });
        }
    };

    const proceed_to_pay = no_double_clicks({
        execFunc: () => {
            switch (subPM) {
                case 1:
                    pay_with_paypal();
                    break;
                case 2:
                    pay_with_stripe();
                    break;
                default:
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
            }
        },
    });

    const refresh_data = no_double_clicks({
        execFunc: () => {
            queryClient.invalidateQueries(QueryTags({}).AdminData);
        },
    });

    const handleModalResponse = ({ data }: { data: WebViewNavigation }) => {
        if (data.url.includes('/payment/paypal-cancel')) {
            setShowModal(false);
            error_handler({
                navigation: navigation,
                error_mssg: 'Payment was Cancelled!',
                header_mssg: 'Attention!',
            });
        } else if (data.url.includes('/payment/paypal-success')) {
            setShowModal(false);
            handle_final_payments();
        } else if (data.url.includes('/checkoutweb/genericError')) {
            setShowModal(false);
            error_handler({
                navigation: navigation,
                error_mssg:
                    "We aren't able to process your payment using your PayPal account at this time.\n\n\nPossible Reasons:\n\n- Insufficient Funds\n- Blocked Transaction\n- Incorrect Payment Details\n- Account Issues\n- Country Restrictions\n- Network or Connectivity Issues",
            });
        } else {
            return;
        }
    };

    return (
        <View style={styles.sub_main}>
            <CustomStatusBar
                backgroundColor={Colors.Background}
                lightContent={false}
            />
            <Modal
                visible={showModal}
                onRequestClose={() => setShowModal(false)}>
                <CustomStatusBar
                    backgroundColor={Colors.Background}
                    lightContent={false}
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
                        flex: 1,
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_false: 35,
                                      if_true: 10,
                                  })
                                : 10,
                    }}>
                    <CustomStatusBar backgroundColor={Colors.Background} />
                    <WebView
                        source={{ uri: paypalLink }}
                        onNavigationStateChange={(data: WebViewNavigation) =>
                            handleModalResponse({ data })
                        }
                    />
                </View>
            </Modal>
            <OverlaySpinner
                showSpinner={showSpinner}
                setShowSpinner={setShowSpinner}
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
                    inputText="Payment Method"
                    textSize={20}
                    textWeight={700}
                    marginLeft={10}
                />
            </View>
            {AdminStore.admin_data?._id || '' ? (
                <>
                    <ScrollView style={{ flex: 1 }}>
                        <View
                            style={{
                                backgroundColor: Colors.Border,
                                marginHorizontal: 22,
                                marginTop: screen_height_less_than({
                                    if_true: 20,
                                    if_false: 40,
                                }),
                                borderRadius: 15,
                                padding: 20,
                                paddingBottom: screen_height_less_than({
                                    if_true: 5,
                                    if_false: 20,
                                }),
                            }}>
                            <BasicText
                                inputText="Select Payment Method"
                                textSize={20}
                                textWeight={600}
                                textAlign="center"
                            />
                            <TextDivider
                                singleLine
                                marginTop={screen_height_less_than({
                                    if_true: 9,
                                    if_false: 15,
                                })}
                                marginBottom={screen_height_less_than({
                                    if_true: 20,
                                    if_false: 32,
                                })}
                            />
                            {(AdminStore.admin_data?.enable_paypal ||
                                false) && (
                                <PaymentMethod
                                    payment_method={payment_methods_data[0]}
                                    index={1}
                                    activePM={subPM}
                                    setActivePM={setSubPM}
                                />
                            )}
                            {(AdminStore.admin_data?.enable_stripe ||
                                false) && (
                                <PaymentMethod
                                    payment_method={payment_methods_data[1]}
                                    index={2}
                                    activePM={subPM}
                                    setActivePM={setSubPM}
                                />
                            )}
                        </View>
                        {/* {(AdminStore.admin_data?.enable_flutterwave ||
                            false) && ( */}
                        {false && (
                            <Fragment>
                                <BasicText
                                    inputText="or"
                                    textAlign="center"
                                    textWeight={700}
                                    marginTop={20}
                                    marginBottom={15}
                                    textSize={18}
                                />
                                <View style={{ marginHorizontal: 22 }}>
                                    <PayWithFlutterwave
                                        onRedirect={handleOnRedirect}
                                        options={{
                                            tx_ref: generateTransactionRef(10),
                                            authorization: flutterwaveKey,
                                            customer: {
                                                email: UserInfoStore?.user_info
                                                    ?.email as string,
                                                name: UserInfoStore?.user_info
                                                    ?.fullname as string,
                                                phonenumber: UserInfoStore
                                                    ?.user_info
                                                    ?.mobile as string,
                                            },
                                            amount: sub_data.filter(
                                                item =>
                                                    item?.plan === paymentPlan,
                                            )[0]?.total_price,
                                            currency: 'USD',
                                            payment_options: 'card',
                                            customizations: {
                                                title: 'Tutor AI, Inc.',
                                                description: `$${
                                                    sub_data.filter(
                                                        item =>
                                                            item?.plan ===
                                                            paymentPlan,
                                                    )[0]?.total_price
                                                } paid for ${
                                                    sub_data.filter(
                                                        item =>
                                                            item?.plan ===
                                                            paymentPlan,
                                                    )[0]?.no_of_lessons
                                                } Lessons.`,
                                            },
                                        }}
                                    />
                                </View>
                            </Fragment>
                        )}
                    </ScrollView>
                    <BasicButton
                        buttonText="Continue"
                        disabled={disableButton}
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
                        execFunc={() => proceed_to_pay({})}
                    />
                </>
            ) : (
                <>
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                        <BasicText inputText="Please, click the button below to refresh page." />
                    </View>
                    <BasicButton
                        buttonText="Refresh"
                        disabled={disableButton}
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
                        execFunc={() => refresh_data({})}
                    />
                </>
            )}
        </View>
    );
};

export default SelectPaymentPage;

const styles = StyleSheet.create({
    sub_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
