import React, { FunctionComponent, useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import BackButton from '../../Components/Back_Button/Back_Button';
import BasicTextEntry from '../../Components/Basic_Text_Entry/Basic_Text_Entry';
import BasicButton from '../../Components/Basic_Button/Basic_Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { error_handler } from '../../Utils/Error_Handler/Error_Handler';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import PhoneNumberInput from '../../Components/Phone_Number_Input/Phone_Number_Input';
import RNDropDown from '../../Components/RN_Drop_Down/RN_Drop_Down';
import Feather from 'react-native-vector-icons/Feather';
import ImagePicker from 'react-native-image-crop-picker';
import { NativeLanguagesChooser } from '../../Data/Languages/Languages';
import TextButton from '../../Components/Text_Button/Text_Button';
import { mongo_date_converter_4 } from '../../Utils/Mongo_Date_Converter/Mongo_Date_Converter';
import { get_age } from '../../Utils/Get_Age/Get_Age';
import DatePicker from 'react-native-date-picker';
import { useRef } from 'react';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { useMutation } from 'react-query';
import {
    update_dp,
    update_study_target,
    update_user_info,
} from '../../Configs/Queries/Users/Users';
import { observer } from 'mobx-react';
import { UserInfoStore } from '../../MobX/User_Info/User_Info';
import SInfo from 'react-native-sensitive-info';
import { SECURE_STORAGE_NAME, SECURE_STORAGE_USER_INFO } from '@env';
import { info_handler } from '../../Utils/Info_Handler/Info_Handler';
import { native_languages } from '../../Data/Languages/Languages';
import ImgToBase64 from 'react-native-image-base64';
import { http_link_fix } from '../../Utils/HTTP_Link_Fix/HTTP_Link_Fix';
import { get_phone_number } from '../../Utils/Get_Phone_Number/Get_Phone_Number';
import { INTF_CountryName } from '../../Interface/Country_Name/Country_Name';

const PersonalDetailsPage: FunctionComponent = observer(() => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const scrollViewRef = useRef<ScrollView | null>(null);

    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const [disableButton, setDisableButton] = useState<boolean>(false);

    const [fullName, setFullName] = useState<string>('');
    const [phoneValue, setPhoneValue] = useState<string>('9030253741');
    const [phoneNo, setPhoneNo] = useState<string>('');
    const [phoneNoValid, setPhoneNoValid] = useState<boolean>(false);
    const [renderPhoneNo, setRenderPhoneNo] = useState<boolean>(false);
    const [language, setLanguage] = useState<string>('');
    const [dob, setDOB] = useState<Date>(() => {
        const _date = new Date();
        _date.setFullYear(_date.getFullYear() - 15);
        return _date;
    });
    const [openDateModal, setOpenDateModal] = useState<boolean>(false);
    const [agePHColor, setAgePHColor] = useState<string>(Colors.Grey);
    const [displayPicture, setDisplayPicture] = useState<string>('');

    const UserInfo = UserInfoStore?.user_info;
    const [firstRun, setFirstRun] = useState<boolean>(false);
    const phone_dets = get_phone_number({
        phone: UserInfo?.mobile as string,
    });
    const [studyTarget, setStudyTarget] = useState<string>(
        UserInfo?.study_target?.toString() || '30',
    );

    const StudyTargetChooser = [
        { label: '30 Minutes', value: '30' },
        { label: '60 Minutes', value: '60' },
    ];

    const { mutate: update_study_target_mutate } = useMutation(
        update_study_target,
        {
            onMutate: () => {
                setDisableButton(true);
                setShowSpinner(true);
            },
            onSettled: async data => {
                if (data?.error) {
                    setShowSpinner(false);
                    setDisableButton(false);
                    error_handler({
                        navigation: navigation,
                        error_mssg:
                            'An error occured while trying to update Study Target!',
                        svr_error_mssg: data?.data,
                    });
                } else {
                    const prevUserInfo = UserInfoStore?.user_info;
                    const newTarget = parseInt(studyTarget, 10);

                    const update_info_proceed = () => {
                        setShowSpinner(false);
                        setDisableButton(false);

                        UserInfoStore.set_user_info({
                            user_info: {
                                ...prevUserInfo,
                                study_target: newTarget,
                            },
                        });

                        info_handler({
                            navigation: navigation,
                            proceed_type: 4,
                            success_mssg:
                                'Your Personal Details has been updated successfully!',
                            svr_success_mssg: '',
                            hide_back_btn: true,
                            hide_header: false,
                        });
                    };

                    try {
                        await SInfo.setItem(
                            SECURE_STORAGE_USER_INFO,
                            JSON.stringify({
                                user_info: {
                                    ...prevUserInfo,
                                    study_target: newTarget,
                                },
                            }),
                            {
                                sharedPreferencesName: SECURE_STORAGE_NAME,
                                keychainService: SECURE_STORAGE_NAME,
                            },
                        )
                            .catch(err => {
                                err && update_info_proceed();
                            })
                            .then(() => {
                                update_info_proceed();
                            });
                    } catch (error) {
                        update_info_proceed();
                    }
                }
            },
        },
    );

    const { mutate: update_user_info_mutate } = useMutation(update_user_info, {
        onMutate: () => {
            setDisableButton(true);
            setShowSpinner(true);
        },
        onSettled: async data => {
            if (data?.error) {
                setShowSpinner(false);
                setDisableButton(false);
                error_handler({
                    navigation: navigation,
                    error_mssg:
                        "An error occured while trying to update User's Information!",
                    svr_error_mssg: data?.data,
                });
            } else {
                const prevUserInfo = UserInfoStore?.user_info;

                const language_filter = native_languages.filter(
                    item => item.name === language,
                );
                const p_language = `${language_filter[0]?.name} - ${language_filter[0]?.code}`;

                const update_info_proceed = () => {
                    const newTarget = parseInt(studyTarget, 10);
                    UserInfoStore.set_user_info({
                        user_info: {
                            ...prevUserInfo,
                            language: p_language,
                            mobile: phoneNo,
                            dateOfBirth: dob.toString(),
                            fullname: fullName,
                        },
                    });

                    if (UserInfo.study_target === newTarget) {
                        setShowSpinner(false);
                        setDisableButton(false);
                        info_handler({
                            navigation: navigation,
                            proceed_type: 4,
                            success_mssg:
                                'Your Personal Details has been updated successfully!',
                            svr_success_mssg: '',
                            hide_back_btn: false,
                            hide_header: false,
                        });
                    } else {
                        if (newTarget === 30) {
                            update_study_target_mutate({
                                uid: UserInfoStore?.user_info?._id as string,
                                studyTarget: 30,
                            });
                        } else {
                            if ((UserInfo.payment || 0) > 0) {
                                setShowSpinner(false);
                                setDisableButton(false);
                                navigation.push(
                                    'HomeStack' as never,
                                    {
                                        screen: 'ExtraPaymentPage',
                                        params: {
                                            subscriptions: UserInfo.payment,
                                        },
                                    } as never,
                                );
                            } else {
                                update_study_target_mutate({
                                    uid: UserInfoStore?.user_info
                                        ?._id as string,
                                    studyTarget: 60,
                                });
                            }
                        }
                    }
                };

                try {
                    await SInfo.setItem(
                        SECURE_STORAGE_USER_INFO,
                        JSON.stringify({
                            user_info: {
                                ...prevUserInfo,
                                language: p_language,
                                mobile: phoneNo,
                                dateOfBirth: dob.toString(),
                                fullname: fullName,
                            },
                        }),
                        {
                            sharedPreferencesName: SECURE_STORAGE_NAME,
                            keychainService: SECURE_STORAGE_NAME,
                        },
                    )
                        .catch(err => {
                            err && update_info_proceed();
                        })
                        .then(() => {
                            update_info_proceed();
                        });
                } catch (error) {
                    update_info_proceed();
                }
            }
        },
    });

    const { mutate: update_dp_mutate } = useMutation(update_dp, {
        onMutate: () => {
            setDisableButton(true);
            setShowSpinner(true);
        },
        onSettled: async data => {
            if (data?.error) {
                setShowSpinner(false);
                setDisableButton(false);
                error_handler({
                    navigation: navigation,
                    error_mssg:
                        "An error occured while trying to update User's Display Picture!",
                    svr_error_mssg: data?.data,
                });
            } else {
                const prevUserInfo = UserInfoStore?.user_info;

                const change_dp_proceed = () => {
                    UserInfoStore.set_user_info({
                        user_info: {
                            ...prevUserInfo,
                            dp: data?.data?.dp,
                        },
                    });

                    const language_filter = native_languages.filter(
                        item => item.name === language,
                    );
                    const p_language = `${language_filter[0]?.name} - ${language_filter[0]?.code}`;
                    update_user_info_mutate({
                        uid: UserInfoStore?.user_info?._id as string,
                        email: UserInfoStore?.user_info?.email as string,
                        dateOfBirth: dob.toString(),
                        fullname: fullName,
                        language: p_language,
                        mobile: phoneNo,
                    });
                };

                try {
                    await SInfo.setItem(
                        SECURE_STORAGE_USER_INFO,
                        JSON.stringify({
                            user_info: {
                                ...prevUserInfo,
                                dp: data?.data?.dp,
                            },
                        }),
                        {
                            sharedPreferencesName: SECURE_STORAGE_NAME,
                            keychainService: SECURE_STORAGE_NAME,
                        },
                    )
                        .catch(err => {
                            err && change_dp_proceed();
                        })
                        .then(() => {
                            change_dp_proceed();
                        });
                } catch (error) {
                    change_dp_proceed();
                }
            }
        },
    });

    const open_dob = no_double_clicks({
        execFunc: () => {
            setOpenDateModal(true);
        },
    });

    const edit_personal_details = no_double_clicks({
        execFunc: () => {
            if (language !== NativeLanguagesChooser[0]?.value && language) {
                if (fullName) {
                    if (phoneNoValid && phoneNo) {
                        const language_filter = native_languages.filter(
                            item => item.name === language,
                        );
                        const p_language = `${language_filter[0]?.name} - ${language_filter[0]?.code}`;

                        if (displayPicture) {
                            update_dp_mutate({
                                uid: UserInfoStore?.user_info?._id as string,
                                displayPicture: displayPicture,
                            });
                        } else {
                            update_user_info_mutate({
                                uid: UserInfoStore?.user_info?._id as string,
                                email: UserInfoStore?.user_info
                                    ?.email as string,
                                dateOfBirth: dob.toString(),
                                fullname: fullName,
                                language: p_language,
                                mobile: phoneNo,
                            });
                        }
                    } else {
                        error_handler({
                            navigation: navigation,
                            error_mssg: 'Invalid / Incorrect Mobile Number!',
                        });
                    }
                } else {
                    error_handler({
                        navigation: navigation,
                        error_mssg: 'Invalid FullName!',
                    });
                }
            } else {
                error_handler({
                    navigation: navigation,
                    error_mssg: 'Please Select a Native Language!',
                });
            }
        },
    });

    const clear_image = () => {
        setShowSpinner(false);
        setDisplayPicture('');
        ImagePicker.clean();
    };

    const select_image_from_gallery = no_double_clicks({
        execFunc: () => {
            setShowSpinner(false);
            try {
                ImagePicker.openPicker({
                    width: 400,
                    height: 400,
                    cropping: true,
                    multiple: false,
                    includeBase64: true,
                    enableRotationGesture: true,
                    forceJpg: true,
                })
                    .catch(err => {
                        setDisplayPicture('');
                        clear_image();
                        if (err?.code !== 'E_PICKER_CANCELLED') {
                            if (err?.code !== 'E_NO_LIBRARY_PERMISSION') {
                                error_handler({
                                    navigation: navigation,
                                    error_mssg: err?.message,
                                });
                            }
                        }
                    })
                    .then(res => {
                        if (res) {
                            // @ts-ignore
                            const processed_image = `data:${res?.mime};base64,${res?.data}`;
                            setDisplayPicture(processed_image);
                        } else {
                            setDisplayPicture('');
                            clear_image();
                        }
                    });
            } catch (error) {
                setDisplayPicture('');
                clear_image();
            }
        },
    });

    const select_image_from_camera = no_double_clicks({
        execFunc: () => {
            setShowSpinner(false);
            try {
                ImagePicker.openCamera({
                    width: 400,
                    height: 400,
                    cropping: true,
                    multiple: false,
                    includeBase64: true,
                    enableRotationGesture: true,
                    forceJpg: true,
                })
                    .catch(err => {
                        setDisplayPicture('');
                        clear_image();
                        if (err?.code !== 'E_PICKER_CANCELLED') {
                            if (err?.code !== 'E_NO_CAMERA_PERMISSION') {
                                error_handler({
                                    navigation: navigation,
                                    error_mssg: err?.message,
                                });
                            }
                        }
                    })
                    .then(res => {
                        if (res) {
                            // @ts-ignore
                            const processed_image = `data:${res?.mime};base64,${res?.data}`;
                            setDisplayPicture(processed_image);
                        } else {
                            setDisplayPicture('');
                            clear_image();
                        }
                    });
            } catch (error) {
                setDisplayPicture('');
                clear_image();
            }
        },
    });

    useEffect(() => {
        const load_user_dets = () => {
            const set_data = ({ dp }: { dp: string }) => {
                setLanguage(
                    (UserInfo?.language as string)
                        ?.split('-')?.[0]
                        ?.replace(' ', ''),
                );
                setDOB(new Date(UserInfo?.dateOfBirth as string));
                setAgePHColor(Colors.Dark);
                setFullName(UserInfo?.fullname as string);
                if (dp) {
                    setDisplayPicture(dp);
                }
                if (phone_dets?.country) {
                    setPhoneValue(phone_dets?.phone);
                    setPhoneNo(UserInfo?.mobile as string);
                    setPhoneNoValid(true);
                }
                setRenderPhoneNo(true);
                setFirstRun(true);
                setShowSpinner(false);
            };

            if (UserInfo?.dp?.url) {
                try {
                    ImgToBase64.getBase64String(
                        http_link_fix({
                            http_link: UserInfo?.dp?.url as string,
                        }),
                    )
                        .catch(() => {
                            set_data({ dp: '' });
                        })
                        .then((res: any) => {
                            if (res) {
                                const u_dp = 'data:image/jpeg;base64,' + res;
                                set_data({ dp: u_dp });
                            } else {
                                set_data({ dp: '' });
                            }
                        });
                } catch (error) {
                    set_data({ dp: '' });
                }
            } else {
                set_data({ dp: '' });
            }
        };

        if (!firstRun) {
            setShowSpinner(true);
            load_user_dets();
        }
    }, [UserInfo, firstRun, phone_dets]);

    return (
        <View style={styles.pdp_main}>
            <CustomStatusBar
                showSpinner={showSpinner}
                backgroundColor={Colors.Background}
                backgroundDimColor={Colors.BackgroundDim}
            />
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
                    inputText="Personal Details"
                    textWeight={700}
                    marginLeft={10}
                    textSize={20}
                />
            </View>
            <KeyboardAvoidingView
                behavior={Platform?.OS === 'ios' ? 'padding' : undefined}
                style={{
                    flex: 1,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 5,
                }}>
                <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            marginBottom: 40,
                            marginHorizontal: 22,
                        }}>
                        <View style={styles.pdp_i_c_w}>
                            <View style={styles.pdp_i_c}>
                                {displayPicture ? (
                                    <Image
                                        style={styles.pdp_i}
                                        source={{
                                            uri: displayPicture,
                                            width: 150,
                                            height: 150,
                                        }}
                                    />
                                ) : (
                                    <Image
                                        style={styles.pdp_i}
                                        source={require('../../Images/Extra/default_user_dp_light.jpg')}
                                    />
                                )}
                            </View>
                        </View>
                        <View style={styles.pdp_sp_w}>
                            <TouchableOpacity
                                onPress={select_image_from_camera}
                                style={[
                                    styles.pdp_sp_i,
                                    {
                                        backgroundColor: Colors.Border,
                                    },
                                ]}>
                                <Feather
                                    name="camera"
                                    size={28}
                                    color={Colors.DarkGrey}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={select_image_from_gallery}
                                style={[
                                    styles.pdp_sp_i,
                                    {
                                        backgroundColor: Colors.Border,
                                    },
                                ]}>
                                <Feather
                                    name="image"
                                    size={28}
                                    color={Colors.DarkGrey}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={clear_image}
                                style={[
                                    styles.pdp_sp_i,
                                    {
                                        backgroundColor: Colors.Border,
                                    },
                                ]}>
                                <Feather
                                    name="x"
                                    size={28}
                                    color={Colors.DarkGrey}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <BasicText
                        inputText="Native Language"
                        marginLeft={22}
                        textWeight={500}
                    />
                    <RNDropDown
                        dropdownData={NativeLanguagesChooser}
                        value={language}
                        setValue={setLanguage}
                        height={56}
                        width={Dimensions?.get('window')?.width - 44}
                        disable={false}
                        paddingHorizontal={7}
                        marginRight={22}
                        marginLeft={22}
                        marginTop={10}
                        marginBottom={30}
                    />
                    <BasicText
                        inputText="Study Target"
                        marginLeft={22}
                        textWeight={500}
                    />
                    <RNDropDown
                        dropdownData={StudyTargetChooser}
                        value={studyTarget}
                        setValue={setStudyTarget}
                        height={56}
                        width={Dimensions?.get('window')?.width - 44}
                        disable={false}
                        paddingHorizontal={7}
                        marginRight={22}
                        marginLeft={22}
                        marginTop={10}
                        marginBottom={30}
                    />
                    <BasicText
                        inputText="Date of Birth"
                        marginLeft={22}
                        textWeight={500}
                    />
                    <BasicTextEntry
                        placeHolderText={mongo_date_converter_4({
                            input_date: new Date()?.toString(),
                        })}
                        inputValue={`${mongo_date_converter_4({
                            input_date: dob?.toString(),
                        })} - ${
                            get_age({
                                input_date: dob?.toString(),
                            }) === 0
                                ? ''
                                : get_age({
                                      input_date: dob?.toString(),
                                  })
                        } ${
                            get_age({
                                input_date: dob?.toString(),
                            }) === 1
                                ? 'year old'
                                : get_age({
                                      input_date: dob?.toString(),
                                  }) === 0
                                ? 'Select your Date of Birth'
                                : 'years old'
                        }`}
                        setInputValue={setDOB as any}
                        marginTop={15}
                        marginBottom={7}
                        inputMode="text"
                        editable={false}
                        textColor={agePHColor}
                    />
                    <TextButton
                        buttonText="Select Date"
                        marginLeft={'auto'}
                        marginRight={22}
                        marginBottom={10}
                        execFunc={open_dob}
                        textColor={Colors.LightPink}
                    />
                    <BasicText
                        inputText="Full Name"
                        marginLeft={22}
                        textWeight={500}
                    />
                    <BasicTextEntry
                        placeHolderText="John Doe"
                        inputValue={fullName}
                        setInputValue={setFullName}
                        marginTop={10}
                        marginBottom={30}
                        inputMode="text"
                    />
                    <BasicText
                        inputText={
                            (get_age({
                                input_date: dob?.toString(),
                            }) as number) >= 15
                                ? 'Mobile Number'
                                : "Parent's Mobile Number"
                        }
                        marginLeft={22}
                        textWeight={500}
                    />
                    {renderPhoneNo && (
                        <PhoneNumberInput
                            phoneValue={phoneValue}
                            setPhoneValue={setPhoneValue}
                            setInputValue={setPhoneNo}
                            setIsValid={setPhoneNoValid}
                            defaultCode={
                                (phone_dets?.country as INTF_CountryName) ||
                                'US'
                            }
                            marginTop={10}
                            marginBottom={10}
                        />
                    )}
                    <BasicButton
                        buttonText="Edit Details"
                        borderRadius={8}
                        marginHorizontal={22}
                        execFunc={() => edit_personal_details({})}
                        buttonHeight={56}
                        disabled={disableButton}
                        marginTop={20}
                        marginBottom={40}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
            <DatePicker
                modal
                mode="date"
                open={openDateModal}
                date={dob}
                maximumDate={new Date()}
                onConfirm={new_date => {
                    setAgePHColor(Colors.Dark);
                    setOpenDateModal(false);
                    setDOB(new_date);
                }}
                onCancel={() => {
                    setOpenDateModal(false);
                }}
            />
        </View>
    );
});

export default PersonalDetailsPage;

const styles = StyleSheet.create({
    pdp_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    pdp_i_c_w: {
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 30,
        borderWidth: 2,
        borderRadius: 160,
        padding: 3,
        borderColor: Colors.DarkGrey,
        marginBottom: 5,
    },
    pdp_i_c: {
        borderRadius: 150,
    },
    pdp_i: {
        borderRadius: 150,
        width: 150,
        height: 150,
    },
    pdp_sp_w: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: 140,
        marginTop: 30,
    },
    pdp_sp_i: {
        width: 60,
        height: 60,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        marginLeft: 10,
    },
});
