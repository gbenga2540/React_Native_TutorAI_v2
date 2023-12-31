import React, { Fragment, FunctionComponent, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import BackButton from '../../Components/Back_Button/Back_Button';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import SecureTextEntry from '../../Components/Secure_Text_Entry/Secure_Text_Entry';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { KeyboardStore } from '../../MobX/Keyboard/Keyboard';
import { Observer, observer } from 'mobx-react';
import TextButton from '../../Components/Text_Button/Text_Button';
import { useMutation } from 'react-query';
import { resend_pc_pin } from '../../Configs/Queries/Auth/Auth';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import SInfo from 'react-native-sensitive-info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_USER_INFO } from '@env';
// import ParentalControlIcon from '../../Images/SVGs/Parental_Control_Icon.svg';
// import BlockIcon from '../../Images/SVGs/Block_Icon.svg';

const ParentalControlPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const [pcPIN, setPCPIN] = useState<string>('');
    // const [showBlockApps, setShowBlockApps] = useState<boolean>(false);

    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [disableButton, setDisableButton] = useState<boolean>(false);
    const [pinText, setPinText] = useState<string>(
        "A PIN was assigned to your Account when you registered your Account. Please check your Email for the PIN or click the 'Resend PIN' to generate a new PIN. In case you can't find the code in your inbox, kindly check your spam folder.",
    );

    const { mutate: resend_pc_pin_mutate } = useMutation(resend_pc_pin, {
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
                    error_mssg: 'An error occured while trying to resend PIN!',
                    svr_error_mssg: data?.data,
                });
            } else {
                setPinText('A New PIN has been sent your Email Address!');

                const prevUserInfo = UserInfoStore?.user_info;

                const update_info = () => {
                    UserInfoStore.set_user_info({
                        user_info: {
                            ...prevUserInfo,
                            parental_control: data?.data?.pc_pin,
                        },
                    });
                };

                try {
                    await SInfo.setItem(
                        SECURE_STORAGE_USER_INFO,
                        JSON.stringify({
                            user_info: {
                                ...prevUserInfo,
                                parental_control: data?.data?.pc_pin,
                            },
                        }),
                        {
                            sharedPreferencesName: SECURE_STORAGE_NAME,
                            keychainService: SECURE_STORAGE_NAME,
                        },
                    )
                        .catch(err => {
                            err && update_info();
                        })
                        .then(() => {
                            update_info();
                        });
                } catch (error) {
                    update_info();
                }
            }
        },
    });

    // const nav_to_block_apps = no_double_clicks({
    //     execFunc: () => {
    //         navigation.push(
    //             'HomeStack' as never,
    //             {
    //                 screen: 'LockAppsPage',
    //             } as never,
    //         );
    //     },
    // });

    const resend__pin = no_double_clicks({
        execFunc: () => {
            resend_pc_pin_mutate({
                userAuth: UserInfoStore?.user_info?.accessToken as string,
            });
        },
    });

    const enable_block_apps = no_double_clicks({
        execFunc: () => {
            if (
                pcPIN?.length > 3 &&
                pcPIN?.split('').join(' ') ===
                    UserInfoStore?.user_info?.parental_control
            ) {
                // setShowBlockApps(true);
                navigation.push(
                    'HomeStack' as never,
                    {
                        screen: 'LockAppsPage',
                    } as never,
                );
            } else {
                error_handler({
                    navigation: navigation,
                    error_mssg: 'Invalid PIN!',
                });
            }
        },
    });

    return (
        <View style={styles.sub_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
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
                            : 30,
                    marginHorizontal: 22,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                <BackButton />
                <BasicText
                    inputText="Security"
                    textWeight={700}
                    textSize={20}
                    marginLeft={10}
                />
            </View>
            <View
                style={{
                    flex: 1,
                    marginHorizontal: 2,
                    paddingHorizontal: 20,
                }}>
                {/* {!showBlockApps && ( */}
                {
                    <View style={{ flex: 1 }}>
                        <Fragment>
                            <BasicText
                                inputText="Enter Parental Control PIN"
                                textSize={20}
                                textWeight={700}
                                marginTop={40}
                                textColor={Colors.Dark}
                            />
                            <BasicText
                                inputText="PIN"
                                textSize={15}
                                textWeight={500}
                                marginTop={20}
                                textColor={Colors.Dark}
                            />
                            <SecureTextEntry
                                marginHorizontal={0.01}
                                marginTop={10}
                                inputValue={pcPIN}
                                setInputValue={setPCPIN}
                                placeHolderText="Enter your PIN"
                                inputMode="numeric"
                            />
                            <TextButton
                                buttonText="Resend PIN"
                                isFontLight
                                marginLeft={'auto'}
                                marginTop={8}
                                textColor={Colors.LightPink}
                                execFunc={resend__pin}
                                disabled={disableButton}
                            />
                            <BasicText
                                inputText={pinText}
                                marginBottom={20}
                                textSize={15}
                                textWeight={500}
                                marginTop={20}
                                textColor={Colors.Dark}
                                width={280}
                                textAlign="center"
                                marginLeft={'auto'}
                                marginRight={'auto'}
                            />
                        </Fragment>
                        <Observer>
                            {() => (
                                <BasicText
                                    inputText="Please ensure that your kid does not have access to unlock this phone via password, fingerprint or any other form. This is to keep the Parental Feature enabled until you disable it."
                                    marginBottom={
                                        KeyboardStore.keyboard_active
                                            ? 30
                                            : 'auto'
                                    }
                                    textSize={15}
                                    width={250}
                                    textAlign="center"
                                    marginLeft={'auto'}
                                    marginRight={'auto'}
                                />
                            )}
                        </Observer>
                        <BasicButton
                            buttonText="Continue"
                            execFunc={() => enable_block_apps({})}
                        />
                    </View>
                }
                {/* {showBlockApps && (
                    <View
                        style={{
                            backgroundColor: Colors.LightPrimary,
                            height: 200,
                            marginVertical: 33,
                            borderRadius: 10,
                            padding: 22,
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <View
                                style={{
                                    backgroundColor: Colors.LightGreen,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: 43,
                                    height: 43,
                                    borderRadius: 43,
                                }}>
                                <ParentalControlIcon
                                    color={Colors.Green}
                                    width={22}
                                    height={22}
                                />
                            </View>
                            <BasicText
                                inputText="Parental Control"
                                textWeight={700}
                                textSize={20}
                                marginLeft={10}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={nav_to_block_apps}
                            activeOpacity={0.6}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: Colors.Primary,
                                width: 175,
                                height: 50,
                                marginTop: 'auto',
                                marginBottom: 10,
                                borderRadius: 10,
                            }}>
                            <BlockIcon color={Colors.Orange} />
                            <BasicText
                                inputText="Parental Control"
                                textWeight={500}
                                textSize={17}
                                textColor={Colors.White}
                                marginLeft={7}
                            />
                        </TouchableOpacity>
                    </View>
                )} */}
                <View
                    style={{
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 10,
                                      if_false: 40,
                                  })
                                : 20,
                    }}>
                    {''}
                </View>
            </View>
        </View>
    );
});

export default ParentalControlPage;

const styles = StyleSheet.create({
    sub_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
